export function getStoragePathFromUrl(url: string, bucket: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");

  if (!supabaseUrl) {
    throw new Error("Supabase URL is not configured");
  }

  const prefix = `${supabaseUrl}/storage/v1/object/public/${bucket}/`;

  if (!url.startsWith(prefix)) {
    throw new Error(`Invalid ${bucket} storage URL`);
  }

  const objectName = decodeURIComponent(url.slice(prefix.length));

  if (!objectName || objectName.startsWith("/") || objectName.includes("\\")) {
    throw new Error(`Invalid ${bucket} storage URL`);
  }

  return objectName;
}
