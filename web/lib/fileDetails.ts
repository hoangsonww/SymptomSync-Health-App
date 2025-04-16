import { supabase } from "@/lib/supabaseClient";

export type FileRow = {
  id: string;
  filename: string;
  url: string;
  file_type: string;
  uploaded_at: string;
  tags?: string[];
};

/**
 * Fetches the file details for a given file ID.
 * Note: Supabase RLS will block this operation if the user is not the owner of the record.
 *
 * @param id - The ID of the file to fetch.
 * @returns An object containing either the file data or an error.
 */
export async function fetchFileDetails(
  id: string,
): Promise<{ file?: FileRow; error?: Error | null }> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    return { error: new Error("User not authenticated") };
  }

  const { data, error } = await supabase
    .from("files")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return { error };
  }

  return { file: data as FileRow };
}

// Supabase RLS Policy: Table is only accessible to authenticated users.
// Only the user who uploaded the file can access, update, or delete it.
// They cannot access, update, or delete files uploaded by other users.
