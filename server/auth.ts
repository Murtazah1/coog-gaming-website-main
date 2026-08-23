import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

export type AuthenticatedUser = {
  id: string;
  email: string | null;
};

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const subject = claims?.sub;

  if (error || !claims || typeof subject !== "string") {
    return null;
  }

  return {
    id: subject,
    email: typeof claims.email === "string" ? claims.email : null,
  };
}

export async function requireUser() {
  const user = await getAuthenticatedUser();

  if (!user) {
    throw new Error("You must be signed in to perform this action.");
  }

  return user;
}

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
