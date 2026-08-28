import postgres from "postgres";

type ManagedBucket = "avatars" | "game-images";
type StorageObject = {
  bucketId: ManagedBucket;
  name: string;
  size: number;
  createdAt: Date;
};
type ImageReference = {
  bucketId: ManagedBucket;
  entityId: string;
  objectName: string | null;
  url: string | null;
};

async function main() {
const databaseUrl = process.env.DATABASE_URL;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!databaseUrl || !supabaseUrl) {
  throw new Error("DATABASE_URL and NEXT_PUBLIC_SUPABASE_URL are required.");
}

const sql = postgres(databaseUrl, { max: 1 });
const objects = await sql<StorageObject[]>`
  select
    bucket_id as "bucketId",
    name,
    coalesce((metadata->>'size')::integer, 0) as size,
    created_at as "createdAt"
  from storage.objects
  where bucket_id in ('avatars', 'game-images')
    and name <> '.emptyFolderPlaceholder'
  order by bucket_id, name
`;
const references = await sql<ImageReference[]>`
  select
    'avatars'::text as "bucketId",
    id::text as "entityId",
    avatar_object_name as "objectName",
    avatar_url as url
  from public.users
  where avatar_object_name is not null or avatar_url is not null
  union all
  select
    'game-images'::text,
    id::text,
    image_object_name,
    image_url
  from public.games
  where image_object_name is not null or image_url is not null
  order by "bucketId", "entityId"
`;

const baseOrigin = new URL(supabaseUrl).origin;
const objectKeys = new Set(
  objects.map((object) => `${object.bucketId}|${object.name}`),
);
const referenceCounts = new Map<string, number>();

function pathFromUrl(url: string | null, bucket: ManagedBucket) {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const marker = `/storage/v1/object/public/${bucket}/`;
    if (parsed.origin !== baseOrigin || !parsed.pathname.startsWith(marker)) {
      return null;
    }
    return decodeURIComponent(parsed.pathname.slice(marker.length));
  } catch {
    return null;
  }
}

for (const reference of references) {
  if (reference.objectName) {
    const key = `${reference.bucketId}|${reference.objectName}`;
    referenceCounts.set(key, (referenceCounts.get(key) ?? 0) + 1);
  }
}

const orphans = objects.filter(
  (object) =>
    !referenceCounts.has(`${object.bucketId}|${object.name}`),
);
const brokenReferences = references.filter(
  (reference) =>
    reference.objectName &&
    !objectKeys.has(`${reference.bucketId}|${reference.objectName}`),
);
const invalidUrls = references.filter((reference) => {
  const urlPath = pathFromUrl(reference.url, reference.bucketId);
  return !urlPath || urlPath !== reference.objectName;
});
const duplicates = [...referenceCounts.entries()].filter(
  ([, count]) => count > 1,
);
const ownershipMismatches = references.filter(
  (reference) =>
    reference.objectName?.split("/")[0] !== reference.entityId,
);

const report = {
  generatedAt: new Date().toISOString(),
  totals: {
    objects: objects.length,
    references: references.length,
    orphanObjects: orphans.length,
    orphanBytes: orphans.reduce((total, object) => total + object.size, 0),
    brokenReferences: brokenReferences.length,
    invalidUrls: invalidUrls.length,
    duplicateReferences: duplicates.length,
    ownershipMismatches: ownershipMismatches.length,
  },
  orphans,
  brokenReferences,
  invalidUrls,
  duplicates,
  ownershipMismatches,
};

console.log(JSON.stringify(report, null, 2));
await sql.end();

if (
  orphans.length ||
  brokenReferences.length ||
  invalidUrls.length ||
  duplicates.length ||
  ownershipMismatches.length
) {
  process.exitCode = 1;
}
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
