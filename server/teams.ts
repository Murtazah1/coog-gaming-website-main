"use server";

import { z } from "zod";
import { db } from "@/db";
import { teams } from "@/db/schema";
import safeAction from "./safe-action";
import { eq } from "drizzle-orm";

const teamIdSchema = z.uuid("Invalid team ID");
const gameIdSchema = z.uuid("Invalid game ID");

const createTeamSchema = z.object({
  gameId: z.uuid("Invalid game ID"),
  name: z.string().trim().min(1, "Team name is required"),
});

const updateTeamSchema = z
  .object({
    name: z.string().trim().min(1, "Team name is required").optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field needs to be provided",
  });

type CreateTeamInput = z.infer<typeof createTeamSchema>;
type UpdateTeamInput = z.infer<typeof updateTeamSchema>;

// get every team + their members for a given game using relations
export async function getTeamsWithMembersByGameID(gameId: string) {
  return safeAction(async () => {
    const cleanId = gameIdSchema.parse(gameId);
    return db.query.teams.findMany({
      where: {
        gameId: cleanId,
      },
      // all the columns from game
      columns: {
        id: true,
        name: true,
        gameId: true,
      },
      // this is the linking part
      with: {
        members: {
          columns: {
            id: true,
            userId: true,
            discordName: true,
          },
          with: {
            user: {
              columns: {
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
  });
}

export async function createTeam(input: CreateTeamInput) {
  return safeAction(async () => {
    const cleanInput = createTeamSchema.parse(input);

    // Relational read -> new object syntax.
    const game = await db.query.games.findFirst({
      where: {
        id: cleanInput.gameId,
      },

      columns: {
        id: true,
      },
    });

    if (!game) {
      throw new Error("The selected game does not exist");
    }

    // Inserts still use the regular SQL-style API.
    const [createdTeam] = await db
      .insert(teams)
      .values({
        gameId: cleanInput.gameId,
        name: cleanInput.name,
      })
      .returning();

    if (!createdTeam) {
      throw new Error("Failed to create team");
    }

    return createdTeam;
  });
}

export async function updateTeam(id: string, input: UpdateTeamInput) {
  return safeAction(async () => {
    const teamId = teamIdSchema.parse(id);
    const cleanInput = updateTeamSchema.parse(input);

    const [updatedTeam] = await db
      .update(teams)
      .set(cleanInput)
      .where(eq(teams.id, teamId))
      .returning();

    if (!updatedTeam) {
      throw new Error("The team you want to update does not exist");
    }

    return updatedTeam;
  });
}

export async function deleteTeam(id: string) {
  return safeAction(async () => {
    const teamId = teamIdSchema.parse(id);

    const [deletedTeam] = await db
      .delete(teams)
      .where(eq(teams.id, teamId))
      .returning();

    if (!deletedTeam) {
      throw new Error("The team you want to delete does not exist");
    }

    return deletedTeam;
  });
}
