-- Some environments contain a dashboard-created events_created_by_fkey in
-- addition to the Drizzle-named constraint. Its ON DELETE CASCADE behavior
-- would delete historical events before the canonical SET NULL constraint can
-- preserve them. Reconcile both known names to one deterministic definition.
alter table public.events
  drop constraint if exists events_created_by_fkey;

alter table public.events
  drop constraint if exists events_created_by_admins_id_fk;

alter table public.events
  alter column created_by drop not null;

alter table public.events
  add constraint events_created_by_admins_id_fk
  foreign key (created_by)
  references public.admins (id)
  on delete set null;

-- Compatibility rollback (use a forward migration): assign an admin to every
-- event whose created_by is null before restoring NOT NULL / NO ACTION. Never
-- restore the legacy cascading constraint because it destroys event history.
