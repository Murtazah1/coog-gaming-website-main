"use server";

import { eq } from "drizzle-orm";
import * as z from "zod";

import { db } from "@/db";
import { users, type User } from "@/db/schema/users";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  userEmailSchema,
  userFirstNameSchema,
  userGamerNameSchema,
  userLastNameSchema,
  userPasswordSchema,
} from "@/lib/validation/users";
import { requireAdmin } from "./auth";
import safeAction from "./safe-action";
import { deleteAvatar } from "./storage";

type UpdateUserData = Partial<
  Pick<User, "email" | "firstName" | "lastName" | "gamerName" | "avatarUrl">
>;

const userIdSchema = z.uuid("Invalid user ID");

const createUserSchema = z.object({
  email: userEmailSchema("Enter in a valid email address"),
  password: userPasswordSchema,
  firstName: userFirstNameSchema("Give a first name").nullable().optional(),
  lastName: userLastNameSchema("Give a last name").nullable().optional(),
  gamerName: userGamerNameSchema("Gamer Name cannot be empty")
    .nullable()
    .optional(),
  avatarUrl: z.url("Avatar URL must be valid").nullable(),
});

const updateUserSchema = z
  .object({
    email: userEmailSchema("Enter in a valid email address").optional(),
    firstName: userFirstNameSchema("Give a first name").nullable().optional(),
    lastName: userLastNameSchema("Give a last name").nullable().optional(),
    gamerName: userGamerNameSchema("Gamer Name cannot be empty")
      .nullable()
      .optional(),
    avatarUrl: z.url("Avatar URL must be valid").nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type CreateUserInput = z.infer<typeof createUserSchema>;

async function cleanupAvatar(avatarUrl: string, context: string) {
  const cleanup = await deleteAvatar(avatarUrl);

  if (cleanup.error) {
    console.error(context, cleanup.error);
  }
}

export async function getUsers(search?: string) {
  const cleanSearch = search?.trim();

  return safeAction(() =>
    db.query.users.findMany({
      where: cleanSearch
        ? {
            OR: [
              { email: { ilike: `%${cleanSearch}%` } },
              { firstName: { ilike: `%${cleanSearch}%` } },
              { lastName: { ilike: `%${cleanSearch}%` } },
              { gamerName: { ilike: `%${cleanSearch}%` } },
            ],
          }
        : undefined,
      orderBy: (table, { desc }) => [desc(table.createdAt)],
    }),
  );
}

export async function getUserById(id: string) {
  return safeAction(async () => {
    const userId = userIdSchema.parse(id);
    const user = await db.query.users.findFirst({ where: { id: userId } });
    return user ?? null;
  });
}

export async function getUserByEmail(email: string) {
  return safeAction(async () => {
    const cleanEmail = email.trim().toLowerCase();
    const user = await db.query.users.findFirst({
      where: { email: cleanEmail },
    });
    return user ?? null;
  });
}

export async function createUser(data: CreateUserInput) {
  return safeAction(async () => {
    await requireAdmin();

    const validatedData = createUserSchema.parse(data);
    const email = validatedData.email.toLowerCase();
    const supabaseAuth = createAdminClient();
    const { data: authData, error: authError } =
      await supabaseAuth.auth.admin.createUser({
        email,
        password: validatedData.password,
        email_confirm: true,
      });

    if (authError || !authData.user) {
      if (validatedData.avatarUrl) {
        await cleanupAvatar(
          validatedData.avatarUrl,
          "Failed to clean up the new avatar after auth creation failed:",
        );
      }

      throw new Error(authError?.message || "Failed to create auth user");
    }

    try {
      const [createdUser] = await db
        .update(users)
        .set({
          email,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          gamerName: validatedData.gamerName?.trim() || null,
          avatarUrl: validatedData.avatarUrl,
        })
        .where(eq(users.id, authData.user.id))
        .returning();

      if (!createdUser) {
        throw new Error(
          "Auth account was created, but was not made into a public user",
        );
      }

      return createdUser;
    } catch (error) {
      if (validatedData.avatarUrl) {
        await cleanupAvatar(
          validatedData.avatarUrl,
          "Failed to clean up the new avatar after user creation failed:",
        );
      }

      const { error: cleanupError } =
        await supabaseAuth.auth.admin.deleteUser(authData.user.id);

      if (cleanupError) {
        console.error(
          "Failed to clean up the partially created user:",
          cleanupError.message,
        );
      }

      throw error;
    }
  });
}

export async function updateUser(id: string, data: UpdateUserData) {
  return safeAction(async () => {
    await requireAdmin();

    const userId = userIdSchema.parse(id);
    const validData = updateUserSchema.parse(data);
    const existingUser = await db.query.users.findFirst({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new Error("User not found");
    }

    const email = validData.email?.toLowerCase();
    const emailChanged = email !== undefined && email !== existingUser.email;
    const avatarChanged =
      validData.avatarUrl !== undefined &&
      validData.avatarUrl !== existingUser.avatarUrl;
    const supabaseAuth = createAdminClient();

    if (emailChanged) {
      const { error } = await supabaseAuth.auth.admin.updateUserById(userId, {
        email,
      });

      if (error) {
        if (avatarChanged && validData.avatarUrl) {
          await cleanupAvatar(
            validData.avatarUrl,
            "Failed to clean up the new avatar after auth update failed:",
          );
        }

        throw new Error(error.message);
      }
    }

    const databaseUpdateData: UpdateUserData = {};

    if (email !== undefined) databaseUpdateData.email = email;
    if (validData.firstName !== undefined) {
      databaseUpdateData.firstName = validData.firstName;
    }
    if (validData.lastName !== undefined) {
      databaseUpdateData.lastName = validData.lastName;
    }
    if (validData.gamerName !== undefined) {
      databaseUpdateData.gamerName = validData.gamerName?.trim() || null;
    }
    if (validData.avatarUrl !== undefined) {
      databaseUpdateData.avatarUrl = validData.avatarUrl;
    }

    try {
      const [updatedUser] = await db
        .update(users)
        .set(databaseUpdateData)
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser) {
        throw new Error("User not found");
      }

      if (avatarChanged && existingUser.avatarUrl) {
        await cleanupAvatar(
          existingUser.avatarUrl,
          "Failed to delete old avatar:",
        );
      }

      return updatedUser;
    } catch (error) {
      if (avatarChanged && validData.avatarUrl) {
        await cleanupAvatar(
          validData.avatarUrl,
          "Failed to clean up the new avatar after user update failed:",
        );
      }

      if (emailChanged) {
        const { error: rollbackError } =
          await supabaseAuth.auth.admin.updateUserById(userId, {
            email: existingUser.email,
          });

        if (rollbackError) {
          console.error(
            "Failed to restore the previous email:",
            rollbackError.message,
          );
        }
      }

      throw error;
    }
  });
}

export async function deleteUser(id: string) {
  return safeAction(async () => {
    await requireAdmin();

    const userId = userIdSchema.parse(id);
    const existingUser = await db.query.users.findFirst({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new Error("User not found");
    }

    const supabaseAuth = createAdminClient();
    const { error: authError } =
      await supabaseAuth.auth.admin.deleteUser(userId);

    if (authError) {
      throw new Error(authError.message);
    }

    await db.delete(users).where(eq(users.id, userId));

    if (existingUser.avatarUrl) {
      await cleanupAvatar(
        existingUser.avatarUrl,
        "Failed to delete user avatar:",
      );
    }

    return { id: userId };
  });
}
