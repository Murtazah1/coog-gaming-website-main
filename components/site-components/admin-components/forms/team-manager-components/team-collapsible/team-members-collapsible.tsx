"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import { removeTeamMember } from "@/server/team-members";
import type { DashboardMember } from "../games-dashboard";

type TeamMembersProps = {
  teamId: string;
  members: DashboardMember[];
};

export default function TeamMembers({
  teamId,
  members,
}: TeamMembersProps) {
  const router = useRouter();

  const [removingMemberId, setRemovingMemberId] =
    useState<string | null>(null);

  async function handleRemoveMember(
    member: DashboardMember,
  ) {
    const fullName = [
      member.user.firstName,
      member.user.lastName,
    ]
      .filter(Boolean)
      .join(" ");

    const memberLabel =
      fullName ||
      member.user.gamerName ||
      "this member";

    if (
      !confirm(
        `Remove ${memberLabel} from this team?`,
      )
    ) {
      return;
    }

    setRemovingMemberId(member.id);

    try {
      const { error } = await removeTeamMember({
        teamId,
        memberId: member.id,
      });

      if (error) {
        toast.error(error);
        return;
      }

      toast.success(
        "Member removed from team",
      );

      router.refresh();
    } catch {
      toast.error(
        "Failed to remove member from team",
      );
    } finally {
      setRemovingMemberId(null);
    }
  }

  return (
    <div className="space-y-2">
      {members.length > 0 ? (
        members.map((member) => {
          const fullName = [
            member.user.firstName,
            member.user.lastName,
          ]
            .filter(Boolean)
            .join(" ");

          const initials = [
            member.user.firstName?.[0],
            member.user.lastName?.[0],
          ]
            .filter(Boolean)
            .join("")
            .toUpperCase();

          return (
            <div
              key={member.id}
              className="flex items-center gap-3 rounded-md border p-2"
            >
              {/* Avatar */}
              <Avatar className="h-9 w-9">
                <AvatarImage
                  src={
                    member.user.avatarUrl ??
                    undefined
                  }
                  alt={
                    fullName ||
                    member.user.gamerName ||
                    "Member"
                  }
                />

                <AvatarFallback>
                  {initials || "M"}
                </AvatarFallback>
              </Avatar>

              {/* Member Information */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {fullName ||
                    member.user.gamerName ||
                    "Unnamed Member"}
                </p>

                {member.user.gamerName &&
                  fullName && (
                    <p className="truncate text-xs text-muted-foreground">
                      {member.user.gamerName}
                    </p>
                  )}
              </div>

              {/* Remove From Team */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  handleRemoveMember(member)
                }
                disabled={
                  removingMemberId ===
                  member.id
                }
                aria-label={`Remove ${
                  fullName ||
                  member.user.gamerName ||
                  "member"
                } from team`}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          );
        })
      ) : (
        <p className="text-sm text-muted-foreground">
          No members have been added to this
          team.
        </p>
      )}
    </div>
  );
}
