-- Populate the mirrored public user profile from metadata supplied during
-- public signup. The same function also handles Auth email updates, so its
-- conflict branch must update only email to avoid restoring stale metadata
-- over profile changes made after signup.
--
-- Rollback: replace this function with the previous id/email-only insert.
-- Existing first_name, last_name, and gamer_name values remain intact.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  insert into public.users (
    id,
    email,
    first_name,
    last_name,
    gamer_name
  )
  values (
    new.id,
    new.email,
    nullif(btrim(new.raw_user_meta_data ->> 'first_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'last_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'gamer_name'), '')
  )
  on conflict (id) do update
    set email = excluded.email;

  return new;
end;
$function$;

revoke all on function public.handle_new_user()
from public, anon, authenticated;
