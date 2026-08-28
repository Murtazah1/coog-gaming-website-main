"use server";

import { asc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { games } from "@/db/schema/games";
import { requireAdmin } from "./auth";
import safeAction from "./safe-action";
import { deleteGameImage } from "./storage";

const createGameSchema = z.object({
  name: z.string().trim().min(1, "Game name is required"),
  imageUrl: z.url().nullable().optional(),
});

const updateGameSchema = createGameSchema.partial();

export type CreateGameInput = z.infer<typeof createGameSchema>;
export type UpdateGameInput = z.infer<typeof updateGameSchema>;

export async function getGames() {
  return safeAction(async () => {
    return db.select().from(games).orderBy(asc(games.name));
  });
}

export async function createGame(input: CreateGameInput) {
  return safeAction(async () => {
    await requireAdmin();

    const data = createGameSchema.parse(input);

    try {
      const [createdGame] = await db
        .insert(games)
        .values({
          name: data.name,
          imageUrl: data.imageUrl ?? null,
        })
        .returning();

      if (!createdGame) {
        throw new Error("Failed to create game");
      }

      return createdGame;
    } catch (error) {
      if (data.imageUrl) {
        const cleanup = await deleteGameImage(data.imageUrl);

        if (cleanup.error) {
          console.error("Failed to clean up the new game image:", cleanup.error);
        }
      }

      throw error;
    }
  });
}

export async function updateGame(id: string, input: UpdateGameInput) {
  return safeAction(async () => {
    await requireAdmin();

    const gameId = z.uuid().parse(id);
    const data = updateGameSchema.parse(input);
    const oldGame = await db.query.games.findFirst({ where: { id: gameId } });

    if (!oldGame) {
      throw new Error("Game not found");
    }

    try {
      const [updatedGame] = await db
        .update(games)
        .set(data)
        .where(eq(games.id, gameId))
        .returning();

      if (!updatedGame) {
        throw new Error("Game not found");
      }

      if (oldGame.imageUrl && oldGame.imageUrl !== updatedGame.imageUrl) {
        const cleanup = await deleteGameImage(oldGame.imageUrl);

        if (cleanup.error) {
          console.error("Failed to delete old game image:", cleanup.error);
        }
      }

      return updatedGame;
    } catch (error) {
      if (data.imageUrl && data.imageUrl !== oldGame.imageUrl) {
        const cleanup = await deleteGameImage(data.imageUrl);

        if (cleanup.error) {
          console.error("Failed to clean up the new game image:", cleanup.error);
        }
      }

      throw error;
    }
  });
}

export async function deleteGame(id: string) {
  return safeAction(async () => {
    await requireAdmin();

    const gameId = z.uuid().parse(id);
    const game = await db.query.games.findFirst({ where: { id: gameId } });

    if (!game) {
      throw new Error("Game not found");
    }

    const [deletedGame] = await db
      .delete(games)
      .where(eq(games.id, gameId))
      .returning();

    if (!deletedGame) {
      throw new Error("Failed to delete game");
    }

    if (game.imageUrl) {
      const cleanup = await deleteGameImage(game.imageUrl);

      if (cleanup.error) {
        console.error("Failed to delete game image:", cleanup.error);
      }
    }

    return deletedGame;
  });
}

export async function getGamesWithTeamsAndMembers() {
  return safeAction(async () => {
    return db.query.games.findMany({
      columns: {
        id: true,
        name: true,
        imageUrl: true,
      },

      with: {
        teams: {
          columns: {
            id: true,
            name: true,
            gameId: true,
          },

          with: {
            members: {
              columns: {
                id: true,
                userId: true,
              },

              with: {
                user: {
                  columns: {
                    firstName: true,
                    lastName: true,
                    gamerName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },

          orderBy: {
            name: "asc",
          },
        },
      },

      orderBy: {
        name: "asc",
      },
    });
  });
}
