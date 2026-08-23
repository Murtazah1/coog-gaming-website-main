"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { addTeamMember } from "@/server/team-members";

import type {
  DashboardMember,
  DashboardTeam,
} from "../games-dashboard";

type AddTeamMemberProps = {
  team: DashboardTeam;
  members: DashboardMember[];
};

export default function AddTeamMember({
  team,
  members,
}: AddTeamMemberProps) {
  const router = useRouter();

  const [dialogOpen, setDialogOpen] =
    useState(false);

  const [selectedMemberId, setSelectedMemberId] =
    useState("");

  const [adding, setAdding] =
    useState(false);

  // ==========================================
  // AVAILABLE MEMBERS
  // ==========================================

  // members = every member in the organization
  // team.members = members already on this team
  const availableMembers = members.filter(
    (member) =>
      !team.members.some(
        (teamMember) =>
          teamMember.id === member.id,
      ),
  );

  // ==========================================
  // ADD MEMBER
  // ==========================================

  async function handleAddMember() {
    if (!selectedMemberId) {
      toast.error("Please select a member");
      return;
    }

    setAdding(true);

    try {
      const { error } = await addTeamMember({
        teamId: team.id,
        memberId: selectedMemberId,
      });

      if (error) {
        toast.error(error);
        return;
      }

      toast.success("Member added to team");

      setSelectedMemberId("");
      setDialogOpen(false);

      router.refresh();
    } catch {
      toast.error("Failed to add member");
    } finally {
      setAdding(false);
    }
  }

  // ==========================================
  // DIALOG CHANGE
  // ==========================================

  function handleOpenChange(open: boolean) {
    setDialogOpen(open);

    if (!open) {
      setSelectedMemberId("");
    }
  }

  return (
    <>
      {/* Add Member Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setDialogOpen(true)}
        aria-label={`Add member to ${team.name}`}
      >
        <UserPlus className="h-4 w-4" />
      </Button>

      {/* Add Member Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={handleOpenChange}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add Member
            </DialogTitle>

            <DialogDescription>
              Add a member to {team.name}.
            </DialogDescription>
          </DialogHeader>

          {availableMembers.length > 0 ? (
            <div className="space-y-4">
              {/* Member Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Member
                </label>

                <select
                  value={selectedMemberId}
                  onChange={(e) =>
                    setSelectedMemberId(
                      e.target.value,
                    )
                  }
                  disabled={adding}
                  className="
                    flex h-10 w-full rounded-md
                    border border-input
                    bg-background
                    px-3 py-2
                    text-sm
                    ring-offset-background
                    focus:outline-none
                    focus:ring-2
                    focus:ring-ring
                    focus:ring-offset-2
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  <option value="">
                    Select a member
                  </option>

                  {availableMembers.map(
                    (member) => {
                      const memberLabel = [
                        member.user.firstName,
                        member.user.gamerName
                          ? `"${member.user.gamerName}"`
                          : null,
                        member.user.lastName,
                      ]
                        .filter(Boolean)
                        .join(" ") || "Unnamed Member";

                      return (
                        <option
                          key={member.id}
                          value={member.id}
                        >
                          {memberLabel}
                        </option>
                      );
                    },
                  )}
                </select>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setDialogOpen(false)
                  }
                  disabled={adding}
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  onClick={handleAddMember}
                  disabled={
                    adding ||
                    !selectedMemberId
                  }
                >
                  {adding
                    ? "Adding..."
                    : "Add Member"}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              All available members are already
              on this team.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
