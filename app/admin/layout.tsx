import { redirect } from "next/navigation";

import { AdminNavbar } from "@/components/site-components/admin-components/admin-navbar";
import {
  getAdminForUserId,
  getAuthenticatedUser,
} from "@/server/auth";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser) {
    redirect("/auth/login?next=/admin");
  }

  const admin = await getAdminForUserId(authenticatedUser.id);

  if (!admin) {
    redirect("/");
  }

  return (
    <div className="flex min-h-[calc(100vh-4.5rem)] w-full">
      <AdminNavbar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
