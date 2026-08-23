-- Allow signed-in users to update gamer_name under the existing users UPDATE
-- policy, which restricts writes to the caller's own row or an admin.
--
-- Rollback: revoke update (gamer_name) on public.users from authenticated;

revoke update (gamer_name) on table public.users from anon;

grant update (gamer_name)
on table public.users
to authenticated;
