import {
  createClient,
  type SupabaseClient,
  type User as AuthUser,
} from "@supabase/supabase-js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import {
  address,
  admins,
  checkIns,
  events,
  games,
  members,
  teamMembers,
  teams,
  users,
} from "./schema";

const seedMarker = "coog-gaming-db-seed-v1";

const ids = {
  game: "10000000-0000-4000-8000-000000000001",
  varsityTeam: "20000000-0000-4000-8000-000000000001",
  communityTeam: "20000000-0000-4000-8000-000000000002",
  presidentMember: "30000000-0000-4000-8000-000000000001",
  eventAdminMember: "30000000-0000-4000-8000-000000000002",
  regularMember: "30000000-0000-4000-8000-000000000003",
  presidentAdmin: "40000000-0000-4000-8000-000000000001",
  eventAdmin: "40000000-0000-4000-8000-000000000002",
  welcomeEvent: "50000000-0000-4000-8000-000000000001",
  tournamentEvent: "50000000-0000-4000-8000-000000000002",
  memberCheckIn: "60000000-0000-4000-8000-000000000001",
  adminCheckIn: "60000000-0000-4000-8000-000000000002",
} as const;

const authFixtures = [
  {
    key: "president",
    email: "seed.president@cooggaming.test",
    firstName: "Test",
    lastName: "President",
  },
  {
    key: "eventAdmin",
    email: "seed.event-admin@cooggaming.test",
    firstName: "Test",
    lastName: "Event Admin",
  },
  {
    key: "member",
    email: "seed.member@cooggaming.test",
    firstName: "Test",
    lastName: "Member",
  },
  {
    key: "user",
    email: "seed.user@cooggaming.test",
    firstName: "Test",
    lastName: "User",
  },
] as const;

type FixtureKey = (typeof authFixtures)[number]["key"];

function requireEnvironmentVariable(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function daysFromNow(days: number, hour: number) {
  const value = new Date();
  value.setUTCDate(value.getUTCDate() + days);
  value.setUTCHours(hour, 0, 0, 0);
  return value;
}

async function listAllAuthUsers(
  supabase: SupabaseClient,
) {
  const authUsers: AuthUser[] = [];
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1_000,
    });

    if (error) {
      throw new Error(`Unable to list Supabase Auth users: ${error.message}`);
    }

    authUsers.push(...data.users);

    if (!data.nextPage) {
      return authUsers;
    }

    page = data.nextPage;
  }
}

async function ensureAuthFixtures(
  supabase: SupabaseClient,
  password: string,
) {
  const existingUsers = await listAllAuthUsers(supabase);
  const usersByEmail = new Map(
    existingUsers.map((user) => [user.email?.toLowerCase(), user]),
  );
  const result = new Map<FixtureKey, AuthUser>();

  for (const fixture of authFixtures) {
    const email = fixture.email.toLowerCase();
    let authUser = usersByEmail.get(email);

    if (authUser) {
      if (authUser.user_metadata?.seeded_by !== seedMarker) {
        throw new Error(
          `Refusing to reset ${email}: it was not created by this seed file.`,
        );
      }

      const { data, error } = await supabase.auth.admin.updateUserById(
        authUser.id,
        {
          password,
          email_confirm: true,
          user_metadata: { seeded_by: seedMarker },
        },
      );

      if (error || !data.user) {
        throw new Error(
          `Unable to update Auth fixture ${email}: ${error?.message ?? "unknown error"}`,
        );
      }

      authUser = data.user;
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { seeded_by: seedMarker },
      });

      if (error || !data.user) {
        throw new Error(
          `Unable to create Auth fixture ${email}: ${error?.message ?? "unknown error"}`,
        );
      }

      authUser = data.user;
    }

    result.set(fixture.key, authUser);
  }

  return result;
}

async function main() {
  const databaseUrl = requireEnvironmentVariable("DATABASE_URL");
  const supabaseUrl = requireEnvironmentVariable("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnvironmentVariable(
    "SUPABASE_SERVICE_ROLE_KEY",
  );
  const password = requireEnvironmentVariable("SEED_TEST_PASSWORD");

  if (password.length < 12) {
    throw new Error("SEED_TEST_PASSWORD must be at least 12 characters long.");
  }

  const sql = postgres(databaseUrl, { max: 1, prepare: false });
  const db = drizzle({ client: sql });
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    console.log("Creating or updating Supabase Auth test accounts...");
    const authUsers = await ensureAuthFixtures(supabase, password);

    const presidentUser = authUsers.get("president")!;
    const eventAdminUser = authUsers.get("eventAdmin")!;
    const memberUser = authUsers.get("member")!;
    const basicUser = authUsers.get("user")!;

    const userRows = authFixtures.map((fixture) => {
      const authUser = authUsers.get(fixture.key)!;

      return {
        id: authUser.id,
        email: fixture.email,
        firstName: fixture.firstName,
        lastName: fixture.lastName,
        avatarUrl: null,
      };
    });

    const welcomeStart = daysFromNow(2, 23);
    const tournamentStart = daysFromNow(7, 18);

    await db.transaction(async (tx) => {
      for (const row of userRows) {
        await tx
          .insert(users)
          .values(row)
          .onConflictDoUpdate({
            target: users.id,
            set: {
              email: row.email,
              firstName: row.firstName,
              lastName: row.lastName,
              avatarUrl: row.avatarUrl,
            },
          });
      }

      await tx
        .insert(games)
        .values({ id: ids.game, name: "Seed Test Game", imageUrl: null })
        .onConflictDoUpdate({
          target: games.id,
          set: { name: "Seed Test Game", imageUrl: null },
        });

      const teamRows = [
        { id: ids.varsityTeam, name: "Seed Varsity", gameId: ids.game },
        {
          id: ids.communityTeam,
          name: "Seed Community",
          gameId: ids.game,
        },
      ];

      for (const row of teamRows) {
        await tx
          .insert(teams)
          .values(row)
          .onConflictDoUpdate({
            target: teams.id,
            set: { name: row.name, gameId: row.gameId },
          });
      }

      const periodEnd = daysFromNow(180, 0).toISOString().slice(0, 10);

      const memberRows = [
        {
          id: ids.presidentMember,
          userId: presidentUser.id,
          planType: "year" as const,
          currentPeriodEnd: periodEnd,
          discordName: "seed-president",
        },
        {
          id: ids.eventAdminMember,
          userId: eventAdminUser.id,
          planType: "year" as const,
          currentPeriodEnd: periodEnd,
          discordName: "seed-event-admin",
        },
        {
          id: ids.regularMember,
          userId: memberUser.id,
          planType: "semester" as const,
          currentPeriodEnd: periodEnd,
          discordName: "seed-member",
        },
      ];

      for (const row of memberRows) {
        await tx
          .insert(members)
          .values(row)
          .onConflictDoUpdate({
            target: members.id,
            set: {
              userId: row.userId,
              planType: row.planType,
              currentPeriodEnd: row.currentPeriodEnd,
              discordName: row.discordName,
            },
          });
      }

      const adminRows = [
        { id: ids.presidentAdmin, memberId: ids.presidentMember, role: 0 },
        { id: ids.eventAdmin, memberId: ids.eventAdminMember, role: 8 },
      ];

      for (const row of adminRows) {
        await tx
          .insert(admins)
          .values(row)
          .onConflictDoUpdate({
            target: admins.id,
            set: { memberId: row.memberId, role: row.role },
          });
      }

      await tx
        .insert(teamMembers)
        .values([
          { teamId: ids.varsityTeam, memberId: ids.presidentMember },
          { teamId: ids.varsityTeam, memberId: ids.regularMember },
          { teamId: ids.communityTeam, memberId: ids.eventAdminMember },
          { teamId: ids.communityTeam, memberId: ids.regularMember },
        ])
        .onConflictDoNothing();

      const eventRows = [
        {
          id: ids.welcomeEvent,
          title: "Seed Welcome Night",
          location: "Student Center",
          startDate: welcomeStart,
          endDate: new Date(welcomeStart.getTime() + 2 * 60 * 60 * 1_000),
          createdBy: ids.presidentAdmin,
          description: "Sample event for login and RLS testing.",
        },
        {
          id: ids.tournamentEvent,
          title: "Seed Test Tournament",
          location: "Gaming Lounge",
          startDate: tournamentStart,
          endDate: new Date(
            tournamentStart.getTime() + 4 * 60 * 60 * 1_000,
          ),
          createdBy: ids.eventAdmin,
          description: "Sample tournament managed by the second test admin.",
        },
      ];

      for (const row of eventRows) {
        await tx
          .insert(events)
          .values(row)
          .onConflictDoUpdate({
            target: events.id,
            set: {
              title: row.title,
              location: row.location,
              startDate: row.startDate,
              endDate: row.endDate,
              createdBy: row.createdBy,
              description: row.description,
            },
          });
      }

      const checkInRows = [
        {
          id: ids.memberCheckIn,
          userId: memberUser.id,
          eventId: ids.welcomeEvent,
          scannedAt: daysFromNow(-1, 20),
        },
        {
          id: ids.adminCheckIn,
          userId: presidentUser.id,
          eventId: ids.tournamentEvent,
          scannedAt: daysFromNow(-1, 21),
        },
      ];

      for (const row of checkInRows) {
        await tx
          .insert(checkIns)
          .values(row)
          .onConflictDoUpdate({
            target: checkIns.id,
            set: {
              userId: row.userId,
              eventId: row.eventId,
              scannedAt: row.scannedAt,
            },
          });
      }

      await tx
        .insert(address)
        .values({
          id: ids.regularMember,
          line1: "123 Test Street",
          line2: null,
          city: "Houston",
          state: "TX",
          postalCode: "77004",
          country: "US",
        })
        .onConflictDoUpdate({
          target: address.id,
          set: {
            line1: "123 Test Street",
            line2: null,
            city: "Houston",
            state: "TX",
            postalCode: "77004",
            country: "US",
          },
        });
    });

    console.log("Seed completed. Test logins:");
    for (const fixture of authFixtures) {
      console.log(`- ${fixture.key}: ${fixture.email}`);
    }
    console.log("All test accounts use SEED_TEST_PASSWORD.");
    console.log(`Basic user id: ${basicUser.id}`);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
