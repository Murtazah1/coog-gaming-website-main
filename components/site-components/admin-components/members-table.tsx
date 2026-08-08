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
import { getMembers, getNonMembers } from "@/server/members";
import AddMemberButton from "./forms/members-actions/add-member-button";
import SearchInput from "./search-input";
import MemberRowActions from "./forms/members-actions/member-row-actions";

interface MembersTableProps {
  search?: string;
}

function formatDate(date: string | null) {
  if (!date) {
    return "-";
  }
  const [year, month, day] = date.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString();
}

export default async function MembersTable({ search }: MembersTableProps) {
  // use Promise.all here as it runs these concurrently
  const [membersResult, nonMembers] = await Promise.all([
    getMembers(search),
    getNonMembers()]
  );
  
  const members = membersResult.data ?? []
  
  const error = membersResult.error

  const nonMember = nonMembers.data ?? []


  if (error) {
    return <p className="text-red-500">Error: {error}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Members</h2>
        <AddMemberButton NonMembers={nonMember}/>
      </div>

      

      <SearchInput placeholder="Search by name, email, or discord name" />

      <Table>
        <TableCaption>A table of members</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Avatar</TableHead>
            <TableHead className="w-[200px]">Email</TableHead>
            <TableHead>First Name</TableHead>
            <TableHead>Last Name</TableHead>
            <TableHead>Discord Name</TableHead>
            <TableHead>Plan Type</TableHead>
            <TableHead>Plan End Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(members ?? []).map(({ member, user }) => (
            <TableRow key={member.id}>
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
              <TableCell>{member.discordName}</TableCell>
              <TableCell>{member.planType}</TableCell>
              <TableCell>{formatDate(member.currentPeriodEnd)}</TableCell>
              <TableCell><MemberRowActions
              member={member}
              user={user} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
