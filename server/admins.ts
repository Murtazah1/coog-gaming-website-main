// this is based off of the previous user and member server actions

"use server";

import { db } from "@/db";
import { users } from "@/db/schema/users";
import { members } from "@/db/schema/members";
import { admins, type Admin } from "@/db/schema/admins";
import { asc, eq, ilike, isNull, or } from "drizzle-orm";
import * as z from "zod";
import safeAction from "./safe-action";
import { requireAdmin } from "./auth";

type CreateAdminInput = {
  memberId: string;
  role: Admin["role"];
};

type UpdateAdminInput = Partial<Pick<Admin, "role">>;

const adminIdSchema = z.uuid("Invalid admin ID");

const adminRoleSchema = z
  .number()
  .int()
  .min(0, "Select a valid role")
  .max(10, "Select a valid role");

const createAdminSchema = z.object({
  memberId: z.uuid("A valid member must be selected"),
  role: adminRoleSchema,
});

const updateAdminSchema = z
  .object({
    role: adminRoleSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field needs to be provided",
  });

export async function getPublicAdmins() {
  return safeAction(() =>
    db
      .select({
        admin: {
          id: admins.id,
          role: admins.role,
        },
        member: {
          gamerName: users.gamerName,
          firstName: users.firstName,
          lastName: users.lastName,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(admins)
      .innerJoin(members, eq(admins.memberId, members.id))
      .innerJoin(users, eq(members.userId, users.id))
      .orderBy(asc(admins.role)),
  );
}

export async function getAdmins(search?: string) {
  const cleanSearch = search?.trim();
  return safeAction(async () => {
    await requireAdmin();

    return db
      .select({
        admin: admins,
        member: {
          id: members.id,
          gamerName: users.gamerName,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(admins)
      .innerJoin(members, eq(admins.memberId, members.id))
      .innerJoin(users, eq(members.userId, users.id))
      .where(
        cleanSearch
          ? or(
              ilike(users.email, `%${cleanSearch}%`),
              ilike(users.firstName, `%${cleanSearch}%`),
              ilike(users.lastName, `%${cleanSearch}%`),
              ilike(users.gamerName, `%${cleanSearch}%`),
            )
          : undefined,
      )
      .orderBy(asc(admins.role));
  });
}

export async function getAdminByID(id: string) {
  return safeAction(async () => {
    await requireAdmin();

    const adminId = adminIdSchema.parse(id);

    const [admin] = await db
      .select({
        admin: admins,

        member: {
          id: members.id,
          gamerName: users.gamerName,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(admins)
      .innerJoin(members, eq(admins.memberId, members.id))
      .innerJoin(users, eq(members.userId, users.id))
      .where(eq(admins.id, adminId))
      .limit(1);

    return admin ?? null;
  });
}

// Get members who are NOT already admins.
export async function getNonAdmins() {
  return safeAction(async () => {
    await requireAdmin();

    return db
      .select({
        id: members.id,
        gamerName: users.gamerName,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        avatarUrl: users.avatarUrl,
      })
      .from(members)
      .innerJoin(users, eq(members.userId, users.id))
      .leftJoin(admins, eq(members.id, admins.memberId))
      .where(isNull(admins.id));
  });
}

export async function createAdmin(input: CreateAdminInput) {
  return safeAction(async () => {
    await requireAdmin();

    const cleanInput = createAdminSchema.parse(input);

    // Make sure the member exists.
    const [existingMember] = await db
      .select({
        id: members.id,
      })
      .from(members)
      .where(eq(members.id, cleanInput.memberId))
      .limit(1);

    if (!existingMember) {
      throw new Error("The selected member does not exist");
    }

    // Make sure this member isn't already an admin.
    const [existingAdmin] = await db
      .select({
        id: admins.id,
      })
      .from(admins)
      .where(eq(admins.memberId, cleanInput.memberId))
      .limit(1);

    if (existingAdmin) {
      throw new Error("This member is already an admin");
    }

    const [createdAdmin] = await db
      .insert(admins)
      .values({
        memberId: cleanInput.memberId,
        role: cleanInput.role,
      })
      .returning();

    if (!createdAdmin) {
      throw new Error("Failed to create admin");
    }

    return createdAdmin;
  });
}

export async function updateAdmin(id: string, input: UpdateAdminInput) {
  return safeAction(async () => {
    await requireAdmin();

    const adminId = adminIdSchema.parse(id);

    const cleanInput = updateAdminSchema.parse(input);

    const [updatedAdmin] = await db
      .update(admins)
      .set(cleanInput)
      .where(eq(admins.id, adminId))
      .returning();

    if (!updatedAdmin) {
      throw new Error("The admin you want to update does not exist");
    }

    return updatedAdmin;
  });
}

export async function deleteAdmin(id: string) {
  return safeAction(async () => {
    await requireAdmin();

    const adminId = adminIdSchema.parse(id);

    const [deletedAdmin] = await db
      .delete(admins)
      .where(eq(admins.id, adminId))
      .returning();

    if (!deletedAdmin) {
      throw new Error("The admin you want to delete does not exist");
    }

    return deletedAdmin;
  });
}
