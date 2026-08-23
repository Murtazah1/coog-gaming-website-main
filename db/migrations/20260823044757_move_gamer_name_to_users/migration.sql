-- Expand the user profile before the legacy members.discord_name column is
-- removed in a later, separately approved contract migration.
--
-- Rollback before contraction:
--   1. Roll the application back; the triggers keep both columns compatible.
--   2. Drop the two triggers and their functions.
--   3. Drop public.users.gamer_name only after confirming the legacy column is
--      still populated.

alter table public.users
add column if not exists gamer_name text;

update public.users as app_user
set gamer_name = member.discord_name
from public.members as member
where member.user_id = app_user.id
  and app_user.gamer_name is null;

create schema if not exists private;
revoke all on schema private from public;

-- Old application versions still write members.discord_name. New member rows
-- created by the migrated application inherit the owning user's gamer name.
create or replace function private.sync_member_gamer_name_to_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if pg_trigger_depth() > 1 then
    return new;
  end if;

  if tg_op = 'INSERT' and new.discord_name is null then
    select app_user.gamer_name
    into new.discord_name
    from public.users as app_user
    where app_user.id = new.user_id;
  else
    update public.users as app_user
    set gamer_name = new.discord_name
    where app_user.id = new.user_id
      and app_user.gamer_name is distinct from new.discord_name;
  end if;

  return new;
end;
$$;

-- New application versions write users.gamer_name. Mirror those updates for
-- any old deployment that still reads members.discord_name.
create or replace function private.sync_user_gamer_name_to_member()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if pg_trigger_depth() > 1 then
    return new;
  end if;

  update public.members as member
  set discord_name = new.gamer_name
  where member.user_id = new.id
    and member.discord_name is distinct from new.gamer_name;

  return new;
end;
$$;

revoke all on function private.sync_member_gamer_name_to_user()
from public, anon, authenticated;
revoke all on function private.sync_user_gamer_name_to_member()
from public, anon, authenticated;

drop trigger if exists sync_member_gamer_name_to_user on public.members;
create trigger sync_member_gamer_name_to_user
before insert or update of discord_name on public.members
for each row
execute function private.sync_member_gamer_name_to_user();

drop trigger if exists sync_user_gamer_name_to_member on public.users;
create trigger sync_user_gamer_name_to_member
after update of gamer_name on public.users
for each row
when (old.gamer_name is distinct from new.gamer_name)
execute function private.sync_user_gamer_name_to_member();
