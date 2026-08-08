import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

import Image from "next/image";

import {
  getAdminRoleLabel,
} from "@/db/schema/admins";

import {
  getAdmins,
  getNonAdmins,
} from "@/server/admins";

import SearchInput from "./search-input";

import AddAdminButton from "./forms/admin-actions/add-admin-button";

import AdminRowActions from "./forms/admin-actions/admin-row-actions";

interface AdminsTableProps {
  search?: string;
}

export default async function AdminsTable({
  search,
}: AdminsTableProps) {
  const [
    adminsResult,
    nonAdminsResult,
  ] = await Promise.all([
    getAdmins(search),
    getNonAdmins(),
  ]);

  const admins =
    adminsResult.data ?? [];

  const nonAdmins =
    nonAdminsResult.data ?? [];

  const error =
    adminsResult.error ??
    nonAdminsResult.error;

  if (error) {
    return (
      <p className="text-red-500">
        Error: {error}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Admins
        </h2>

        <AddAdminButton
          nonAdmins={nonAdmins}
        />
      </div>

      <SearchInput placeholder="Search by name or email" />

      <Table>
        <TableCaption>
          A table of admins
        </TableCaption>

        <TableHeader>
          <TableRow>
            <TableHead>
              Avatar
            </TableHead>

            <TableHead className="w-[200px]">
              Email
            </TableHead>

            <TableHead>
              First Name
            </TableHead>

            <TableHead>
              Last Name
            </TableHead>

            <TableHead>
              Role
            </TableHead>

            <TableHead className="text-right">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {admins.map(
            ({
              admin,
              member,
            }) => (
              <TableRow
                key={admin.id}
              >
                <TableCell>
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={
                        member.avatarUrl ??
                        undefined
                      }
                      alt={
                        member.email
                      }
                    />

                    <AvatarFallback>
                      <Image
                        src="/uh_cougar_logo.jpg"
                        alt="Logo"
                        width={10}
                        height={10}
                        className="rounded-full"
                        style={{
                          width:
                            "auto",
                          height:
                            "auto",
                        }}
                        priority
                      />
                    </AvatarFallback>
                  </Avatar>
                </TableCell>

                <TableCell className="font-medium">
                  {member.email}
                </TableCell>

                <TableCell>
                  {
                    member.firstName
                  }
                </TableCell>

                <TableCell>
                  {
                    member.lastName
                  }
                </TableCell>

                <TableCell>
                  {getAdminRoleLabel(
                    admin.role,
                  )}
                </TableCell>

                <TableCell className="text-right">
                  <AdminRowActions
                    admin={admin}
                    member={member}
                  />
                </TableCell>
              </TableRow>
            ),
          )}
        </TableBody>
      </Table>
    </div>
  );
}