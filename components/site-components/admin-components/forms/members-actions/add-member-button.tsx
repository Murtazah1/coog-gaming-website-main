// the general flow I am going for here is that the admin clicks on the button -> combo box selects a user -> from there the form to make a member opens and they make a member with that usersid as a foreign key

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import UserComboBox from "./user-combobox";
import MemberForm from "./members-form";
import type { User } from "@/db/schema";
import { Plus, ArrowLeft } from "lucide-react";

type NonMember = Pick<User, "id" | "email" | "firstName" | "lastName">;

interface AddMemberButtonProps {
  NonMembers: NonMember[];
}

export default function AddMemberButton({ NonMembers }: AddMemberButtonProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<NonMember | null>(null);

  function handleSuccess() {
    setDialogOpen(false);
    setSelectedUser(null);
    router.refresh();
  }

  // on change we want to determine if the dialog open or closes, but we also want to make sure that when the dialog is not open we clear the selectedUser state as it would be awkward to save that user throughout multiple different dialog sesssions
  function handleOpenChange(open: boolean) {
    setDialogOpen(open);

    if (!open) {
      setSelectedUser(null);
    }
  }

  return (
    <>
      <Button onClick={() => setDialogOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Member
      </Button>

      <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedUser ? "Create Member" : "Add Member"}
            </DialogTitle>

            <DialogDescription>
              {selectedUser
                ? `Enter the membership info for ${selectedUser.firstName} ${selectedUser.lastName}`
                : `Select a user to make them a member`}
            </DialogDescription>
          </DialogHeader>
          {/* if there is a selected user show the form, else show the combobox component */}
          {selectedUser ? (
            <div className="space-y-4">
              

            <MemberForm
                mode="create"
                user={selectedUser}
                onSuccess={handleSuccess}
                onCancel={() =>
                  setSelectedUser(null)
                }
              />

            <Button
                type="button"
                variant="ghost"
                className="px-0"
                onClick={() =>
                  setSelectedUser(null)
                }
              >
            <ArrowLeft className="mr-2 h-4 w-4" />
                Choose another user
              </Button>

            </div>
          ) : NonMembers ? (
            <UserComboBox
              users={NonMembers}
              value={selectedUser}
              onChange={setSelectedUser}
            />
          ) : (
            <p className="text-sm text-destructive">error fetching users</p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
