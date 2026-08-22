"use client";

import { ChevronRight, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import TeamRoster from "./team-roster";
import type { TeamPageTeam } from "./team-page-types";

type TeamCardProps = {
  team: TeamPageTeam;
};

export default function TeamCard({ team }: TeamCardProps) {
  return (
    <Collapsible>
      <div className="overflow-hidden rounded-lg border border-white/15 bg-black/20">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="group h-auto w-full justify-start rounded-none p-4 text-white hover:bg-white/5 hover:text-white"
          >
            <ChevronRight className="h-4 w-4 shrink-0 text-red-300 transition-transform group-data-[state=open]:rotate-90" />
            <Users className="h-4 w-4 shrink-0 text-gray-300" />

            <div className="min-w-0 flex-1 text-left">
              <p className="truncate font-medium">{team.name}</p>
              <p className="mt-0.5 text-xs font-normal text-gray-400">
                {team.members.length}{" "}
                {team.members.length === 1 ? "member" : "members"}
              </p>
            </div>
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t border-white/10 p-3">
            <TeamRoster members={team.members} />
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
