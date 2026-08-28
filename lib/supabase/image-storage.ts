import "server-only";

import { createAdminClient } from "./admin";

export const MANAGED_IMAGE_BUCKETS = ["avatars", "game-images"] as const;
export type ManagedImageBucket = (typeof MANAGED_IMAGE_BUCKETS)[number];

const MAX_IMAGE_SIZE = 1024 * 1024;
const imageExtensions = new Map([
  ["image/gif", "gif"],
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export type ManagedImage = {
  objectName: string;
  publicUrl: string;
};

export function validateManagedImageFile(file: File, label = "Image") {
  if (file.size === 0) {
    throw new Error(`Choose ${label.toLowerCase()} to upload.`);
  }

  const extension = imageExtensions.get(file.type);

  if (!extension) {
    throw new Error(`${label} must be a PNG, JPG, WEBP, or GIF image.`);
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error(`${label} must be under 1MB.`);
  }

  return extension;
}

export function getManagedImagePublicUrl(
  bucket: ManagedImageBucket,
  objectName: string,
) {
  const supabase = createAdminClient();
  return supabase.storage.from(bucket).getPublicUrl(objectName).data.publicUrl;
}

export async function uploadManagedImage(
  bucket: ManagedImageBucket,
  ownerId: string,
  file: File,
  label = "Image",
): Promise<ManagedImage> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(ownerId)) {
    throw new Error(`Invalid ${label.toLowerCase()} owner.`);
  }

  const extension = validateManagedImageFile(file, label);
  const objectName = `${ownerId}/${crypto.randomUUID()}.${extension}`;
  const supabase = createAdminClient();
  const { error } = await supabase.storage.from(bucket).upload(objectName, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    objectName,
    publicUrl: getManagedImagePublicUrl(bucket, objectName),
  };
}

export async function deleteManagedImage(
  bucket: ManagedImageBucket,
  objectName: string,
) {
  const { error } = await createAdminClient()
    .storage.from(bucket)
    .remove([objectName]);

  if (error) {
    throw new Error(error.message);
  }
}
