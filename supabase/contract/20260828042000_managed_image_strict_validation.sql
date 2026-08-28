-- Apply only after the dual-write application release is deployed and the
-- storage audit reports that every reference is entity-scoped.
alter table public.users
  add constraint users_avatar_object_name_is_scoped
  check (
    avatar_object_name is null
    or avatar_object_name ~ (
      '^' || id::text || '/[0-9a-f-]+[.](gif|jpe?g|png|webp)$'
    )
  ) not valid;

alter table public.games
  add constraint games_image_object_name_is_scoped
  check (
    image_object_name is null
    or image_object_name ~ (
      '^' || id::text || '/[0-9a-f-]+[.](gif|jpe?g|png|webp)$'
    )
  ) not valid;

create or replace function private.validate_managed_image_reference()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  expected_bucket text;
  expected_object_name text;
  expected_url text;
  project_url text;
begin
  if tg_table_name = 'users' then
    expected_bucket := 'avatars';
    expected_object_name := new.avatar_object_name;
    expected_url := new.avatar_url;
  elsif tg_table_name = 'games' then
    expected_bucket := 'game-images';
    expected_object_name := new.image_object_name;
    expected_url := new.image_url;
  else
    raise exception 'Unsupported managed image table';
  end if;

  if (expected_object_name is null) <> (expected_url is null) then
    raise exception 'Managed image path and URL must be changed together';
  end if;

  if expected_object_name is null then
    return new;
  end if;

  if not exists (
    select 1
    from storage.objects
    where bucket_id = expected_bucket
      and name = expected_object_name
  ) then
    raise exception 'Managed image object does not exist';
  end if;

  select decrypted_secret
  into project_url
  from vault.decrypted_secrets
  where name = 'storage_reconcile_project_url'
  limit 1;

  if expected_url <> rtrim(project_url, '/')
    || '/storage/v1/object/public/'
    || expected_bucket
    || '/'
    || expected_object_name
  then
    raise exception 'Managed image URL does not match its object path';
  end if;

  return new;
end;
$function$;

drop trigger if exists validate_user_avatar_reference on public.users;
create trigger validate_user_avatar_reference
before insert or update of avatar_object_name, avatar_url on public.users
for each row execute function private.validate_managed_image_reference();

drop trigger if exists validate_game_image_reference on public.games;
create trigger validate_game_image_reference
before insert or update of image_object_name, image_url on public.games
for each row execute function private.validate_managed_image_reference();

alter table public.users validate constraint users_avatar_object_name_is_scoped;
alter table public.games validate constraint games_image_object_name_is_scoped;

-- Rollback: drop the two validation triggers and check constraints. Keep dual
-- written columns so older and newer application releases remain compatible.
