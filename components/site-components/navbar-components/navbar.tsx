import { db } from "@/db";
import { getAuthenticatedUser } from "@/server/auth";
import { getOwnMembership } from "@/server/members";

import { NavbarClient } from "./navbar-client";

export default async function Navbar() {
  const authenticatedUser = await getAuthenticatedUser();
  const [profile, membershipResult] = authenticatedUser
    ? await Promise.all([
        db.query.users.findFirst({
          where: { id: authenticatedUser.id },
          columns: {
            avatarUrl: true,
            firstName: true,
            lastName: true,
          },
        }),
        getOwnMembership(),
      ])
    : [null, null];

  return (
    <NavbarClient
      account={{
        isSignedIn: Boolean(authenticatedUser),
        isMember: Boolean(membershipResult?.data),
        avatarUrl: profile?.avatarUrl ?? null,
        firstName: profile?.firstName ?? null,
        lastName: profile?.lastName ?? null,
      }}
    />
  );
}
