import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getAdminByUserId } from "./admins";
import { createClient } from "@/lib/supabase/server";

export type AuthenticatedUser = {
  id: string;
  email: string | null;
};

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const supabase = await createClient();
  // this line checks to see if the current signed in user is one that is in the supabase auth table
  const { data, error } = await supabase.auth.getClaims();
  // .claims contains a json with info from the auth table, including things like email and role (which for most users is just authenicated)
  
  const claims = data?.claims;
// subject is specifically the uuid in the supabase table
  const subject = claims?.sub;

  if (error || !claims || typeof subject !== "string") {
    return null;
  }
// returns the auth table id + email
  return {
    id: subject,
    email: typeof claims.email === "string" ? claims.email : null,
  };
}

export async function requireUser() {
  // so this just checks if we are able to get the authenticated user that is requesting whatever action we put this function on
  const user = await getAuthenticatedUser();

  if (!user) {
    throw new Error("You must be signed in to perform this action.");
  }

  return user;
}



export async function requireAdmin() {
  const user = await requireUser();
  const admin = await getAdminByUserId(user.id);

  if (!admin) {
    throw new Error("You must be an admin to perform this action.");
  }

  return user;
}

// this is a function to check the user's previous password before the decide to change it in a password change

export async function verifyCurrentPassword(email: string, password: string) {
  const verifier = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    },
  );

  const { error } = await verifier.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.code === "invalid_credentials") {
      return false;
    }

    throw new Error("Unable to verify your current password. Try again.");
  }

  // The credential check creates a short-lived, isolated session. Revoke only
  // that verification session; do not disturb the user's browser session.
  const { error: signOutError } = await verifier.auth.signOut({
    scope: "local",
  });

  if (signOutError) {
    console.warn(
      "Unable to revoke the temporary password-verification session:",
      signOutError.message,
    );
  }

  return true;
}
