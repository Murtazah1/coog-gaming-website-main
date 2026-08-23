import { db } from "@/db";
import {
  getAdminForUserId,
  getAuthenticatedUser,
} from "@/server/auth";
import { getOwnMembership } from "@/server/members";

import { NavbarClient } from "./navbar-client";

export default async function Navbar() {
  const authenticatedUser = await getAuthenticatedUser();
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
        getAdminForUserId(authenticatedUser.id),
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
