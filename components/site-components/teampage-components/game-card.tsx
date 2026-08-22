"use client";

import Image from "next/image";
import { ChevronRight, Gamepad2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import TeamCard from "./team-card";
import type { TeamPageGame } from "./team-page-types";

type GameCardProps = {
  game: TeamPageGame;
};

export default function GameCard({ game }: GameCardProps) {
  return (
    <Collapsible>
      <Card className="overflow-hidden border-red-500/30 bg-gradient-to-br from-gray-950/80 via-red-950/80 to-gray-900/70 py-0 text-white shadow-xl backdrop-blur-lg">
        <CardHeader className="p-5">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="group h-auto w-full justify-start p-0 text-white hover:bg-transparent hover:text-white"
            >
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/15 bg-black/30">
                  {game.imageUrl ? (
                    <Image
                      src={game.imageUrl}
                      alt={`${game.name} artwork`}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : (
                    <Gamepad2 className="h-8 w-8 text-red-300" />
                  )}
                </div>

                <div className="min-w-0 flex-1 text-left">
                  <h2 className="truncate text-xl font-semibold">
                    {game.name}
                  </h2>
                  <p className="mt-1 text-sm font-normal text-gray-300">
                    {game.teams.length} {game.teams.length === 1 ? "team" : "teams"}
                  </p>
                </div>

                <ChevronRight className="h-5 w-5 shrink-0 text-red-300 transition-transform group-data-[state=open]:rotate-90" />
              </div>
            </Button>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-3 border-t border-red-500/20 p-5">
            {game.teams.length > 0 ? (
              game.teams.map((team) => <TeamCard key={team.id} team={team} />)
            ) : (
              <p className="text-sm text-gray-300">
                No teams have been announced for this game.
              </p>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
