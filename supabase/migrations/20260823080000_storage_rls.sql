-- Storage authorization slice for the public avatars and game-images buckets.
--
-- Both buckets are expected to remain public so files can be rendered through
-- getPublicUrl(). Public buckets bypass RLS only when serving an object URL;
-- listing metadata and every write operation still use storage.objects RLS.
--
-- Avatar object names owned by a user must use this shape:
--   <auth.uid()>/<generated-file-name>
-- Administrators may also manage legacy/root-level avatar objects.
--
-- Service-role clients bypass these policies. Every server action using the
-- service role must therefore enforce its own authorization before calling
-- the Storage API.
--
-- The restrictive guard policies make this migration safe even if a legacy
-- permissive policy still exists: permissive policies are ORed together, while
-- every applicable restrictive policy must also pass.
--
-- Rollback: drop the sixteen policies created below from storage.objects.

drop policy if exists "Authenticated reads are scoped for managed image buckets" on storage.objects;
drop policy if exists "Authenticated inserts are scoped for managed image buckets" on storage.objects;
drop policy if exists "Authenticated updates are scoped for managed image buckets" on storage.objects;
drop policy if exists "Authenticated deletes are scoped for managed image buckets" on storage.objects;
drop policy if exists "Anonymous reads are denied for managed image buckets" on storage.objects;
drop policy if exists "Anonymous inserts are denied for managed image buckets" on storage.objects;
drop policy if exists "Anonymous updates are denied for managed image buckets" on storage.objects;
drop policy if exists "Anonymous deletes are denied for managed image buckets" on storage.objects;

drop policy if exists "Users can read own avatar objects" on storage.objects;
drop policy if exists "Users can insert own avatar objects" on storage.objects;
drop policy if exists "Users can update own avatar objects" on storage.objects;
drop policy if exists "Users can delete own avatar objects" on storage.objects;
drop policy if exists "Admins can read game image objects" on storage.objects;
drop policy if exists "Admins can insert game image objects" on storage.objects;
drop policy if exists "Admins can update game image objects" on storage.objects;
drop policy if exists "Admins can delete game image objects" on storage.objects;

-- Restrictive policies prevent any broader legacy policy from widening access
-- to these two buckets. They evaluate to true for unrelated buckets so their
-- existing policies continue to work unchanged.
create policy "Authenticated reads are scoped for managed image buckets"
on storage.objects
as restrictive
for select
to authenticated
using (
  bucket_id not in ('avatars', 'game-images')
  or (
    bucket_id = 'avatars'
    and (
      (storage.foldername(name))[1] = (select auth.uid()::text)
      or (select private.is_admin((select auth.uid())))
    )
  )
  or (
    bucket_id = 'game-images'
    and (select private.is_admin((select auth.uid())))
  )
);

create policy "Authenticated inserts are scoped for managed image buckets"
on storage.objects
as restrictive
for insert
to authenticated
with check (
  bucket_id not in ('avatars', 'game-images')
  or (
    bucket_id = 'avatars'
    and (
      (storage.foldername(name))[1] = (select auth.uid()::text)
      or (select private.is_admin((select auth.uid())))
    )
  )
  or (
    bucket_id = 'game-images'
    and (select private.is_admin((select auth.uid())))
  )
);

create policy "Authenticated updates are scoped for managed image buckets"
on storage.objects
as restrictive
for update
to authenticated
using (
  bucket_id not in ('avatars', 'game-images')
  or (
    bucket_id = 'avatars'
    and (
      (storage.foldername(name))[1] = (select auth.uid()::text)
      or (select private.is_admin((select auth.uid())))
    )
  )
  or (
    bucket_id = 'game-images'
    and (select private.is_admin((select auth.uid())))
  )
)
with check (
  bucket_id not in ('avatars', 'game-images')
  or (
    bucket_id = 'avatars'
    and (
      (storage.foldername(name))[1] = (select auth.uid()::text)
      or (select private.is_admin((select auth.uid())))
    )
  )
  or (
    bucket_id = 'game-images'
    and (select private.is_admin((select auth.uid())))
  )
);

create policy "Authenticated deletes are scoped for managed image buckets"
on storage.objects
as restrictive
for delete
to authenticated
using (
  bucket_id not in ('avatars', 'game-images')
  or (
    bucket_id = 'avatars'
    and (
      (storage.foldername(name))[1] = (select auth.uid()::text)
      or (select private.is_admin((select auth.uid())))
    )
  )
  or (
    bucket_id = 'game-images'
    and (select private.is_admin((select auth.uid())))
  )
);

create policy "Anonymous reads are denied for managed image buckets"
on storage.objects
as restrictive
for select
to anon
using (bucket_id not in ('avatars', 'game-images'));

create policy "Anonymous inserts are denied for managed image buckets"
on storage.objects
as restrictive
for insert
to anon
with check (bucket_id not in ('avatars', 'game-images'));

create policy "Anonymous updates are denied for managed image buckets"
on storage.objects
as restrictive
for update
to anon
using (bucket_id not in ('avatars', 'game-images'))
with check (bucket_id not in ('avatars', 'game-images'));

create policy "Anonymous deletes are denied for managed image buckets"
on storage.objects
as restrictive
for delete
to anon
using (bucket_id not in ('avatars', 'game-images'));

create policy "Users can read own avatar objects"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'avatars'
  and (
    (storage.foldername(name))[1] = (select auth.uid()::text)
    or (select private.is_admin((select auth.uid())))
  )
);

create policy "Users can insert own avatar objects"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (
    (storage.foldername(name))[1] = (select auth.uid()::text)
    or (select private.is_admin((select auth.uid())))
  )
);

create policy "Users can update own avatar objects"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and (
    (storage.foldername(name))[1] = (select auth.uid()::text)
    or (select private.is_admin((select auth.uid())))
  )
)
with check (
  bucket_id = 'avatars'
  and (
    (storage.foldername(name))[1] = (select auth.uid()::text)
    or (select private.is_admin((select auth.uid())))
  )
);

create policy "Users can delete own avatar objects"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (
    (storage.foldername(name))[1] = (select auth.uid()::text)
    or (select private.is_admin((select auth.uid())))
  )
);

create policy "Admins can read game image objects"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'game-images'
  and (select private.is_admin((select auth.uid())))
);

create policy "Admins can insert game image objects"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'game-images'
  and (select private.is_admin((select auth.uid())))
);

create policy "Admins can update game image objects"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'game-images'
  and (select private.is_admin((select auth.uid())))
)
with check (
  bucket_id = 'game-images'
  and (select private.is_admin((select auth.uid())))
);

create policy "Admins can delete game image objects"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'game-images'
  and (select private.is_admin((select auth.uid())))
);
