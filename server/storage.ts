"use server";

// this file stores all of our functions related to storage
// so far we have a storage for avatars and game logos
// soon I need to make a storage for club event pictures

import { createAdminClient } from "@/lib/supabase/admin";

export async function uploadAvatar(
    // FormData is a built in WebAPI that stores information from forms such as files and strings
    // here we are making a new varaiable of this FormData type
  formData: FormData, 
): Promise<{ url: string | null; error: string | null }> {
    // and this is us getting the file that we submitted for the avatar
    const file = formData.get("file") as File | null;

    if (!file || file.size === 0){
        return {url: null, error: "File must be an image"}
    }

    const MAX_SIZE = 1 * 1024 * 1024 // this is 1 MB

    // every File object has metadata such as file.name, file.size, and file.type
    // for file.type, its metadata starts with image/{image file type}
    // so png images would have "image/png"
    // but if the image is not in front that means the user did not enter in an image and therefore we need to return an error
    if (!file.type.startsWith("image/")){
        return {url: null, error: "File must be an image"}
    }



    if (file.size > MAX_SIZE){
        return { url: null, error: "File must be under 5MB"}
    }

    const supabase = createAdminClient()
    const ext = file.name.split(".").pop() ?? "png"
    // we need to create our own unique name here to avoid collisions
    const path = `${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage.from("avatars").upload(path, file, {
        contentType: file.type,
        // upsert false means if this already exists in our db throw an error
        upsert: false,
    })

    if (error){
        return {url: null, error: error.message}
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path)

    // end it off by returning the url so we can use it later
    return {url: urlData.publicUrl, error: null}

}
