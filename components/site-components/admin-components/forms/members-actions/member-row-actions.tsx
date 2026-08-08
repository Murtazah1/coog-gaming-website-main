"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pen, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@/db/schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Member } from "@/db/schema";
import { deleteMember } from "@/server/members";
import MemberForm from "./members-form";

type NonMember = Pick<User, "id" | "email" | "firstName" | "lastName">;


// make an interface for the user type in typescript
interface MemberRowActionsProps {
  member: Member;
  user: NonMember
}

// we pass in the user from the users-table component
export default function MemberRowActions({ member, user }: MemberRowActionsProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  // adding in a deleteing state so there cannot be multple delete requests sent
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete Member ${user.firstName} ${user.lastName} - ${member.discordName}?`)) return;
    // deleteUser returns either nothing or an error because we use drizzle code to delete whatever user we need to delete in the db
    // so if there is an error we can handle it else we continue on as normal
    setDeleting(true);
    try {
      const { error } = await deleteMember(member.id);
      if (error) {
        toast.error(error);
        return;
      }
      toast.success("Member Deleted");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }
  // if we successfully update a user then we need to refresh the page in order to solidify the changes
  function handleEditSuccess() {
    setDialogOpen(false);
    router.refresh();
  }

  return (
    <>
      <div className="flex justify-end gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDialogOpen(true)}
          disabled={deleting}
          aria-label={`Edit ${user.firstName} ${user.lastName} - ${member.discordName}`}
        >
          <Pen className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          disabled={deleting}
          aria-label={`Delete ${user.firstName} ${user.lastName} - ${member.discordName}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update details for{" "}
              {[user.firstName, user.lastName].filter(Boolean).join(" ") || user.email}
            </DialogDescription>
          </DialogHeader>
          <MemberForm
            mode="edit"
            member={member}
            user={user}
            onSuccess={handleEditSuccess}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}


