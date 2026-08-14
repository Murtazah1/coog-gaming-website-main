// This file is just for utility database functions that dont really fit anywhere else


// this is a function to help us cleanup after a user or a game or anything with an image related to it gets deleted
// we pass in the image URL and what bucket we want to look at
// our urls are as follows https://[project_id].supabase.co/storage/v1/object/public/[bucket]/[asset-name]
// so we get the bucket and record when it starts
// and from there we get the asset name as it is always at the end after the bucket
export function getStoragePathFromUrl(url: string, bucket: string) {
  const marker = `/${bucket}/`;
  const index = url.indexOf(marker);

  if (index === -1) {
    throw new Error(`Invalid ${bucket} storage URL`);
  }

  return decodeURIComponent(url.slice(index + marker.length));
}