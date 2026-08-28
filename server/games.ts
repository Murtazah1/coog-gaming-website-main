"use server";

import { asc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { games } from "@/db/schema/games";
import { uploadManagedImage } from "@/lib/supabase/image-storage";
import { requireAdmin } from "./auth";
import safeAction from "./safe-action";
import { deleteOrQueueManagedImage } from "./storage-cleanup";

const gameFormSchema = z.object({
  name: z.string().trim().min(1, "Game name is required"),
  removeImage: z.boolean(),
});

function parseGameForm(formData: FormData) {
  const input = gameFormSchema.parse({
    name: formData.get("name"),
    removeImage: formData.get("removeImage") === "true",
  });
  const fileValue = formData.get("image");
  const image =
    fileValue instanceof File && fileValue.size > 0 ? fileValue : null;

  return { ...input, image };
}

export async function getGames() {
  return safeAction(async () => {
    return db.select().from(games).orderBy(asc(games.name));
  });
}

export async function createGame(formData: FormData) {
  return safeAction(async () => {
    await requireAdmin();

    const data = parseGameForm(formData);
    const gameId = crypto.randomUUID();
    const uploadedImage = data.image
      ? await uploadManagedImage("game-images", gameId, data.image, "Game image")
      : null;

    try {
      const [createdGame] = await db
        .insert(games)
        .values({
          id: gameId,
          name: data.name,
          imageUrl: uploadedImage?.publicUrl ?? null,
          imageObjectName: uploadedImage?.objectName ?? null,
        })
        .returning();

      if (!createdGame) {
        throw new Error("Failed to create game");
      }

      return createdGame;
    } catch (error) {
      if (uploadedImage) {
        await deleteOrQueueManagedImage(
          "game-images",
          uploadedImage.objectName,
          "failed_game_create",
        );
      }

      throw error;
    }
  });
}

export async function updateGame(id: string, formData: FormData) {
  return safeAction(async () => {
    await requireAdmin();

    const gameId = z.uuid().parse(id);
    const data = parseGameForm(formData);
    const oldGame = await db.query.games.findFirst({ where: { id: gameId } });

    if (!oldGame) {
      throw new Error("Game not found");
    }

    const uploadedImage = data.image
      ? await uploadManagedImage("game-images", gameId, data.image, "Game image")
      : null;

    try {
      const [updatedGame] = await db
        .update(games)
        .set({
          name: data.name,
          ...(uploadedImage
            ? {
                imageUrl: uploadedImage.publicUrl,
                imageObjectName: uploadedImage.objectName,
              }
            : data.removeImage
              ? { imageUrl: null, imageObjectName: null }
              : {}),
        })
        .where(eq(games.id, gameId))
        .returning();

      if (!updatedGame) {
        throw new Error("Game not found");
      }

      return updatedGame;
    } catch (error) {
      if (uploadedImage) {
        await deleteOrQueueManagedImage(
          "game-images",
          uploadedImage.objectName,
          "failed_game_update",
        );
      }

      throw error;
    }
  });
}

export async function deleteGame(id: string) {
  return safeAction(async () => {
    await requireAdmin();

    const gameId = z.uuid().parse(id);
    const [deletedGame] = await db
      .delete(games)
      .where(eq(games.id, gameId))
      .returning({ id: games.id });

    if (!deletedGame) {
      throw new Error("Game not found");
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
