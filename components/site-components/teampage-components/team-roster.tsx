import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import type { TeamPageMember } from "./team-page-types";

type TeamRosterProps = {
  members: TeamPageMember[];
};

function getMemberName(member: TeamPageMember) {
  return [
    member.user.firstName,
    member.user.gamerName ? `"${member.user.gamerName}"` : null,
    member.user.lastName,
  ]
    .filter(Boolean)
    .join(" ");
}

function getMemberInitials(member: TeamPageMember) {
  const initials = [member.user.firstName?.[0], member.user.lastName?.[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase();

  return initials || member.user.gamerName?.[0]?.toUpperCase() || "M";
}

export default function TeamRoster({ members }: TeamRosterProps) {
  if (members.length === 0) {
    return (
      <p className="px-1 py-2 text-sm text-gray-200">
        No members have been announced for this team.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {members.map((member) => {
        const memberName = getMemberName(member) || "Unnamed Member";

        return (
          <div
            key={member.id}
            className="flex items-center gap-3 rounded-md border border-white/10 bg-gray-950/75 p-2.5"
          >
            <Avatar className="h-10 w-10 border border-red-500/30">
              <AvatarImage
                src={member.user.avatarUrl ?? undefined}
                alt={memberName}
              />
              <AvatarFallback className="bg-red-950 text-sm text-red-100">
                {getMemberInitials(member)}
              </AvatarFallback>
            </Avatar>

            <p className="min-w-0 truncate text-sm font-medium text-gray-100">
              {memberName}
            </p>
          </div>
        );
      })}
    </div>
  );
}
