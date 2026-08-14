"use client";

import Image from "next/image";
import { ChevronRight, Gamepad2 } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import GameActions from "./game-actions";
import TeamCollapsible from "../team-collapsible/team-collapsible";
import type { DashboardGame } from "../games-dashboard";
import type { DashboardMember } from "../games-dashboard";


type GameCollapsibleProps = {
  game: DashboardGame;
  members: DashboardMember[]
};

export default function GameCollapsible({
  game, members
}: GameCollapsibleProps) {
  return (
    <Collapsible>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            {/* 
              This button ONLY handles opening/closing
              the game collapsible.
            */}
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="
                  group h-auto min-w-0 flex-1
                  justify-start p-0
                  hover:bg-transparent
                "
              >
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  {/* Game Image */}
                  <div
                    className="
                      relative flex h-16 w-16 shrink-0
                      items-center justify-center
                      overflow-hidden rounded-md bg-muted
                    "
                  >
                    {game.imageUrl ? (
                      <Image
                        src={game.imageUrl}
                        alt={game.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <Gamepad2 className="h-7 w-7 text-muted-foreground" />
                    )}
                  </div>

                  {/* Game Information */}
                  <div className="min-w-0 flex-1 text-left">
                    <h2 className="truncate text-lg font-semibold">
                      {game.name}
                    </h2>

                    <p className="text-sm font-normal text-muted-foreground">
                      {game.teams.length}{" "}
                      {game.teams.length === 1
                        ? "team"
                        : "teams"}
                    </p>
                  </div>

                  {/* Collapsible Arrow */}
                  <ChevronRight
                    className="
                      h-5 w-5 shrink-0
                      transition-transform
                      group-data-[state=open]:rotate-90
                    "
                  />
                </div>
              </Button>
            </CollapsibleTrigger>

        
            <GameActions game={game} />
          </div>
        </CardHeader>

        {/* Game Teams */}
        <CollapsibleContent>
          <CardContent>
            {game.teams.length > 0 ? (
              <div className="space-y-3">
                {game.teams.map((team) => (
                  <TeamCollapsible
                    key={team.id}
                    team={team}
                    members={members}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No teams have been created for this game.
              </p>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}