"use server";

// this file stores all of our functions related to storage
// so far we have a storage for avatars and game logos
// soon I need to make a storage for club event pictures

import { createAdminClient } from "@/lib/supabase/admin";
import {
  deleteAvatarFile,
  uploadAvatarFile,
} from "@/lib/supabase/avatar-storage";
import { requireAdmin } from "./auth";
import { getStoragePathFromUrl } from "./utils";

export async function uploadAvatar(
  // FormData is a built in WebAPI that stores information from forms such as files and strings
  // here we are making a new varaiable of this FormData type
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

  const file = formData.get("file") as File | null;

  if (!file || file.size === 0) {
    return { url: null, error: "File must be an image" };
  }

  const MAX_SIZE = 1 * 1024 * 1024; // this is 1 MB

  if (!file.type.startsWith("image/")) {
    return { url: null, error: "File must be an image" };
  }

  if (file.size > MAX_SIZE) {
    return { url: null, error: "File must be under 1MB" };
  }

  const supabase = createAdminClient();
  const ext = file.name.split(".").pop() ?? "png";

  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("game-images")
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return { url: null,  error: error.message };
  }

  const { data: urlData } = supabase.storage
    .from("game-images")
    .getPublicUrl(path);

  return { url: urlData.publicUrl, error: null };
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

  const supabase = createAdminClient();

  try {
    const imagePath = getStoragePathFromUrl(
      imageUrl,
      "game-images",
    );

    const { error } = await supabase.storage
      .from("game-images")
      .remove([imagePath]);

    if (error) {
      return {
        error: error.message,
      };
    }

    return {
      error: null,
    };
  } catch {
    return {
      error: "Failed to delete game image",
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
    return {
      error: null,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to delete avatar",
    };
  }
}
