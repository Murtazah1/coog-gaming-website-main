-- Admin authorization slice.
--
-- Leadership rows remain publicly readable. All mutations go through
-- requireAdmin-protected server actions using the direct PostgreSQL connection.
--
-- Rollback:
--   1. Drop "Anyone can read admins".
--   2. Restore the previous admins grants and policies only if Data API writes
--      are intentionally required.
--   3. Disable RLS only if the previous state intentionally had it disabled.

alter table public.admins enable row level security;

drop policy if exists "Anyone can read admins" on public.admins;
drop policy if exists "Admins can manage admins" on public.admins;
drop policy if exists "Admins can insert admins" on public.admins;
drop policy if exists "Admins can update admins" on public.admins;
drop policy if exists "Admins can delete admins" on public.admins;

create policy "Anyone can read admins"
on public.admins
for select
to anon, authenticated
using (true);

-- Remove INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, and TRIGGER access,
-- then opt client roles back into public read access only.
revoke all privileges on table public.admins from public, anon, authenticated;

grant select on table public.admins to anon, authenticated;
