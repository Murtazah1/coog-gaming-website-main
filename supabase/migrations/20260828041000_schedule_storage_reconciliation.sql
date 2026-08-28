-- Invoke the managed-image cleanup worker every five minutes. The request URL
-- and shared secret are read from Vault at execution time so neither value is
-- stored in the migration or cron command.
create extension if not exists pg_net;

do $schedule$
declare
  existing_job_id bigint;
begin
  for existing_job_id in
    select jobid
    from cron.job
    where jobname = 'reconcile-managed-images'
  loop
    perform cron.unschedule(existing_job_id);
  end loop;

  perform cron.schedule(
    'reconcile-managed-images',
    '*/5 * * * *',
    $command$
      select net.http_post(
        url := (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'storage_reconcile_project_url'
          limit 1
        ) || '/functions/v1/storage-reconcile',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-storage-cleanup-secret', (
            select decrypted_secret
            from vault.decrypted_secrets
            where name = 'storage_reconcile_secret'
            limit 1
          )
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 10000
      )
    $command$
  );
end;
$schedule$;

-- Rollback: unschedule reconcile-managed-images. Keep Vault secrets and queue
-- history until all in-flight cleanup attempts have been reviewed.
