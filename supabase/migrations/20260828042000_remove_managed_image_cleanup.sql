-- Reconcile the database with the restored URL-based Storage implementation.
-- This migration is intentionally idempotent because the cleanup objects may
-- already have been removed through the Supabase dashboard.

do $unschedule$
declare
  existing_job_id bigint;
begin
  if to_regclass('cron.job') is not null then
    for existing_job_id in
      select jobid
      from cron.job
      where jobname = 'reconcile-managed-images'
    loop
      perform cron.unschedule(existing_job_id);
    end loop;
  end if;
end;
$unschedule$;

drop trigger if exists queue_replaced_user_avatar on public.users;
drop trigger if exists queue_replaced_game_image on public.games;

drop function if exists private.queue_replaced_user_avatar();
drop function if exists private.queue_replaced_game_image();
drop function if exists public.refresh_storage_cleanup_candidates(interval);
drop function if exists public.claim_storage_cleanup_batch(integer);
drop function if exists public.resolve_storage_cleanup(uuid, text, text);
drop function if exists public.storage_image_is_referenced(text, text);
drop function if exists private.enqueue_storage_cleanup(
  text,
  text,
  text,
  timestamptz
);

drop table if exists public.storage_cleanup_queue;

alter table public.users
  drop column if exists avatar_object_name;

alter table public.games
  drop column if exists image_object_name;

do $delete_vault_secrets$
declare
  secret_id uuid;
begin
  if to_regclass('vault.secrets') is not null then
    for secret_id in
      select id
      from vault.secrets
      where name in (
        'storage_reconcile_project_url',
        'storage_reconcile_secret'
      )
    loop
      perform vault.delete_secret(secret_id);
    end loop;
  end if;
end;
$delete_vault_secrets$;

-- Rollback requires reapplying the managed-image expansion migration before
-- deploying application code that reads canonical object-name columns.
