import TeamsDashboard from "@/components/site-components/teampage-components/teams-dashboard";
import { getGamesWithTeamsAndMembers } from "@/server/games";

export default async function Page() {
  const { data: games, error } = await getGamesWithTeamsAndMembers();

  return (
    <main className="min-h-screen bg-black/25 bg-[url('/uh-site-background.png')] bg-cover bg-center bg-fixed bg-no-repeat bg-blend-multiply px-4 py-12 font-sans font-bold text-white sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1600px] space-y-8">
        <header className="rounded-xl border border-red-500/30 bg-gradient-to-br from-gray-950/95 via-red-950/95 to-gray-900/90 px-6 py-8 text-center shadow-xl backdrop-blur-lg sm:px-10">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-red-300">
            Coog Gaming Rosters
          </p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            Meet Our Teams
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-100 sm:text-base">
            Explore the games we compete in and meet the Cougars representing
            each roster.
          </p>
        </header>

        {error ? (
          <div
            role="alert"
            className="rounded-xl border border-red-500/40 bg-gray-950/80 px-6 py-10 text-center shadow-xl backdrop-blur-lg"
          >
            <h2 className="text-xl font-bold">Unable to load teams</h2>
            <p className="mt-2 text-sm text-gray-100">
              Please try again later.
            </p>
          </div>
        ) : (
          <TeamsDashboard games={games ?? []} />
        )}
      </div>
    </main>
  );
}
