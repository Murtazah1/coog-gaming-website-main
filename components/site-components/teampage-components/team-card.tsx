import { ChevronRight, Users } from "lucide-react";

import TeamRoster from "./team-roster";
import type { TeamPageTeam } from "./team-page-types";

type TeamCardProps = {
  team: TeamPageTeam;
};

export default function TeamCard({ team }: TeamCardProps) {
  return (
    <details className="group/team overflow-hidden rounded-lg border border-white/15 bg-black/50">
      <summary className="flex cursor-pointer list-none items-center gap-2 p-4 outline-none transition hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-400 [&::-webkit-details-marker]:hidden">
        <ChevronRight className="h-4 w-4 shrink-0 text-red-300 transition-transform group-open/team:rotate-90" />
        <Users className="h-4 w-4 shrink-0 text-gray-300" />

        <div className="min-w-0 flex-1 text-left">
          <p className="truncate font-medium">{team.name}</p>
          <p className="mt-0.5 text-xs font-normal text-gray-200">
            {team.members.length}{" "}
            {team.members.length === 1 ? "member" : "members"}
          </p>
        </div>
      </summary>

      <div className="border-t border-white/10 p-3">
        <TeamRoster members={team.members} />
      </div>
    </details>
  );
}
