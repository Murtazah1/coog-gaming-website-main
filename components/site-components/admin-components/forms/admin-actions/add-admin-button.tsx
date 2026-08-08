"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { AdminMember } from "@/db/schema";

import MemberComboBox from "./member-combobox";
import AdminForm from "./admin-form";

interface AddAdminButtonProps {
  nonAdmins: AdminMember[];
}

export default function AddAdminButton({ nonAdmins }: AddAdminButtonProps) {
  const router = useRouter();

  const [dialogOpen, setDialogOpen] = useState(false);

  const [selectedMember, setSelectedMember] = useState<AdminMember | null>(
    null,
  );

  function handleSuccess() {
    setDialogOpen(false);
    setSelectedMember(null);
    router.refresh();
  }

  function handleOpenChange(open: boolean) {
    setDialogOpen(open);

    if (!open) {
      setSelectedMember(null);
    }
  }

  return (
    <>
      <Button onClick={() => setDialogOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Admin
      </Button>

      <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedMember ? "Create Admin" : "Add Admin"}
            </DialogTitle>

            <DialogDescription>
              {selectedMember
                ? `Select an admin role for ${selectedMember.firstName} ${selectedMember.lastName}`
                : "Select a member to make them an admin"}
            </DialogDescription>
          </DialogHeader>

          {selectedMember ? (
            <AdminForm
              mode="create"
              member={selectedMember}
              onSuccess={handleSuccess}
              onCancel={() => setSelectedMember(null)}
            />
          ) : (
            <MemberComboBox
              members={nonAdmins}
              value={selectedMember}
              onChange={setSelectedMember}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
