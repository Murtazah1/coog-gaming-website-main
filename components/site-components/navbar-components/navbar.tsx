import { db } from "@/db";
import { getAuthenticatedUser } from "@/server/auth";
import { getAdminByUserId } from "@/server/admins";
import { getOwnMembership } from "@/server/members";

import { NavbarClient } from "./navbar-client";

export default async function Navbar() {
  const authenticatedUser = await getAuthenticatedUser();
  // this gets all the user information as well as whatever tables they r in
  const [profile, membershipResult, admin] = authenticatedUser
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
        getAdminByUserId(authenticatedUser.id),
      ])
    : [null, null, null];

  return (
    <NavbarClient
      account={{
        isSignedIn: Boolean(authenticatedUser),
        isMember: Boolean(membershipResult?.data),
        isAdmin: Boolean(admin),
        avatarUrl: profile?.avatarUrl ?? null,
        firstName: profile?.firstName ?? null,
        lastName: profile?.lastName ?? null,
      }}
    />
  );
}
