// this page contains checks for if the user trying to access this page is logged in and an admin

import { redirect } from "next/navigation";

import { AdminNavbar } from "@/components/site-components/admin-components/admin-navbar";
import {
  getAuthenticatedUser,
} from "@/server/auth";
import { getAdminByUserId } from "@/server/admins";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser) {
    redirect("/auth/login?next=/admin");
  }

  const admin = await getAdminByUserId(authenticatedUser.id);

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
