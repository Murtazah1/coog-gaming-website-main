"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Pen, Trash2 } from "lucide-react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { Admin } from "@/db/schema/admins";

import type { AdminMember } from "@/db/schema/admins";

import { deleteAdmin } from "@/server/admins";

import AdminForm from "./admin-form";

interface AdminRowActionsProps {
  admin: Admin;
  member: AdminMember;
}

export default function AdminRowActions({
  admin,
  member,
}: AdminRowActionsProps) {
  const router = useRouter();

  const [dialogOpen, setDialogOpen] = useState(false);

  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Remove ${member.firstName} ${member.lastName} as an admin?`)) {
      return;
    }

    setDeleting(true);

    try {
      const { error } = await deleteAdmin(admin.id);

      if (error) {
        toast.error(error);
        return;
      }

      toast.success("Admin deleted");

      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  function handleEditSuccess() {
    setDialogOpen(false);
    router.refresh();
  }

  const displayName =
    [member.firstName, member.lastName].filter(Boolean).join(" ") ||
    member.email;

  return (
    <>
      <div className="flex justify-end gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDialogOpen(true)}
          disabled={deleting}
          aria-label={`Edit ${member.firstName} ${member.lastName}`}
        >
          <Pen className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          disabled={deleting}
          aria-label={`Delete ${member.email}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Admin</DialogTitle>

            <DialogDescription>
              Update admin role for {displayName}
            </DialogDescription>
          </DialogHeader>

          <AdminForm
            mode="edit"
            admin={admin}
            member={member}
            onSuccess={handleEditSuccess}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
