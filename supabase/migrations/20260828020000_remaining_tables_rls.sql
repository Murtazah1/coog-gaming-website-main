-- Complete the Data API authorization baseline for the remaining application
-- tables. Public catalog data is read-only, check-ins are private to their
-- owner (and readable by admins), and addresses are not exposed through the
-- Data API. All mutations continue through requireAdmin-protected server
-- actions using the direct PostgreSQL connection.
--
-- This migration intentionally replaces every policy on these six tables so
-- dashboard-created or legacy permissive policies cannot widen access in a
-- different environment. Grants are reset independently because policies do
-- not revoke table privileges.
--
-- Compatibility rollback:
--   Add a new forward migration that grants INSERT, UPDATE, and DELETE only to
--   authenticated and recreates per-operation admin policies using
--   private.is_admin(auth.uid()). Never restore anon writes, broad PUBLIC
--   policies, TRUNCATE/REFERENCES/TRIGGER privileges, or disable RLS.

alter table public.events enable row level security;
alter table public.games enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.check_ins enable row level security;
alter table public.address enable row level security;

-- Start from an exact, least-privilege grant baseline. Service-role and direct
-- PostgreSQL access are unaffected by these client-role revocations.
revoke all privileges on table public.events from public, anon, authenticated;
revoke all privileges on table public.games from public, anon, authenticated;
revoke all privileges on table public.teams from public, anon, authenticated;
revoke all privileges on table public.team_members from public, anon, authenticated;
revoke all privileges on table public.check_ins from public, anon, authenticated;
revoke all privileges on table public.address from public, anon, authenticated;

do $migration$
declare
  existing_policy record;
begin
  for existing_policy in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'events',
        'games',
        'teams',
        'team_members',
        'check_ins',
        'address'
      )
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      existing_policy.policyname,
      existing_policy.schemaname,
      existing_policy.tablename
    );
  end loop;
end
$migration$;

create policy "Anyone can read events"
on public.events
for select
to anon, authenticated
using (true);

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

create policy "Anyone can read team_members"
on public.team_members
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

grant select on table public.events to anon, authenticated;
grant select on table public.games to anon, authenticated;
grant select on table public.teams to anon, authenticated;
grant select on table public.team_members to anon, authenticated;
grant select on table public.check_ins to authenticated;

-- public.address intentionally has neither policies nor client-role grants.
