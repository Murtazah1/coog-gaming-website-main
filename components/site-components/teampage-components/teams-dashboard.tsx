import { Gamepad2 } from "lucide-react";

import GameCard from "./game-card";
import type { TeamPageGame } from "./team-page-types";

type TeamsDashboardProps = {
  games: TeamPageGame[];
};

export default function TeamsDashboard({ games }: TeamsDashboardProps) {
  if (games.length === 0) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-gray-950/90 px-6 py-12 text-center text-white shadow-xl backdrop-blur-lg">
        <Gamepad2 className="mx-auto h-10 w-10 text-red-400" />
        <h2 className="mt-4 text-xl font-bold">Teams coming soon</h2>
        <p className="mt-2 text-sm font-bold text-gray-100">
          Our game rosters will appear here once they are announced.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
      {games.map((game) => (
        <GameCard key={game.id} game={game} />
      ))}
    </div>
  );
}
