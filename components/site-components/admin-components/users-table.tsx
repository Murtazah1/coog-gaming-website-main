import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import { getUsers } from "@/server/users";
import UserRowActions from "./forms/user-actions/user-row-actions";
import SearchInput from "./search-input";
import AddUserButton from "./forms/user-actions/add-user-button";


export default async function UsersTable({ search } : { search?: string}) {
  const { data: users, error } = await getUsers(search);

  if (error) {
    return <p className="text-red-500">Error: {error}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Users</h2>
        <AddUserButton />
      </div>

      <SearchInput />


      <Table>
        <TableCaption>A table of Users</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Avatar</TableHead>
            <TableHead className="w-[100px]">Email</TableHead>
            <TableHead>First Name</TableHead>
            <TableHead>Last Name</TableHead>
            <TableHead className="text-right">Created At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(users ?? []).map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={user.avatarUrl ?? undefined}
                    alt={user.email ?? ""}
                  />
                  <AvatarFallback>
                    <Image
                      src="/uh_cougar_logo.jpg"
                      alt="Logo"
                      width={10}
                      height={10}
                      className="rounded-full"
                      style={{ width: "auto", height: "auto" }}
                      priority
                    />
                  </AvatarFallback>
                </Avatar>
              </TableCell>
              <TableCell className="font-medium">{user.email}</TableCell>
              <TableCell>{user.firstName}</TableCell>
              <TableCell>{user.lastName}</TableCell>
              <TableCell className="text-right">
                {user.createdAt?.toLocaleDateString() ?? "-"}
              </TableCell>
              <TableCell>
                {/* Pass in our user as a prop to the user row actions, which then gets passed into user-form  */}
                <UserRowActions user={user} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
