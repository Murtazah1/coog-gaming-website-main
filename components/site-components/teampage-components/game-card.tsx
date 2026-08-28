import Image from "next/image";
import { ChevronRight, Gamepad2 } from "lucide-react";

import TeamCard from "./team-card";
import type { TeamPageGame } from "./team-page-types";

type GameCardProps = {
  game: TeamPageGame;
};

export default function GameCard({ game }: GameCardProps) {
  return (
    <details className="group/game overflow-hidden rounded-xl border border-red-500/30 bg-gradient-to-br from-gray-950/95 via-red-950/90 to-gray-900/90 text-white shadow-xl backdrop-blur-lg">
      <summary className="flex cursor-pointer list-none items-center gap-4 p-5 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-400 [&::-webkit-details-marker]:hidden">
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
          <h2 className="truncate text-xl font-bold">{game.name}</h2>
          <p className="mt-1 text-sm font-bold text-gray-100">
            {game.teams.length} {game.teams.length === 1 ? "team" : "teams"}
          </p>
        </div>

        <ChevronRight className="h-5 w-5 shrink-0 text-red-300 transition-transform group-open/game:rotate-90" />
      </summary>

      <div className="space-y-3 border-t border-red-500/20 p-5">
        {game.teams.length > 0 ? (
          game.teams.map((team) => <TeamCard key={team.id} team={team} />)
        ) : (
          <p className="text-sm font-bold text-gray-100">
            No teams have been announced for this game.
          </p>
        )}
      </div>
    </details>
  );
}
