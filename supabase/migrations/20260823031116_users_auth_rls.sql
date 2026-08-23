-- Users-only authorization slice (applied as Supabase migration 20260823031116).
--
-- Rollback path:
--   1. Drop on_auth_user_email_updated from auth.users.
--   2. Drop the two policies created below.
--   3. Restore the previous users SELECT/UPDATE policies and grants.
--   4. Drop private.is_admin(uuid) only after no other policies depend on it.

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.is_admin(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admins as admin
    inner join public.members as member
      on member.id = admin.member_id
    where member.user_id = $1
  );
$$;

revoke all on function private.is_admin(uuid) from public;
grant execute on function private.is_admin(uuid) to authenticated;

alter table public.users enable row level security;

drop policy if exists "Users can read all" on public.users;
drop policy if exists "Users can update own profile" on public.users;
drop policy if exists "Users can read own profile" on public.users;

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

-- Start from no Data API privileges, then opt into the required operations.
-- Admin-only full user management continues through protected server actions.
revoke all privileges on table public.users from anon;
revoke all privileges on table public.users from authenticated;

grant select on table public.users to authenticated;
grant update (first_name, last_name, avatar_url)
on table public.users
to authenticated;

-- The Auth trigger runs as its owner and does not need to be executable as RPC.
revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_email_updated on auth.users;

create trigger on_auth_user_email_updated
after update of email on auth.users
for each row
when (old.email is distinct from new.email)
execute function public.handle_new_user();
