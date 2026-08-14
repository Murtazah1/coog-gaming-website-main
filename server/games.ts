"use server";

import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { games } from "@/db/schema/games";
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
    const data = createGameSchema.parse(input);

    const [createdGame] = await db
      .insert(games)
      .values({
        name: data.name,
        imageUrl: data.imageUrl ?? null,
      })
      .returning();

    return createdGame;
  });
}

export async function updateGame(id: string, input: UpdateGameInput) {
  return safeAction(async () => {
    const gameId = z.uuid().parse(id);
    const data = updateGameSchema.parse(input);

     // Get the game BEFORE updating it.
    const oldGame = await db.query.games.findFirst({
      where: {
        id: gameId,
      },
    });

    if (!oldGame) {
      throw new Error("Game not found");
    }

    const [updatedGame] = await db
      .update(games)
      .set(data)
      .where(eq(games.id, gameId))
      .returning();

    if (!updatedGame) {
      throw new Error("Game not found");
    }

     // If the image changed, delete the old image.
    if (
      oldGame.imageUrl &&
      oldGame.imageUrl !== updatedGame.imageUrl
    ) {
      const { error } = await deleteGameImage(
        oldGame.imageUrl,
      );

      if (error) {
        console.error(
          "Failed to delete old game image:",
          error,
        );
      }
    }

    return updatedGame;
  });
}

export async function deleteGame(id: string) {
  return safeAction(async () => {
    const gameId = z.uuid().parse(id);

    const game = await db.query.games.findFirst({
      where: {
        id: gameId,
      },
    });

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
      const { error } = await deleteGameImage(game.imageUrl);
    }

    return deleteGame;
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
        },
      },

      orderBy: {
        name: "asc",
      },
    });
  });
}
