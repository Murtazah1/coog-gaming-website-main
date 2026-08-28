import "server-only";

import {
  deleteManagedImage,
  uploadManagedImage,
  validateManagedImageFile,
} from "./image-storage";

export function validateAvatarFile(file: File) {
  return validateManagedImageFile(file, "Avatar");
}

export function uploadAvatarFile(file: File, ownerId: string) {
  return uploadManagedImage("avatars", ownerId, file, "Avatar");
}

export function deleteAvatarFile(objectName: string) {
  return deleteManagedImage("avatars", objectName);
}
