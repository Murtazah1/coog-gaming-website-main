import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { getUsers} from "@/server/users";

export default async function UsersTable() {
  const { data: users, error } = await getUsers();

  if (error) {
    return <p className="text-red-500">Error: {error}</p>;
  }

  return (
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
            <TableCell></TableCell>
            <TableCell className="font-medium">{user.email}</TableCell>
            <TableCell>{user.firstName}</TableCell>
            <TableCell>{user.lastName}</TableCell>
            <TableCell className="text-right">{user.createdAt?.toLocaleDateString() ?? "-"}</TableCell>
            <TableCell> </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
