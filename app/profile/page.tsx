import { redirect } from "next/navigation";

import { AccountActionsCard } from "@/components/site-components/login-components/account-actions-card";
import { PasswordChangeCard } from "@/components/site-components/login-components/password-change-card";
import { ProfileInformationCard } from "@/components/site-components/login-components/profile-information-card";
import { SignInEmailCard } from "@/components/site-components/login-components/sign-in-email-card";
import { db } from "@/db";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/server/auth";

export default async function ProfilePage() {
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser) {
    redirect("/auth/login?next=/profile");
  }

  const [profile, authResult] = await Promise.all([
    db.query.users.findFirst({
      where: { id: authenticatedUser.id },
    }),
    createClient().then((supabase) => supabase.auth.getUser()),
  ]);

  if (!profile || authResult.error || !authResult.data.user) {
    redirect("/auth/error?error=Unable%20to%20load%20your%20user%20profile");
  }

  const authUser = authResult.data.user;

  return (
    <section className="bg-black/25 bg-[url('/uh-site-background.png')] bg-cover bg-fixed bg-blend-multiply px-4 py-12 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-red-400">
              Player account
            </p>
            <h1 className="mt-2 font-heading text-3xl tracking-[0.08em] sm:text-4xl">
              Your profile
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-8 text-zinc-200">
              Manage your public profile and the credentials used to sign in.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <ProfileInformationCard
            firstName={profile.firstName}
            lastName={profile.lastName}
            gamerName={profile.gamerName}
            avatarUrl={profile.avatarUrl}
            createdAt={profile.createdAt.toISOString()}
          />
          <SignInEmailCard
            authEmail={authUser.email ?? profile.email}
            mirroredEmail={profile.email}
            pendingEmail={authUser.new_email ?? null}
          />
          <PasswordChangeCard />
          <AccountActionsCard />
        </div>
      </div>
    </section>
  );
}
