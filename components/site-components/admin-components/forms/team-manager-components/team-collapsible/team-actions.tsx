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

import { deleteTeam } from "@/server/teams";

import TeamForm from "./team-form";
import AddTeamMember from "./add-team-member";

import type {
  DashboardMember,
  DashboardTeam,
} from "../games-dashboard";

interface TeamActionsProps {
  team: DashboardTeam;
  members: DashboardMember[];
}

export default function TeamActions({
  team,
  members,
}: TeamActionsProps) {
  const router = useRouter();

  const [dialogOpen, setDialogOpen] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  async function handleDelete() {
    if (!confirm(`Delete team ${team.name}?`)) {
      return;
    }

    setDeleting(true);

    try {
      const { error } = await deleteTeam(
        team.id,
      );

      if (error) {
        toast.error(error);
        return;
      }

      toast.success("Team Deleted");

      router.refresh();
    } catch {
      toast.error("Failed to delete team");
    } finally {
      setDeleting(false);
    }
  }

  function handleEditSuccess() {
    setDialogOpen(false);

    router.refresh();
  }

  return (
    <>
      <div className="flex justify-end gap-1">
        {/* Add Member */}
        <AddTeamMember
          team={team}
          members={members}
        />

        {/* Edit Team */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            setDialogOpen(true)
          }
          disabled={deleting}
          aria-label={`Edit ${team.name}`}
        >
          <Pen className="h-4 w-4" />
        </Button>

        {/* Delete Team */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          disabled={deleting}
          aria-label={`Delete ${team.name}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Edit Team Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Edit Team
            </DialogTitle>

            <DialogDescription>
              Update details for {team.name}
            </DialogDescription>
          </DialogHeader>

          <TeamForm
            mode="edit"
            team={team}
            onSuccess={handleEditSuccess}
            onCancel={() =>
              setDialogOpen(false)
            }
          />
        </DialogContent>
      </Dialog>
    </>
  );
}