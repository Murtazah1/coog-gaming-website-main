import {
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const managedImageBuckets = ["avatars", "game-images"] as const;
export const storageCleanupStatuses = [
  "pending",
  "processing",
  "deleted",
  "cancelled",
  "failed",
] as const;

export const storageCleanupQueue = pgTable(
  "storage_cleanup_queue",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bucketId: text("bucket_id", { enum: managedImageBuckets }).notNull(),
    objectName: text("object_name").notNull(),
    reason: text("reason").notNull(),
    status: text("status", { enum: storageCleanupStatuses })
      .default("pending")
      .notNull(),
    attempts: integer("attempts").default(0).notNull(),
    notBefore: timestamp("not_before", { withTimezone: true })
      .defaultNow()
      .notNull(),
    lastError: text("last_error"),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("storage_cleanup_queue_object_idx").on(
      table.bucketId,
      table.objectName,
    ),
  ],
);

export type StorageCleanupQueueItem =
  typeof storageCleanupQueue.$inferSelect;
