import { supabase } from "./supabaseClient";
import { z } from "zod";

/**
 * This file contains functions to manage user profiles in a Supabase database.
 * It includes functions to get the current user's profile, update the profile,
 * upload and remove the user's avatar, and search for profiles based on a search term.
 */
export const ProfileSchema = z.object({
  id: z.string(),
  email: z.string(),
  full_name: z.string().nullable(),
  avatar_url: z.string().nullable(),
  condition_tags: z.array(z.string()),
  created_at: z.string(),
});

export type Profile = z.infer<typeof ProfileSchema>;

/**
 * Retrieves the current user's profile from the Supabase database.
 * @returns The user's profile data or null if the user is not authenticated.
 * @throws An error if there is an issue retrieving the profile data.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    throw error;
  }

  return ProfileSchema.parse(data);
}

/**
 * Updates the current user's profile in the Supabase database.
 * @param full_name The new full name of the user.
 * @param avatar_url The new avatar URL of the user (optional).
 * @param condition_tags The new condition tags of the user (optional).
 * @returns The updated user's profile data.
 * @throws An error if there is an issue updating the profile data.
 */
export async function updateProfile({
  full_name,
  avatar_url,
  condition_tags,
}: {
  full_name: string;
  avatar_url?: string | null;
  condition_tags?: string[];
}): Promise<Profile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No user found");
  }

  const updatePayload: { [key: string]: unknown } = { full_name };
  if (avatar_url !== undefined) {
    updatePayload.avatar_url = avatar_url;
  }

  if (condition_tags !== undefined) {
    updatePayload.condition_tags = condition_tags;
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .update(updatePayload)
    .eq("id", user.id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return ProfileSchema.parse(data);
}

/**
 * Uploads an avatar image for the current user to Supabase storage.
 * @param file The image file to upload.
 * @returns The public URL of the uploaded avatar image.
 * @throws An error if there is an issue uploading the avatar image.
 */
export async function uploadAvatar(file: File): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No user found");
  }

  const fileExt = file.name.split(".").pop();
  const fileName = `${user.id}.${fileExt}`;
  const filePath = fileName;
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    throw uploadError;
  }

  const { data: publicUrlData } = supabase.storage
    .from("avatars")
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}

/**
 * Removes the current user's avatar image from Supabase storage.
 * @throws An error if there is an issue removing the avatar image.
 */
export async function removeAvatar(): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("No user found");
  }

  const possibleExtensions = ["png", "jpg", "jpeg", "webp"];
  let removed = false;

  for (const ext of possibleExtensions) {
    const filePath = `${user.id}.${ext}`;
    const { error } = await supabase.storage.from("avatars").remove([filePath]);
    if (!error) {
      removed = true;
      break;
    }
  }

  if (!removed) {
    throw new Error("Failed to remove avatar file.");
  }

  const { error: updateError } = await supabase
    .from("user_profiles")
    .update({ avatar_url: null })
    .eq("id", user.id);

  if (updateError) {
    throw updateError;
  }
}

/**
 * Searches for user profiles in the Supabase database based on a search term.
 * @param searchTerm The term to search for in the user's full name or email.
 * @returns An array of matching user profiles.
 * @throws An error if there is an issue searching for profiles.
 */
export async function searchProfiles(searchTerm: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);

  if (error) {
    throw error;
  }

  return ProfileSchema.array().parse(data) || [];
}
