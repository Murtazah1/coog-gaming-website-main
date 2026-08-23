import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { getAdminRoleLabel } from "@/db/schema/admins";
import { getAdmins } from "@/server/admins";

export const dynamic = "force-dynamic";

function getDisplayName(
  firstName: string | null,
  lastName: string | null,
  gamerName: string | null,
  email: string,
) {
  const name = [
    firstName,
    gamerName ? `"${gamerName}"` : null,
    lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return name || email;
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function Page() {
  const { data: admins, error } = await getAdmins();

  return (
    <main className="min-h-screen bg-[url('/uh-site-background.png')] bg-cover bg-center bg-fixed px-4 py-16 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-10">
        <section className="rounded-2xl border border-red-500/30 bg-gradient-to-br from-gray-950/95 via-red-950/90 to-gray-900/90 px-6 py-10 text-center shadow-2xl backdrop-blur-lg sm:px-10">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-red-300">
            University of Houston
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            About COOG Gaming
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-gray-200 sm:text-lg">
            COOG Gaming is the University of Houston&apos;s premier gaming club—a
            home for Cougars who love esports, board games, tabletop games,
            trading card games, and the communities built around them.
          </p>
        </section>

        <section aria-labelledby="leadership-heading">
          <div className="mb-6 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-red-300">
              Meet the team
            </p>
            <h2
              id="leadership-heading"
              className="mt-2 text-3xl font-bold tracking-tight"
            >
              Club Leadership
            </h2>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-500/30 bg-gray-950/80 p-6 text-center text-red-200 backdrop-blur-md">
              The leadership roster is unavailable right now. Please check back
              soon.
            </div>
          ) : admins?.length ? (
            <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {admins.map(({ admin, member }) => {
                const displayName = getDisplayName(
                  member.firstName,
                  member.lastName,
                  member.gamerName,
                  member.email,
                );
                const initialsName =
                  [member.firstName, member.lastName]
                    .filter(Boolean)
                    .join(" ") ||
                  member.gamerName ||
                  member.email;

                return (
                  <li
                    key={admin.id}
                    className="group flex flex-col items-center gap-4 rounded-xl border border-white/15 bg-gray-950/90 p-6 text-center shadow-lg backdrop-blur-md transition hover:-translate-y-0.5 hover:border-red-500/50 hover:bg-red-950/90"
                  >
                    <Avatar className="h-20 w-20 shrink-0 rounded-full border border-red-500/40">
                      <AvatarImage
                        src={member.avatarUrl ?? undefined}
                        alt={displayName}
                      />
                      <AvatarFallback className="bg-red-950 text-sm font-bold text-red-100">
                        {getInitials(initialsName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold">
                        {displayName}
                      </h3>
                      <p className="text-sm font-medium text-red-300">
                        {getAdminRoleLabel(admin.role)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <div className="rounded-xl border border-white/15 bg-gray-950/90 p-6 text-center text-gray-100 backdrop-blur-md">
              Leadership details are coming soon.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
