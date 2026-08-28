-- Expand managed image references without removing the legacy public URL
-- columns. Application code dual-writes both fields until the new release is
-- verified, after which a separate forward migration may contract the URLs.
alter table public.users
  add column if not exists avatar_object_name text;

alter table public.games
  add column if not exists image_object_name text;

update public.users
set avatar_object_name = substring(
  avatar_url from '/storage/v1/object/public/avatars/(.*)$'
)
where avatar_url is not null
  and avatar_object_name is null;

update public.games
set image_object_name = substring(
  image_url from '/storage/v1/object/public/game-images/(.*)$'
)
where image_url is not null
  and image_object_name is null;

create unique index if not exists users_avatar_object_name_idx
  on public.users (avatar_object_name)
  where avatar_object_name is not null;

create unique index if not exists games_image_object_name_idx
  on public.games (image_object_name)
  where image_object_name is not null;

create table if not exists public.storage_cleanup_queue (
  id uuid primary key default gen_random_uuid(),
  bucket_id text not null
    check (bucket_id in ('avatars', 'game-images')),
  object_name text not null
    check (length(object_name) > 0),
  reason text not null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'deleted', 'cancelled', 'failed')),
  attempts integer not null default 0
    check (attempts >= 0),
  not_before timestamptz not null default clock_timestamp(),
  last_error text,
  first_seen_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  deleted_at timestamptz,
  constraint storage_cleanup_queue_object_key unique (bucket_id, object_name)
);

create index if not exists storage_cleanup_queue_due_idx
  on public.storage_cleanup_queue (not_before, first_seen_at)
  where status = 'pending';

alter table public.storage_cleanup_queue enable row level security;
revoke all privileges on table public.storage_cleanup_queue
  from public, anon, authenticated;
grant select, insert, update on table public.storage_cleanup_queue
  to service_role;

create schema if not exists private;

create or replace function private.enqueue_storage_cleanup(
  requested_bucket text,
  requested_object_name text,
  requested_reason text,
  requested_not_before timestamptz default clock_timestamp()
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if requested_bucket not in ('avatars', 'game-images') then
    raise exception 'Unsupported managed image bucket';
  end if;

  if nullif(requested_object_name, '') is null then
    return;
  end if;

  insert into public.storage_cleanup_queue (
    bucket_id,
    object_name,
    reason,
    status,
    attempts,
    not_before,
    last_error,
    updated_at,
    deleted_at
  )
  values (
    requested_bucket,
    requested_object_name,
    requested_reason,
    'pending',
    0,
    requested_not_before,
    null,
    clock_timestamp(),
    null
  )
  on conflict (bucket_id, object_name) do update
  set reason = excluded.reason,
      status = 'pending',
      attempts = 0,
      not_before = least(
        public.storage_cleanup_queue.not_before,
        excluded.not_before
      ),
      last_error = null,
      updated_at = clock_timestamp(),
      deleted_at = null;
end;
$function$;

revoke all on function private.enqueue_storage_cleanup(text, text, text, timestamptz)
  from public, anon, authenticated;

create or replace function private.queue_replaced_user_avatar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if tg_op = 'DELETE' and old.avatar_object_name is not null then
    perform private.enqueue_storage_cleanup(
      'avatars',
      old.avatar_object_name,
      'user_deleted'
    );
  elsif tg_op = 'UPDATE'
    and old.avatar_object_name is not null
    and old.avatar_object_name is distinct from new.avatar_object_name
  then
    perform private.enqueue_storage_cleanup(
      'avatars',
      old.avatar_object_name,
      'avatar_replaced'
    );
  end if;

  return null;
end;
$function$;

create or replace function private.queue_replaced_game_image()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if tg_op = 'DELETE' and old.image_object_name is not null then
    perform private.enqueue_storage_cleanup(
      'game-images',
      old.image_object_name,
      'game_deleted'
    );
  elsif tg_op = 'UPDATE'
    and old.image_object_name is not null
    and old.image_object_name is distinct from new.image_object_name
  then
    perform private.enqueue_storage_cleanup(
      'game-images',
      old.image_object_name,
      'game_image_replaced'
    );
  end if;

  return null;
end;
$function$;

drop trigger if exists queue_replaced_user_avatar on public.users;
create trigger queue_replaced_user_avatar
after update or delete on public.users
for each row execute function private.queue_replaced_user_avatar();

drop trigger if exists queue_replaced_game_image on public.games;
create trigger queue_replaced_game_image
after update or delete on public.games
for each row execute function private.queue_replaced_game_image();

create or replace function public.storage_image_is_referenced(
  requested_bucket text,
  requested_object_name text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select case requested_bucket
    when 'avatars' then exists (
      select 1
      from public.users
      where avatar_object_name = requested_object_name
    )
    when 'game-images' then exists (
      select 1
      from public.games
      where image_object_name = requested_object_name
    )
    else true
  end;
$function$;

create or replace function public.refresh_storage_cleanup_candidates(
  orphan_grace interval default interval '24 hours'
)
returns integer
language plpgsql
security definer
set search_path = ''
as $function$
declare
  queued_count integer;
begin
  update public.storage_cleanup_queue
  set status = 'pending',
      not_before = clock_timestamp(),
      updated_at = clock_timestamp(),
      last_error = 'Recovered an interrupted cleanup attempt.'
  where status = 'processing'
    and updated_at < clock_timestamp() - interval '15 minutes';

  insert into public.storage_cleanup_queue (
    bucket_id,
    object_name,
    reason,
    not_before
  )
  select
    object.bucket_id,
    object.name,
    'orphan_scan',
    clock_timestamp()
  from storage.objects as object
  where object.bucket_id in ('avatars', 'game-images')
    and object.name <> '.emptyFolderPlaceholder'
    and object.created_at <= clock_timestamp() - orphan_grace
    and not public.storage_image_is_referenced(object.bucket_id, object.name)
  on conflict (bucket_id, object_name) do update
  set status = case
        when public.storage_cleanup_queue.status = 'deleted' then 'pending'
        else public.storage_cleanup_queue.status
      end,
      not_before = case
        when public.storage_cleanup_queue.status = 'deleted'
          then clock_timestamp()
        else public.storage_cleanup_queue.not_before
      end,
      updated_at = clock_timestamp(),
      deleted_at = case
        when public.storage_cleanup_queue.status = 'deleted' then null
        else public.storage_cleanup_queue.deleted_at
      end;

  get diagnostics queued_count = row_count;
  return queued_count;
end;
$function$;

create or replace function public.claim_storage_cleanup_batch(
  requested_limit integer default 50
)
returns table (
  id uuid,
  bucket_id text,
  object_name text,
  reason text,
  attempts integer
)
language sql
security definer
set search_path = ''
as $function$
  with candidates as (
    select queue.id
    from public.storage_cleanup_queue as queue
    where queue.status = 'pending'
      and queue.not_before <= clock_timestamp()
      and queue.attempts < 10
    order by queue.not_before, queue.first_seen_at
    for update skip locked
    limit greatest(1, least(requested_limit, 100))
  )
  update public.storage_cleanup_queue as queue
  set status = 'processing',
      attempts = queue.attempts + 1,
      updated_at = clock_timestamp()
  from candidates
  where queue.id = candidates.id
  returning
    queue.id,
    queue.bucket_id,
    queue.object_name,
    queue.reason,
    queue.attempts;
$function$;

create or replace function public.resolve_storage_cleanup(
  requested_id uuid,
  outcome text,
  error_message text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  current_attempts integer;
begin
  if outcome not in ('deleted', 'cancelled', 'retry') then
    raise exception 'Invalid storage cleanup outcome';
  end if;

  select attempts
  into current_attempts
  from public.storage_cleanup_queue
  where id = requested_id
  for update;

  if not found then
    raise exception 'Storage cleanup item not found';
  end if;

  update public.storage_cleanup_queue
  set status = case
        when outcome = 'deleted' then 'deleted'
        when outcome = 'cancelled' then 'cancelled'
        when current_attempts >= 10 then 'failed'
        else 'pending'
      end,
      not_before = case
        when outcome = 'retry' and current_attempts < 10 then
          clock_timestamp() + make_interval(
            mins => least(1440, power(2, least(current_attempts, 10))::integer)
          )
        else not_before
      end,
      last_error = error_message,
      updated_at = clock_timestamp(),
      deleted_at = case when outcome = 'deleted' then clock_timestamp() else null end
  where id = requested_id;
end;
$function$;

revoke all on function public.storage_image_is_referenced(text, text)
  from public, anon, authenticated;
revoke all on function public.refresh_storage_cleanup_candidates(interval)
  from public, anon, authenticated;
revoke all on function public.claim_storage_cleanup_batch(integer)
  from public, anon, authenticated;
revoke all on function public.resolve_storage_cleanup(uuid, text, text)
  from public, anon, authenticated;

grant execute on function public.storage_image_is_referenced(text, text)
  to service_role;
grant execute on function public.refresh_storage_cleanup_candidates(interval)
  to service_role;
grant execute on function public.claim_storage_cleanup_batch(integer)
  to service_role;
grant execute on function public.resolve_storage_cleanup(uuid, text, text)
  to service_role;

-- Rollback: disable the queue triggers and worker first. The added columns and
-- queue are safe to retain while application versions overlap. Do not drop the
-- legacy URL columns or cleanup history as part of rollback.
