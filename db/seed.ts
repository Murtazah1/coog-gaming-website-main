import {
  createClient,
  type SupabaseClient,
  type User as AuthUser,
} from "@supabase/supabase-js";
import { inArray } from "drizzle-orm";
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

function seedId(namespace: number, index: number) {
  return `${namespace}0000000-0000-4000-8000-${index
    .toString()
    .padStart(12, "0")}`;
}

const adminAuthFixtures = [
  {
    key: "president",
    email: "seed.president@cooggaming.test",
    firstName: "Avery",
    lastName: "Morgan",
    gamerName: "seed-president",
    memberIndex: 1,
    adminIndex: 1,
    role: 0,
  },
  {
    key: "eventAdmin",
    email: "seed.event-admin@cooggaming.test",
    firstName: "Harper",
    lastName: "Wilson",
    gamerName: "seed-event-manager",
    memberIndex: 2,
    adminIndex: 2,
    role: 8,
  },
  {
    key: "vp",
    email: "seed.vp@cooggaming.test",
    firstName: "Jordan",
    lastName: "Lee",
    gamerName: "seed-vp",
    memberIndex: 4,
    adminIndex: 3,
    role: 1,
  },
  {
    key: "treasurer",
    email: "seed.treasurer@cooggaming.test",
    firstName: "Maya",
    lastName: "Patel",
    gamerName: "seed-treasurer",
    memberIndex: 5,
    adminIndex: 4,
    role: 2,
  },
  {
    key: "secretary",
    email: "seed.secretary@cooggaming.test",
    firstName: "Ethan",
    lastName: "Nguyen",
    gamerName: "seed-secretary",
    memberIndex: 6,
    adminIndex: 5,
    role: 3,
  },
  {
    key: "esportsDirector",
    email: "seed.esports-director@cooggaming.test",
    firstName: "Sofia",
    lastName: "Ramirez",
    gamerName: "seed-esports",
    memberIndex: 7,
    adminIndex: 6,
    role: 4,
  },
  {
    key: "boardGameManager",
    email: "seed.board-games@cooggaming.test",
    firstName: "Noah",
    lastName: "Williams",
    gamerName: "seed-board-games",
    memberIndex: 8,
    adminIndex: 7,
    role: 5,
  },
  {
    key: "tabletopManager",
    email: "seed.tabletop@cooggaming.test",
    firstName: "Chloe",
    lastName: "Kim",
    gamerName: "seed-tabletop",
    memberIndex: 9,
    adminIndex: 8,
    role: 6,
  },
  {
    key: "tcgManager",
    email: "seed.tcg@cooggaming.test",
    firstName: "Liam",
    lastName: "Garcia",
    gamerName: "seed-tcg",
    memberIndex: 10,
    adminIndex: 9,
    role: 7,
  },
  {
    key: "sponsorshipManager",
    email: "seed.sponsorship@cooggaming.test",
    firstName: "Emma",
    lastName: "Davis",
    gamerName: "seed-sponsorship",
    memberIndex: 11,
    adminIndex: 10,
    role: 9,
  },
  {
    key: "officer",
    email: "seed.officer@cooggaming.test",
    firstName: "Lucas",
    lastName: "Chen",
    gamerName: "seed-officer",
    memberIndex: 12,
    adminIndex: 11,
    role: 10,
  },
] as const;

const playerAuthFixtures = [
  {
    key: "member",
    email: "seed.member@cooggaming.test",
    firstName: "Riley",
    lastName: "Johnson",
    gamerName: "seed-player-01",
    memberIndex: 3,
  },
  {
    key: "player02",
    email: "seed.player02@cooggaming.test",
    firstName: "Kai",
    lastName: "Martinez",
    gamerName: "seed-player-02",
    memberIndex: 13,
  },
  {
    key: "player03",
    email: "seed.player03@cooggaming.test",
    firstName: "Zoe",
    lastName: "Brown",
    gamerName: "seed-player-03",
    memberIndex: 14,
  },
  {
    key: "player04",
    email: "seed.player04@cooggaming.test",
    firstName: "Miles",
    lastName: "Taylor",
    gamerName: "seed-player-04",
    memberIndex: 15,
  },
  {
    key: "player05",
    email: "seed.player05@cooggaming.test",
    firstName: "Aria",
    lastName: "Anderson",
    gamerName: "seed-player-05",
    memberIndex: 16,
  },
  {
    key: "player06",
    email: "seed.player06@cooggaming.test",
    firstName: "Leo",
    lastName: "Thomas",
    gamerName: "seed-player-06",
    memberIndex: 17,
  },
  {
    key: "player07",
    email: "seed.player07@cooggaming.test",
    firstName: "Nora",
    lastName: "Jackson",
    gamerName: "seed-player-07",
    memberIndex: 18,
  },
  {
    key: "player08",
    email: "seed.player08@cooggaming.test",
    firstName: "Owen",
    lastName: "White",
    gamerName: "seed-player-08",
    memberIndex: 19,
  },
  {
    key: "player09",
    email: "seed.player09@cooggaming.test",
    firstName: "Mia",
    lastName: "Harris",
    gamerName: "seed-player-09",
    memberIndex: 20,
  },
  {
    key: "player10",
    email: "seed.player10@cooggaming.test",
    firstName: "Elijah",
    lastName: "Clark",
    gamerName: "seed-player-10",
    memberIndex: 21,
  },
] as const;

const basicUserFixture = {
  key: "user",
  email: "seed.user@cooggaming.test",
  firstName: "Test",
  lastName: "User",
  gamerName: "seed-user",
} as const;

const membershipFixtures = [
  ...adminAuthFixtures,
  ...playerAuthFixtures,
] as const;
const authFixtures = [...membershipFixtures, basicUserFixture] as const;

type FixtureKey = (typeof authFixtures)[number]["key"];
type MembershipKey = (typeof membershipFixtures)[number]["key"];
type AdminKey = (typeof adminAuthFixtures)[number]["key"];

const gameFixtures = [
  { key: "valorant", index: 1, name: "Valorant" },
  { key: "rocketLeague", index: 2, name: "Rocket League" },
  { key: "leagueOfLegends", index: 3, name: "League of Legends" },
  { key: "overwatch", index: 4, name: "Overwatch 2" },
] as const;

type GameKey = (typeof gameFixtures)[number]["key"];

const teamFixtures: ReadonlyArray<{
  key: string;
  index: number;
  name: string;
  gameKey: GameKey;
  roster: readonly [
    MembershipKey,
    MembershipKey,
    MembershipKey,
    MembershipKey,
    MembershipKey,
  ];
}> = [
  {
    key: "valorantVarsity",
    index: 1,
    name: "Valorant Varsity",
    gameKey: "valorant",
    roster: ["member", "player02", "player03", "player04", "player05"],
  },
  {
    key: "valorantAcademy",
    index: 2,
    name: "Valorant Academy",
    gameKey: "valorant",
    roster: ["player06", "player07", "player08", "player09", "player10"],
  },
  {
    key: "rocketLeagueRed",
    index: 3,
    name: "Rocket League Red",
    gameKey: "rocketLeague",
    roster: ["president", "vp", "esportsDirector", "member", "player06"],
  },
  {
    key: "rocketLeagueWhite",
    index: 4,
    name: "Rocket League White",
    gameKey: "rocketLeague",
    roster: [
      "eventAdmin",
      "sponsorshipManager",
      "officer",
      "player07",
      "player08",
    ],
  },
  {
    key: "leagueVarsity",
    index: 5,
    name: "League of Legends Varsity",
    gameKey: "leagueOfLegends",
    roster: ["treasurer", "secretary", "tcgManager", "player09", "player10"],
  },
  {
    key: "overwatchVarsity",
    index: 6,
    name: "Overwatch 2 Varsity",
    gameKey: "overwatch",
    roster: [
      "boardGameManager",
      "tabletopManager",
      "esportsDirector",
      "player03",
      "player04",
    ],
  },
];

const eventFixtures: ReadonlyArray<{
  index: number;
  title: string;
  location: string;
  daysFromNow: number;
  hour: number;
  durationHours: number;
  createdByKey: AdminKey;
  description: string;
}> = [
  {
    index: 1,
    title: "Welcome Night",
    location: "Student Center Ballroom",
    daysFromNow: 2,
    hour: 23,
    durationHours: 2,
    createdByKey: "president",
    description: "Meet the organization, officers, and competitive teams.",
  },
  {
    index: 2,
    title: "Fall Kickoff Tournament",
    location: "Gaming Lounge",
    daysFromNow: 7,
    hour: 18,
    durationHours: 4,
    createdByKey: "eventAdmin",
    description: "Multi-game kickoff tournament with seeded brackets.",
  },
  {
    index: 3,
    title: "Weekly LAN Night",
    location: "Student Center North",
    daysFromNow: 1,
    hour: 22,
    durationHours: 3,
    createdByKey: "officer",
    description: "Open play, casual matches, and community matchmaking.",
  },
  {
    index: 4,
    title: "Valorant Tryouts",
    location: "Esports Lab",
    daysFromNow: 4,
    hour: 20,
    durationHours: 3,
    createdByKey: "esportsDirector",
    description: "Competitive tryouts for varsity and academy rosters.",
  },
  {
    index: 5,
    title: "Rocket League Scrim",
    location: "Esports Lab",
    daysFromNow: 6,
    hour: 21,
    durationHours: 2,
    createdByKey: "vp",
    description: "Red versus White exhibition scrim.",
  },
  {
    index: 6,
    title: "League of Legends Practice",
    location: "Gaming Lounge",
    daysFromNow: 9,
    hour: 19,
    durationHours: 3,
    createdByKey: "esportsDirector",
    description: "Draft review, team practice, and VOD analysis.",
  },
  {
    index: 7,
    title: "Board Game Social",
    location: "Student Center Games Room",
    daysFromNow: 11,
    hour: 23,
    durationHours: 3,
    createdByKey: "boardGameManager",
    description: "A casual night featuring strategy and party games.",
  },
  {
    index: 8,
    title: "TCG League Night",
    location: "Student Center South",
    daysFromNow: 14,
    hour: 22,
    durationHours: 3,
    createdByKey: "tcgManager",
    description: "Weekly card game league pairings and open play.",
  },
  {
    index: 9,
    title: "Tabletop One-Shot",
    location: "Library Collaboration Room",
    daysFromNow: 16,
    hour: 20,
    durationHours: 4,
    createdByKey: "tabletopManager",
    description: "Beginner-friendly tabletop roleplaying session.",
  },
  {
    index: 10,
    title: "Sponsor Showcase",
    location: "Student Center Theater",
    daysFromNow: 18,
    hour: 19,
    durationHours: 2,
    createdByKey: "sponsorshipManager",
    description: "Partner demos, giveaways, and organization updates.",
  },
  {
    index: 11,
    title: "Officer Planning Meeting",
    location: "Student Center Conference Room",
    daysFromNow: 21,
    hour: 23,
    durationHours: 2,
    createdByKey: "secretary",
    description: "Monthly planning session for officers and directors.",
  },
  {
    index: 12,
    title: "Community Championship",
    location: "Campus Recreation Center",
    daysFromNow: 28,
    hour: 18,
    durationHours: 6,
    createdByKey: "eventAdmin",
    description: "End-of-month finals across featured competitive titles.",
  },
];

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

async function listAllAuthUsers(supabase: SupabaseClient) {
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
    const userMetadata = {
      seeded_by: seedMarker,
      first_name: fixture.firstName,
      last_name: fixture.lastName,
      gamer_name: fixture.gamerName,
    };
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
          user_metadata: userMetadata,
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
        user_metadata: userMetadata,
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

    const memberIdByKey = new Map<MembershipKey, string>(
      membershipFixtures.map((fixture) => [
        fixture.key,
        seedId(3, fixture.memberIndex),
      ]),
    );
    const adminIdByKey = new Map<AdminKey, string>(
      adminAuthFixtures.map((fixture) => [
        fixture.key,
        seedId(4, fixture.adminIndex),
      ]),
    );
    const gameIdByKey = new Map<GameKey, string>(
      gameFixtures.map((fixture) => [
        fixture.key,
        seedId(1, fixture.index),
      ]),
    );

    const userRows = authFixtures.map((fixture) => {
      const authUser = authUsers.get(fixture.key)!;

      return {
        id: authUser.id,
        email: fixture.email,
        firstName: fixture.firstName,
        lastName: fixture.lastName,
        gamerName: fixture.gamerName,
        avatarUrl: null,
      };
    });
    const gameRows = gameFixtures.map((fixture) => ({
      id: gameIdByKey.get(fixture.key)!,
      name: fixture.name,
      imageUrl: null,
    }));
    const teamRows = teamFixtures.map((fixture) => ({
      id: seedId(2, fixture.index),
      name: fixture.name,
      gameId: gameIdByKey.get(fixture.gameKey)!,
    }));
    const periodEnd = daysFromNow(180, 0).toISOString().slice(0, 10);
    const memberRows = membershipFixtures.map((fixture) => ({
      id: memberIdByKey.get(fixture.key)!,
      userId: authUsers.get(fixture.key)!.id,
      planType:
        fixture.memberIndex % 3 === 0
          ? ("semester" as const)
          : ("year" as const),
      currentPeriodEnd: periodEnd,
    }));
    const adminRows = adminAuthFixtures.map((fixture) => ({
      id: adminIdByKey.get(fixture.key)!,
      memberId: memberIdByKey.get(fixture.key)!,
      role: fixture.role,
    }));
    const rosterRows = teamFixtures.flatMap((fixture) =>
      fixture.roster.map((memberKey) => ({
        teamId: seedId(2, fixture.index),
        memberId: memberIdByKey.get(memberKey)!,
      })),
    );
    const eventRows = eventFixtures.map((fixture) => {
      const startDate = daysFromNow(fixture.daysFromNow, fixture.hour);

      return {
        id: seedId(5, fixture.index),
        title: fixture.title,
        location: fixture.location,
        startDate,
        endDate: new Date(
          startDate.getTime() + fixture.durationHours * 60 * 60 * 1_000,
        ),
        createdBy: adminIdByKey.get(fixture.createdByKey)!,
        description: fixture.description,
      };
    });

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
              gamerName: row.gamerName,
              avatarUrl: row.avatarUrl,
            },
          });
      }

      for (const row of gameRows) {
        await tx
          .insert(games)
          .values(row)
          .onConflictDoUpdate({
            target: games.id,
            set: { name: row.name, imageUrl: row.imageUrl },
          });
      }

      for (const row of teamRows) {
        await tx
          .insert(teams)
          .values(row)
          .onConflictDoUpdate({
            target: teams.id,
            set: { name: row.name, gameId: row.gameId },
          });
      }

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
            },
          });
      }

      for (const row of adminRows) {
        await tx
          .insert(admins)
          .values(row)
          .onConflictDoUpdate({
            target: admins.id,
            set: { memberId: row.memberId, role: row.role },
          });
      }

      // Seed-owned team rosters are synchronized exactly on every run. This
      // does not touch memberships belonging to non-seed teams.
      await tx
        .delete(teamMembers)
        .where(inArray(teamMembers.teamId, teamRows.map((team) => team.id)));
      await tx.insert(teamMembers).values(rosterRows);

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
          id: seedId(6, 1),
          userId: authUsers.get("member")!.id,
          eventId: seedId(5, 1),
          scannedAt: daysFromNow(-1, 20),
        },
        {
          id: seedId(6, 2),
          userId: authUsers.get("president")!.id,
          eventId: seedId(5, 2),
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
          id: memberIdByKey.get("member")!,
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

    console.log("Seed completed with:");
    console.log(`- ${authFixtures.length} Auth users`);
    console.log(`- ${memberRows.length} members`);
    console.log(`- ${adminRows.length} admins covering roles 0-10`);
    console.log(`- ${gameRows.length} games`);
    console.log(`- ${teamRows.length} teams with 5 members each`);
    console.log(`- ${eventRows.length} events`);
    console.log("All test accounts use SEED_TEST_PASSWORD.");
    console.log(`Basic user id: ${authUsers.get("user")!.id}`);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
