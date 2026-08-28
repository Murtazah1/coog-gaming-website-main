import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";

type ManagedBucket = "avatars" | "game-images";
type Reference = {
  bucketId: ManagedBucket;
  entityId: string;
  objectName: string;
};

async function main() {
if (!process.argv.includes("--apply")) {
  throw new Error(
    "This migration changes live Storage objects. Re-run with --apply after reviewing storage:audit.",
  );
}

const databaseUrl = process.env.DATABASE_URL;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!databaseUrl || !supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY are required.",
  );
}

const sql = postgres(databaseUrl, { max: 1 });
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const allowedMimeTypes = [
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
];

for (const bucket of ["avatars", "game-images"] as const) {
  const { error } = await supabase.storage.updateBucket(bucket, {
    public: true,
    fileSizeLimit: 1024 * 1024,
    allowedMimeTypes,
  });

  if (error) {
    throw new Error(`Unable to configure ${bucket}: ${error.message}`);
  }
}

const references = await sql<Reference[]>`
  select
    'avatars'::text as "bucketId",
    id::text as "entityId",
    avatar_object_name as "objectName"
  from public.users
  where avatar_object_name is not null
  union all
  select
    'game-images'::text,
    id::text,
    image_object_name
  from public.games
  where image_object_name is not null
  order by "bucketId", "entityId"
`;
const moved: Array<{
  bucketId: ManagedBucket;
  entityId: string;
  oldObjectName: string;
  newObjectName: string;
}> = [];

for (const reference of references) {
  if (reference.objectName.startsWith(`${reference.entityId}/`)) {
    continue;
  }

  const extension = reference.objectName.split(".").pop()?.toLowerCase();
  if (!extension || !["gif", "jpeg", "jpg", "png", "webp"].includes(extension)) {
    throw new Error(
      `Unsupported managed image extension: ${reference.bucketId}/${reference.objectName}`,
    );
  }

  const newObjectName = `${reference.entityId}/${randomUUID()}.${extension}`;
  const { error: copyError } = await supabase.storage
    .from(reference.bucketId)
    .copy(reference.objectName, newObjectName);

  if (copyError) {
    throw new Error(
      `Unable to copy ${reference.bucketId}/${reference.objectName}: ${copyError.message}`,
    );
  }

  const publicUrl = supabase.storage
    .from(reference.bucketId)
    .getPublicUrl(newObjectName).data.publicUrl;

  try {
    const updated =
      reference.bucketId === "avatars"
        ? await sql`
            update public.users
            set avatar_object_name = ${newObjectName}, avatar_url = ${publicUrl}
            where id = ${reference.entityId}
              and avatar_object_name = ${reference.objectName}
            returning id
          `
        : await sql`
            update public.games
            set image_object_name = ${newObjectName}, image_url = ${publicUrl}
            where id = ${reference.entityId}
              and image_object_name = ${reference.objectName}
            returning id
          `;

    if (updated.length !== 1) {
      throw new Error("The image reference changed during migration.");
    }
  } catch (error) {
    await supabase.storage.from(reference.bucketId).remove([newObjectName]);
    throw error;
  }

  moved.push({
    bucketId: reference.bucketId,
    entityId: reference.entityId,
    oldObjectName: reference.objectName,
    newObjectName,
  });
}

const legacyOrphans = await sql<
  Array<{ bucketId: ManagedBucket; objectName: string; size: number }>
>`
  select
    object.bucket_id as "bucketId",
    object.name as "objectName",
    coalesce((object.metadata->>'size')::integer, 0) as size
  from storage.objects as object
  where object.bucket_id in ('avatars', 'game-images')
    and object.name <> '.emptyFolderPlaceholder'
    and object.created_at < clock_timestamp() - interval '24 hours'
    and not public.storage_image_is_referenced(object.bucket_id, object.name)
  order by object.bucket_id, object.name
`;

for (const orphan of legacyOrphans) {
  await sql`
    select private.enqueue_storage_cleanup(
      ${orphan.bucketId},
      ${orphan.objectName},
      'authorized_legacy_orphan_deletion',
      clock_timestamp()
    )
  `;

  const { error } = await supabase.storage
    .from(orphan.bucketId)
    .remove([orphan.objectName]);

  await sql`
    update public.storage_cleanup_queue
    set status = ${error ? "failed" : "deleted"},
        attempts = attempts + 1,
        last_error = ${error?.message ?? null},
        updated_at = clock_timestamp(),
        deleted_at = ${error ? null : new Date()}
    where bucket_id = ${orphan.bucketId}
      and object_name = ${orphan.objectName}
  `;

  if (error) {
    throw new Error(
      `Unable to delete ${orphan.bucketId}/${orphan.objectName}: ${error.message}`,
    );
  }
}

console.log(
  JSON.stringify(
    {
      configuredBuckets: ["avatars", "game-images"],
      movedReferences: moved,
      deletedLegacyOrphans: legacyOrphans,
    },
    null,
    2,
  ),
);

await sql.end();
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
