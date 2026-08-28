import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { getStoragePathFromUrl } from "@/server/utils";

const AVATAR_BUCKET = "avatars";
const MAX_AVATAR_SIZE = 1024 * 1024;
const avatarExtensions = new Map([
  ["image/gif", "gif"],
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export function validateAvatarFile(file: File) {
  if (file.size === 0) {
    throw new Error("Choose an image to upload.");
  }

  const extension = avatarExtensions.get(file.type);

  if (!extension) {
    throw new Error("Avatar must be a PNG, JPG, WEBP, or GIF image.");
  }

  if (file.size > MAX_AVATAR_SIZE) {
    throw new Error("Avatar must be under 1MB.");
  }

  return extension;
}

export async function uploadAvatarFile(file: File, ownerId?: string) {
  const extension = validateAvatarFile(file);

  if (ownerId && !/^[a-zA-Z0-9_-]+$/.test(ownerId)) {
    throw new Error("Invalid avatar owner.");
  }

  const supabase = createAdminClient();
  const fileName = `${crypto.randomUUID()}.${extension}`;
  const path = ownerId ? `${ownerId}/${fileName}` : fileName;
  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function deleteAvatarFile(avatarUrl: string) {
  const avatarPath = getStoragePathFromUrl(avatarUrl, AVATAR_BUCKET);
  const { error } = await createAdminClient()
    .storage.from(AVATAR_BUCKET)
    .remove([avatarPath]);

  if (error) {
    throw new Error(error.message);
  }
}
