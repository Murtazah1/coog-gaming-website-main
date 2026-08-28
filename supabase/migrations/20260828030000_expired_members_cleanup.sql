-- Preserve historical events if their creating admin is removed manually.
-- New and edited events still require an admin through the server-action input
-- validation; null is reserved for historical rows whose admin was deleted.
alter table public.events
  drop constraint if exists events_created_by_admins_id_fk;

alter table public.events
  alter column created_by drop not null;

alter table public.events
  add constraint events_created_by_admins_id_fk
  foreign key (created_by)
  references public.admins (id)
  on delete set null;

-- Expiration checks scan this column on every scheduled run.
create index if not exists members_current_period_end_idx
  on public.members (current_period_end);

create schema if not exists private;

-- Delete expired non-admin memberships while leaving the associated public
-- user/Auth account intact. Existing foreign keys cascade team roster and
-- address rows. Admin memberships are deliberately excluded from automation.
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
      (statement_timestamp() at time zone 'America/New_York')::date
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

-- PostgreSQL row triggers cannot react to the passage of time. Supabase Cron
-- runs the cleanup shortly after each hour; the America/New_York date check
-- makes the first run after local midnight effective across daylight savings.
create extension if not exists pg_cron;

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

-- Compatibility rollback (use a forward migration):
--   1. Unschedule delete-expired-non-admin-members.
--   2. Drop private.delete_expired_non_admin_members() and the expiration index.
--   3. Before restoring created_by NOT NULL / ON DELETE NO ACTION, assign an
--      admin to every event whose created_by is null; the contraction must not
--      discard historical events.
