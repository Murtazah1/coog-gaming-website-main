"use client";

import { ChevronRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { DashboardTeam } from "../../games-dashboard";
import type { DashboardMember } from "../../games-dashboard";
import TeamActions from "./team-actions";
import TeamMembersCollapsible from "./team-members-collapsible";

type TeamCollapsibleProps = {
  team: DashboardTeam;
  members: DashboardMember[]
};

export default function TeamCollapsible({
  team, members
}: TeamCollapsibleProps) {
  return (
    <Collapsible>
      <div className="rounded-md border">
        {/* Team Header */}
        <div className="flex items-center gap-2 p-3">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="group h-auto w-full justify-start p-0 hover:bg-transparent"
            >
              <ChevronRight
                className="
                  h-4 w-4 shrink-0
                  transition-transform
                  group-data-[state=open]:rotate-90
                "
              />

              <Users className="h-4 w-4 shrink-0 text-muted-foreground" />

              {/* Team Information */}
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate font-medium">
                  {team.name}
                </p>

                <p className="text-xs font-normal text-muted-foreground">
                  {team.members.length}{" "}
                  {team.members.length === 1
                    ? "member"
                    : "members"}
                </p>
                
              </div>
            </Button>
          </CollapsibleTrigger>
          <TeamActions team={team} members={members}/>
        </div>

        {/* Team Contents */}
        <CollapsibleContent>
          <div className="border-t p-3">
            <TeamMembersCollapsible teamId={team.id} members={team.members}/>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}