import "server-only";

import { db } from "@/db";
import { storageCleanupQueue } from "@/db/schema/storage-cleanup";
import {
  deleteManagedImage,
  type ManagedImageBucket,
} from "@/lib/supabase/image-storage";

export async function enqueueStorageCleanup(
  bucketId: ManagedImageBucket,
  objectName: string,
  reason: string,
) {
  await db
    .insert(storageCleanupQueue)
    .values({ bucketId, objectName, reason })
    .onConflictDoUpdate({
      target: [storageCleanupQueue.bucketId, storageCleanupQueue.objectName],
      set: {
        reason,
        status: "pending",
        attempts: 0,
        notBefore: new Date(),
        lastError: null,
        updatedAt: new Date(),
        deletedAt: null,
      },
    });
}

export async function deleteOrQueueManagedImage(
  bucketId: ManagedImageBucket,
  objectName: string,
  reason: string,
) {
  try {
    await deleteManagedImage(bucketId, objectName);
  } catch (error) {
    await enqueueStorageCleanup(bucketId, objectName, reason);
    console.error(`Queued ${bucketId}/${objectName} for cleanup:`, error);
  }
}
