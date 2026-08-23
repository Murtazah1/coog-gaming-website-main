


import GameCollapsible from "./game-collapsible/game-collapsible";


export type DashboardMember = {
  id: string;
  userId: string;

  user: {
    firstName: string | null;
    lastName: string | null;
    gamerName: string | null;
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
    <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] items-start gap-4">
      {games.map((game) => (
        <div key={game.id}>
          <GameCollapsible game={game} members={members} />
        </div>
      ))}
    </div>
  );
}
