import React from "react";


import GameCollapsible from "./game-collapsible/game-collapsible";
import type { Member } from "@/db/schema";

export type DashboardMember = {
  id: string;
  userId: string;
  discordName: string | null;

  user: {
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
};

export type DashboardTeam = {
  id: string;
  name: string;
  gameId: string;
  members: DashboardMember[];
};

export type DashboardGame = {
  id: string;
  name: string;
  imageUrl: string | null;
  teams: DashboardTeam[];
};

type GameManagementDashboardProps = {
  games: DashboardGame[];
  members: DashboardMember[]
};

export default function GamesDashboard({
  games, members
}: GameManagementDashboardProps) {
  return (
    <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
      {games.map((game) => (
        <div key={game.id}>
          <GameCollapsible game={game} members={members} />
        </div>
      ))}
    </div>
  );
}
