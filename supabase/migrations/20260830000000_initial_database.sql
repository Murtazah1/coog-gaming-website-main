-- Coog Gaming database baseline
--
-- This file bootstraps an empty Supabase database. It intentionally does not
-- contain application seed data, Auth users, or Storage objects.
--
-- Public application tables follow db/schema/*.ts. Supabase-specific objects
-- (Auth triggers, RLS, Storage buckets/policies, and scheduled cleanup) are
-- maintained here because Drizzle does not model them.
--
-- Do not run this file against an existing database. Existing environments
-- must be upgraded with forward migrations instead.

begin;

do $requirements$
begin
  if to_regclass('auth.users') is null then
    raise exception 'This baseline requires a Supabase database with auth.users';
  end if;

  if to_regclass('storage.buckets') is null
    or to_regclass('storage.objects') is null
  then
    raise exception 'This baseline requires Supabase Storage';
  end if;
end;
$requirements$;

create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_cron;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;
grant usage on schema public to anon, authenticated, service_role;

-- Application tables -------------------------------------------------------

create table public.users (
  id uuid primary key,
  email text not null unique,
  first_name text,
  last_name text,
  gamer_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  constraint users_id_fkey
    foreign key (id)
    references auth.users (id)
    on update cascade
    on delete cascade
);

create table public.games (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  image_url text
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  game_id uuid not null,
  constraint teams_game_id_name_unique unique (game_id, name),
  constraint teams_game_id_games_id_fkey
    foreign key (game_id)
    references public.games (id)
    on delete cascade
);

create table public.members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  plan_type text not null,
  current_period_end date,
  created_at timestamptz not null default now(),
  constraint members_plan_type_check
    check (plan_type in ('semester', 'year')),
  constraint members_user_id_users_id_fkey
    foreign key (user_id)
    references public.users (id)
    on delete cascade
);

create table public.admins (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null unique,
  role smallint not null,
  constraint admins_member_id_members_id_fkey
    foreign key (member_id)
    references public.members (id)
    on delete cascade
);

create table public.team_members (
  team_id uuid not null,
  member_id uuid not null,
  constraint team_members_pkey primary key (team_id, member_id),
  constraint team_members_team_id_teams_id_fkey
    foreign key (team_id)
    references public.teams (id)
    on delete cascade,
  constraint team_members_member_id_members_id_fkey
    foreign key (member_id)
    references public.members (id)
    on delete cascade
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  location text not null,
  start_date timestamptz not null,
  end_date timestamptz not null,
  created_by uuid,
  description text,
  created_at timestamptz default now(),
  constraint events_created_by_admins_id_fkey
    foreign key (created_by)
    references public.admins (id)
    on delete set null
);

create table public.check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  event_id uuid not null,
  scanned_at timestamptz default now(),
  constraint check_ins_user_id_users_id_fkey
    foreign key (user_id)
    references public.users (id),
  constraint check_ins_event_id_events_id_fkey
    foreign key (event_id)
    references public.events (id)
);

create table public.address (
  id uuid primary key default gen_random_uuid(),
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  country text not null,
  created_at timestamptz not null default now(),
  constraint address_id_members_id_fkey
    foreign key (id)
    references public.members (id)
    on delete cascade
);

create index members_current_period_end_idx
  on public.members (current_period_end);
create index idx_team_members_member_id
  on public.team_members (member_id);
create index idx_events_created_by
  on public.events (created_by);
create index idx_check_ins_user_id
  on public.check_ins (user_id);
create index idx_check_ins_event_id
  on public.check_ins (event_id);

comment on table public.address is 'Addresses that users can store';
comment on column public.admins.role is
  '0: President, 1: VP, 2: Treasurer, 3: Secretary, 4: Esports Director, 5: Board Game Manager, 6: Tabletop Manager, 7: TCG Manager, 8: Event Manager, 9: Sponsorship Manager, 10: Officer';

-- Auth helpers and triggers ------------------------------------------------

create or replace function private.is_admin(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.admins as admin
    inner join public.members as member
      on member.id = admin.member_id
    where member.user_id = $1
  );
$function$;

revoke all on function private.is_admin(uuid) from public, anon, authenticated;
grant execute on function private.is_admin(uuid) to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  insert into public.users (
    id,
    email,
    first_name,
    last_name,
    gamer_name
  )
  values (
    new.id,
    new.email,
    nullif(btrim(new.raw_user_meta_data ->> 'first_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'last_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'gamer_name'), '')
  )
  on conflict (id) do update
    set email = excluded.email;

  return new;
end;
$function$;

revoke all on function public.handle_new_user()
  from public, anon, authenticated;
grant execute on function public.handle_new_user() to service_role;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
after update of email on auth.users
for each row
when (old.email is distinct from new.email)
execute function public.handle_new_user();

-- Row-level security and Data API grants ----------------------------------

alter table public.users enable row level security;
alter table public.games enable row level security;
alter table public.teams enable row level security;
alter table public.members enable row level security;
alter table public.admins enable row level security;
alter table public.team_members enable row level security;
alter table public.events enable row level security;
alter table public.check_ins enable row level security;
alter table public.address enable row level security;

revoke all privileges on table public.users
  from public, anon, authenticated;
revoke all privileges on table public.games
  from public, anon, authenticated;
revoke all privileges on table public.teams
  from public, anon, authenticated;
revoke all privileges on table public.members
  from public, anon, authenticated;
revoke all privileges on table public.admins
  from public, anon, authenticated;
revoke all privileges on table public.team_members
  from public, anon, authenticated;
revoke all privileges on table public.events
  from public, anon, authenticated;
revoke all privileges on table public.check_ins
  from public, anon, authenticated;
revoke all privileges on table public.address
  from public, anon, authenticated;

grant all privileges on table public.users to service_role;
grant all privileges on table public.games to service_role;
grant all privileges on table public.teams to service_role;
grant all privileges on table public.members to service_role;
grant all privileges on table public.admins to service_role;
grant all privileges on table public.team_members to service_role;
grant all privileges on table public.events to service_role;
grant all privileges on table public.check_ins to service_role;
grant all privileges on table public.address to service_role;

create policy "Users can read own profile"
on public.users
for select
to authenticated
using (
  (select auth.uid()) = id
  or (select private.is_admin((select auth.uid())))
);

create policy "Users can update own profile"
on public.users
for update
to authenticated
using (
  (select auth.uid()) = id
  or (select private.is_admin((select auth.uid())))
)
with check (
  (select auth.uid()) = id
  or (select private.is_admin((select auth.uid())))
);

create policy "Anyone can read games"
on public.games
for select
to anon, authenticated
using (true);

create policy "Anyone can read teams"
on public.teams
for select
to anon, authenticated
using (true);

create policy "Members can read own membership"
on public.members
for select
to authenticated
using (
  (select auth.uid()) = user_id
  or (select private.is_admin((select auth.uid())))
);

create policy "Anyone can read admins"
on public.admins
for select
to anon, authenticated
using (true);

create policy "Anyone can read team_members"
on public.team_members
for select
to anon, authenticated
using (true);

create policy "Anyone can read events"
on public.events
for select
to anon, authenticated
using (true);

create policy "Users and admins can read check_ins"
on public.check_ins
for select
to authenticated
using (
  (select auth.uid()) = user_id
  or (select private.is_admin((select auth.uid())))
);

grant select on table public.users to authenticated;
grant update (first_name, last_name, gamer_name, avatar_url)
  on table public.users
  to authenticated;
grant select on table public.games to anon, authenticated;
grant select on table public.teams to anon, authenticated;
grant select on table public.members to authenticated;
grant select on table public.admins to anon, authenticated;
grant select on table public.team_members to anon, authenticated;
grant select on table public.events to anon, authenticated;
grant select on table public.check_ins to authenticated;

-- Supabase Storage ---------------------------------------------------------

insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('game-images', 'game-images', true)
on conflict (id) do update
set name = excluded.name,
    public = excluded.public;

drop policy if exists "Authenticated reads are scoped for managed image buckets"
  on storage.objects;
drop policy if exists "Authenticated inserts are scoped for managed image buckets"
  on storage.objects;
drop policy if exists "Authenticated updates are scoped for managed image buckets"
  on storage.objects;
drop policy if exists "Authenticated deletes are scoped for managed image buckets"
  on storage.objects;
drop policy if exists "Anonymous reads are denied for managed image buckets"
  on storage.objects;
drop policy if exists "Anonymous inserts are denied for managed image buckets"
  on storage.objects;
drop policy if exists "Anonymous updates are denied for managed image buckets"
  on storage.objects;
drop policy if exists "Anonymous deletes are denied for managed image buckets"
  on storage.objects;
drop policy if exists "Users can read own avatar objects" on storage.objects;
drop policy if exists "Users can insert own avatar objects" on storage.objects;
drop policy if exists "Users can update own avatar objects" on storage.objects;
drop policy if exists "Users can delete own avatar objects" on storage.objects;
drop policy if exists "Admins can read game image objects" on storage.objects;
drop policy if exists "Admins can insert game image objects" on storage.objects;
drop policy if exists "Admins can update game image objects" on storage.objects;
drop policy if exists "Admins can delete game image objects" on storage.objects;

create policy "Authenticated reads are scoped for managed image buckets"
on storage.objects
as restrictive
for select
to authenticated
using (
  bucket_id not in ('avatars', 'game-images')
  or (
    bucket_id = 'avatars'
    and (
      (storage.foldername(name))[1] = (select auth.uid()::text)
      or (select private.is_admin((select auth.uid())))
    )
  )
  or (
    bucket_id = 'game-images'
    and (select private.is_admin((select auth.uid())))
  )
);

create policy "Authenticated inserts are scoped for managed image buckets"
on storage.objects
as restrictive
for insert
to authenticated
with check (
  bucket_id not in ('avatars', 'game-images')
  or (
    bucket_id = 'avatars'
    and (
      (storage.foldername(name))[1] = (select auth.uid()::text)
      or (select private.is_admin((select auth.uid())))
    )
  )
  or (
    bucket_id = 'game-images'
    and (select private.is_admin((select auth.uid())))
  )
);

create policy "Authenticated updates are scoped for managed image buckets"
on storage.objects
as restrictive
for update
to authenticated
using (
  bucket_id not in ('avatars', 'game-images')
  or (
    bucket_id = 'avatars'
    and (
      (storage.foldername(name))[1] = (select auth.uid()::text)
      or (select private.is_admin((select auth.uid())))
    )
  )
  or (
    bucket_id = 'game-images'
    and (select private.is_admin((select auth.uid())))
  )
)
with check (
  bucket_id not in ('avatars', 'game-images')
  or (
    bucket_id = 'avatars'
    and (
      (storage.foldername(name))[1] = (select auth.uid()::text)
      or (select private.is_admin((select auth.uid())))
    )
  )
  or (
    bucket_id = 'game-images'
    and (select private.is_admin((select auth.uid())))
  )
);

create policy "Authenticated deletes are scoped for managed image buckets"
on storage.objects
as restrictive
for delete
to authenticated
using (
  bucket_id not in ('avatars', 'game-images')
  or (
    bucket_id = 'avatars'
    and (
      (storage.foldername(name))[1] = (select auth.uid()::text)
      or (select private.is_admin((select auth.uid())))
    )
  )
  or (
    bucket_id = 'game-images'
    and (select private.is_admin((select auth.uid())))
  )
);

create policy "Anonymous reads are denied for managed image buckets"
on storage.objects
as restrictive
for select
to anon
using (bucket_id not in ('avatars', 'game-images'));

create policy "Anonymous inserts are denied for managed image buckets"
on storage.objects
as restrictive
for insert
to anon
with check (bucket_id not in ('avatars', 'game-images'));

create policy "Anonymous updates are denied for managed image buckets"
on storage.objects
as restrictive
for update
to anon
using (bucket_id not in ('avatars', 'game-images'))
with check (bucket_id not in ('avatars', 'game-images'));

create policy "Anonymous deletes are denied for managed image buckets"
on storage.objects
as restrictive
for delete
to anon
using (bucket_id not in ('avatars', 'game-images'));

create policy "Users can read own avatar objects"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'avatars'
  and (
    (storage.foldername(name))[1] = (select auth.uid()::text)
    or (select private.is_admin((select auth.uid())))
  )
);

create policy "Users can insert own avatar objects"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (
    (storage.foldername(name))[1] = (select auth.uid()::text)
    or (select private.is_admin((select auth.uid())))
  )
);

create policy "Users can update own avatar objects"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and (
    (storage.foldername(name))[1] = (select auth.uid()::text)
    or (select private.is_admin((select auth.uid())))
  )
)
with check (
  bucket_id = 'avatars'
  and (
    (storage.foldername(name))[1] = (select auth.uid()::text)
    or (select private.is_admin((select auth.uid())))
  )
);

create policy "Users can delete own avatar objects"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (
    (storage.foldername(name))[1] = (select auth.uid()::text)
    or (select private.is_admin((select auth.uid())))
  )
);

create policy "Admins can read game image objects"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'game-images'
  and (select private.is_admin((select auth.uid())))
);

create policy "Admins can insert game image objects"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'game-images'
  and (select private.is_admin((select auth.uid())))
);

create policy "Admins can update game image objects"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'game-images'
  and (select private.is_admin((select auth.uid())))
)
with check (
  bucket_id = 'game-images'
  and (select private.is_admin((select auth.uid())))
);

create policy "Admins can delete game image objects"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'game-images'
  and (select private.is_admin((select auth.uid())))
);

-- Expired membership cleanup ----------------------------------------------

create or replace function private.delete_expired_non_admin_members()
returns bigint
language plpgsql
security definer
set search_path = ''
as $function$
declare
  deleted_count bigint;
begin
  delete from public.members as member
  where member.current_period_end is not null
    and member.current_period_end <
      (statement_timestamp() at time zone 'America/Chicago')::date
    and not exists (
      select 1
      from public.admins as admin
      where admin.member_id = member.id
    );

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$function$;

comment on function private.delete_expired_non_admin_members() is
  'Deletes non-admin member rows after their final active date; preserves users and skips admins.';

revoke all on function private.delete_expired_non_admin_members()
  from public, anon, authenticated;

do $schedule$
declare
  existing_job_id bigint;
begin
  for existing_job_id in
    select jobid
    from cron.job
    where jobname = 'delete-expired-non-admin-members'
  loop
    perform cron.unschedule(existing_job_id);
  end loop;

  perform cron.schedule(
    'delete-expired-non-admin-members',
    '5 * * * *',
    'select private.delete_expired_non_admin_members()'
  );
end;
$schedule$;

commit;
