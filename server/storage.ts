"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  deleteAvatarFile,
  uploadAvatarFile,
} from "@/lib/supabase/avatar-storage";
import { requireAdmin } from "./auth";
import { getStoragePathFromUrl } from "./utils";

export async function uploadAvatar(
  formData: FormData,
): Promise<{ url: string | null; error: string | null }> {
  try {
    await requireAdmin();
  } catch (error) {
    return {
      url: null,
      error:
        error instanceof Error ? error.message : "Administrator access required.",
    };
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return { url: null, error: "Choose an image to upload." };
  }

  try {
    return { url: await uploadAvatarFile(file), error: null };
  } catch (error) {
    return {
      url: null,
      error: error instanceof Error ? error.message : "Failed to upload avatar.",
    };
  }
}

export async function uploadGameImage(
  formData: FormData,
): Promise<{ url: string | null; error: string | null }> {
  try {
    await requireAdmin();
  } catch (error) {
    return {
      url: null,
      error:
        error instanceof Error ? error.message : "Administrator access required.",
    };
  }

  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { url: null, error: "Choose an image to upload." };
  }

  const imageExtensions = new Map([
    ["image/gif", "gif"],
    ["image/jpeg", "jpg"],
    ["image/png", "png"],
    ["image/webp", "webp"],
  ]);
  const extension = imageExtensions.get(file.type);

  if (!extension) {
    return { url: null, error: "Game image must be a PNG, JPG, WEBP, or GIF image." };
  }

  if (file.size > 1024 * 1024) {
    return { url: null, error: "Game image must be under 1MB." };
  }

  const supabase = createAdminClient();
  const path = `${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("game-images").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    return { url: null, error: error.message };
  }

  const { data } = supabase.storage.from("game-images").getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}

export async function deleteGameImage(
  imageUrl: string,
): Promise<{ error: string | null }> {
  try {
    await requireAdmin();
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Administrator access required.",
    };
  }

  try {
    const imagePath = getStoragePathFromUrl(imageUrl, "game-images");
    const { error } = await createAdminClient()
      .storage.from("game-images")
      .remove([imagePath]);

    return { error: error?.message ?? null };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to delete game image",
    };
  }
}

export async function deleteAvatar(
  avatarUrl: string,
): Promise<{ error: string | null }> {
  try {
    await requireAdmin();
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Administrator access required.",
    };
  }

  try {
    await deleteAvatarFile(avatarUrl);
    return { error: null };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to delete avatar",
    };
  }
}
