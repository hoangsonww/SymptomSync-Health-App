import { supabase } from "./supabaseClient";

/**
 * This function is used to sign up a new user with email and password.
 *
 * @param email The email of the user to sign up.
 * @param password The password of the user to sign up.
 * @returns The data returned from Supabase after the sign-up attempt.
 */
export async function signUp(email: string, password: string) {
  // Use the redirect URL for email sign-up, by default we wanna redirect to the home page
  // In production we'll set this to the app's vercel url
  const emailRedirectTo =
    process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL || "http://localhost:3000";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo },
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * This function is used to sign in an existing user with email and password.
 *
 * @param email The email of the user to sign in.
 * @param password The password of the user to sign in.
 * @returns The data returned from Supabase after the sign-in attempt.
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * This function is used to sign out the current user.
 *
 * @returns The data returned from Supabase after the sign-out attempt.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}
