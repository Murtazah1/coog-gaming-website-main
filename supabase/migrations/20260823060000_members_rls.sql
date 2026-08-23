-- Members authorization slice.
--
-- Authenticated members may read only their own membership row. Admins may
-- read every membership row. All writes remain behind requireAdmin-protected
-- server actions that use the direct PostgreSQL connection.
--
-- Rollback:
--   1. Drop "Members can read own membership".
--   2. Restore the previous members grants and policies.
--   3. Disable RLS only if the previous state intentionally had it disabled.

alter table public.members enable row level security;

drop policy if exists "Members can read all" on public.members;
drop policy if exists "Anyone can read members" on public.members;
drop policy if exists "Members can read own membership" on public.members;
drop policy if exists "Members can update own membership" on public.members;
drop policy if exists "Admins can manage members" on public.members;
drop policy if exists "Admins can update members" on public.members;
drop policy if exists "Admins can delete members" on public.members;

create policy "Members can read own membership"
on public.members
for select
to authenticated
using (
  (select auth.uid()) = user_id
  or (select private.is_admin((select auth.uid())))
);

-- Start from no Data API privileges and opt into read access only. Membership
-- creation, plan changes, expiration changes, and deletion are admin-only
-- server operations.
revoke all privileges on table public.members from anon;
revoke all privileges on table public.members from authenticated;

grant select on table public.members to authenticated;
