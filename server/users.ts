"use server";

import { eq } from "drizzle-orm";
import * as z from "zod";

import { db } from "@/db";
import { users } from "@/db/schema/users";
import { createAdminClient } from "@/lib/supabase/admin";
import { uploadAvatarFile } from "@/lib/supabase/avatar-storage";
import {
  userEmailSchema,
  userFirstNameSchema,
  userGamerNameSchema,
  userLastNameSchema,
  userPasswordSchema,
} from "@/lib/validation/users";
import { requireAdmin } from "./auth";
import safeAction from "./safe-action";
import { deleteOrQueueManagedImage } from "./storage-cleanup";

const userIdSchema = z.uuid("Invalid user ID");

const createUserSchema = z.object({
  email: userEmailSchema("Enter in a valid email address"),
  password: userPasswordSchema,
  firstName: userFirstNameSchema("Give a first name").nullable().optional(),
  lastName: userLastNameSchema("Give a last name").nullable().optional(),
  gamerName: userGamerNameSchema("Gamer Name cannot be empty")
    .nullable()
    .optional(),
});

const updateUserSchema = z.object({
  email: userEmailSchema("Enter in a valid email address"),
  firstName: userFirstNameSchema("Give a first name").nullable().optional(),
  lastName: userLastNameSchema("Give a last name").nullable().optional(),
  gamerName: userGamerNameSchema("Gamer Name cannot be empty")
    .nullable()
    .optional(),
  removeAvatar: z.boolean(),
});

function getOptionalAvatar(formData: FormData) {
  const value = formData.get("avatar");
  return value instanceof File && value.size > 0 ? value : null;
}

function parseCreateUserForm(formData: FormData) {
  return {
    data: createUserSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      gamerName: formData.get("gamerName") || null,
    }),
    avatar: getOptionalAvatar(formData),
  };
}

function parseUpdateUserForm(formData: FormData) {
  return {
    data: updateUserSchema.parse({
      email: formData.get("email"),
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      gamerName: formData.get("gamerName") || null,
      removeAvatar: formData.get("removeAvatar") === "true",
    }),
    avatar: getOptionalAvatar(formData),
  };
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

export async function createUser(formData: FormData) {
  return safeAction(async () => {
    await requireAdmin();

    const { data, avatar } = parseCreateUserForm(formData);
    const email = data.email.toLowerCase();
    const supabaseAuth = createAdminClient();
    const { data: authData, error: authError } =
      await supabaseAuth.auth.admin.createUser({
        email,
        password: data.password,
        email_confirm: true,
      });

    if (authError || !authData.user) {
      throw new Error(authError?.message || "Failed to create auth user");
    }

    let uploadedAvatar:
      | Awaited<ReturnType<typeof uploadAvatarFile>>
      | null = null;

    try {
      if (avatar) {
        uploadedAvatar = await uploadAvatarFile(avatar, authData.user.id);
      }

      const [createdUser] = await db
        .update(users)
        .set({
          email,
          firstName: data.firstName,
          lastName: data.lastName,
          gamerName: data.gamerName?.trim() || null,
          avatarUrl: uploadedAvatar?.publicUrl ?? null,
          avatarObjectName: uploadedAvatar?.objectName ?? null,
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
      if (uploadedAvatar) {
        await deleteOrQueueManagedImage(
          "avatars",
          uploadedAvatar.objectName,
          "failed_admin_user_create",
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

export async function updateUser(id: string, formData: FormData) {
  return safeAction(async () => {
    await requireAdmin();

    const userId = userIdSchema.parse(id);
    const { data, avatar } = parseUpdateUserForm(formData);
    const existingUser = await db.query.users.findFirst({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new Error("User not found");
    }

    const email = data.email.toLowerCase();
    const emailChanged = email !== existingUser.email;
    const supabaseAuth = createAdminClient();
    const uploadedAvatar = avatar
      ? await uploadAvatarFile(avatar, existingUser.id)
      : null;

    try {
      if (emailChanged) {
        const { error } = await supabaseAuth.auth.admin.updateUserById(userId, {
          email,
        });

        if (error) {
          throw new Error(error.message);
        }
      }

      const [updatedUser] = await db
        .update(users)
        .set({
          email,
          firstName: data.firstName,
          lastName: data.lastName,
          gamerName: data.gamerName?.trim() || null,
          ...(uploadedAvatar
            ? {
                avatarUrl: uploadedAvatar.publicUrl,
                avatarObjectName: uploadedAvatar.objectName,
              }
            : data.removeAvatar
              ? { avatarUrl: null, avatarObjectName: null }
              : {}),
        })
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser) {
        throw new Error("User not found");
      }

      return updatedUser;
    } catch (error) {
      if (uploadedAvatar) {
        await deleteOrQueueManagedImage(
          "avatars",
          uploadedAvatar.objectName,
          "failed_admin_user_update",
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
      columns: { id: true },
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
    return { id: userId };
  });
}
