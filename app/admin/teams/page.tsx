import { getGamesWithTeamsAndMembers } from "@/server/games";
import GamesDashboard from "@/components/site-components/admin-components/games-dashboard";
import AddGameButton from "@/components/site-components/admin-components/forms/team-actions/add-game-button";
import { getMembers } from "@/server/members";
import type { DashboardMember } from "@/components/site-components/admin-components/games-dashboard";

export default async function Page() {
  const [gamesResult, membersResult] = await Promise.all([
    getGamesWithTeamsAndMembers(),
    getMembers(),
  ]);

  // after getting the members we need to map the fields from getMembers onto DashboardMember
  // for reference getMembers gives us things such as the user email and ID which we do not need

  const games = gamesResult.data ?? [];
  const members: DashboardMember[] = (membersResult.data ?? []).map(
    ({ member, user }) => ({
      id: member.id,
      userId: member.userId,
      discordName: member.discordName,

      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
      },
    }),
  );
  return (
    <div className="space-y-6 px-6 py-6 md:px-8 lg:px-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Games & Teams Management</h1>

        <AddGameButton />
      </div>

      <GamesDashboard games={games ?? []} members={members} />
    </div>
  );
}
