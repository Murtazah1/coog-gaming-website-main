import { db } from "@/db";
import { getAuthenticatedUser } from "@/server/auth";

import { NavbarClient } from "./navbar-client";

export default async function Navbar() {
  const authenticatedUser = await getAuthenticatedUser();
  const profile = authenticatedUser
    ? await db.query.users.findFirst({
        where: { id: authenticatedUser.id },
        columns: {
          avatarUrl: true,
          firstName: true,
          lastName: true,
        },
      })
    : null;

  return (
    <NavbarClient
      account={{
        isSignedIn: Boolean(authenticatedUser),
        avatarUrl: profile?.avatarUrl ?? null,
        firstName: profile?.firstName ?? null,
        lastName: profile?.lastName ?? null,
      }}
    />
  );
}
