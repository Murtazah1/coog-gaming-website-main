"use server";

import { db } from "@/db/index";
import { users } from "@/db/schema";
import { members, planTypeEnum, type Member } from "@/db/schema/members";
import {
  eq,
  ilike,
  desc,
  isNull,
  or,
  getTableColumns,
} from "drizzle-orm";
import safeAction from "./safe-action";
import * as z from "zod";

// this is the data required for making a user into the DB
// every member has a userId tied to it so we need to include the id when adding users
type CreateMemberInput = {
  userId: string;
  planType: Member["planType"];
  currentPeriodEnd: Member["currentPeriodEnd"];
  discordName?: Member["discordName"];
};

// and these are all the fields we would update
type UpdateMemberInput = Partial<
  Pick<Member, "planType" | "currentPeriodEnd" | "discordName">
>;

// input validation

const memberIdSchema = z.uuid("Invalid member ID");

const createMemberSchema = z.object({
  userId: z.uuid("A valid user must be selected"),
  planType: z.enum(planTypeEnum),

  currentPeriodEnd: z.iso
    .date("Enter a valid membership expiration date")
    .nullable()
    .optional(),

  discordName: z
    .string()
    .trim()
    .min(1, "Gamer Name cannot be empty")
    .nullable()
    .optional(),
});

const updateMemberSchema = z
  .object({
    planType: z.enum(planTypeEnum).optional(),

    currentPeriodEnd: z.iso
      .date("Enter a valid membership expiration date")
      .nullable()
      .optional(),
    discordName: z
      .string()
      .trim()
      .min(1, "Gamer Name cannot be empty")
      .nullable()
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "at least one field needs to be provided",
  });

export async function getMembers(search?: string) {
  const cleanSearch = search?.trim();
  return safeAction(() =>
    db
      .select({
        member: members,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(members)
      .innerJoin(users, eq(members.userId, users.id))
      .where(
        cleanSearch
          ? or(
              ilike(users.email, `%${cleanSearch}%`),
              ilike(users.firstName, `%${cleanSearch}%`),
              ilike(users.lastName, `%${cleanSearch}%`),
              ilike(members.discordName, `%${cleanSearch}%`),
            )
          : undefined,
      )
      .orderBy(desc(members.createdAt)),
  );
}

export async function getMemberByID(id: string) {
  return safeAction(async () => {
    // we need to have the memberIdSchema to make sure that the id we get is a uuid
    const memberId = memberIdSchema.parse(id);
    // due to users being a different table and me wanting to import user information in the table as well
    // i need to make sure to select all the user columns and join the tables too
    const [member] = await db
      .select({
        ...getTableColumns(members),
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        avatarUrl: users.avatarUrl,
      })
      .from(members)
      .innerJoin(users, eq(members.userId, users.id))
      .where(eq(members.id, memberId))
      .limit(1);

    return member ?? null;
  });
}

// we need to make a new function to see users without a memberId, this will be useful for when we need to add members

export async function getNonMembers() {
  return safeAction(async () => {
    const res = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName
      })
      .from(users)
      .leftJoin(members, eq(users.id, members.userId))
      .where(isNull(members.id));

    return res
  });
}

export async function createMember(input: CreateMemberInput) {
  return safeAction(async () => {
    const cleanInput = createMemberSchema.parse(input);

    // make sure the user exists
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, cleanInput.userId))
      .limit(1);

    if (!existingUser) {
      throw new Error("This selected user does not exist");
    }

    // make sure the user is not already a member
    const [existingMember] = await db
      .select({
        id: members.id,
      })
      .from(members)
      .where(eq(members.userId, cleanInput.userId))
      .limit(1);

    if (existingMember) {
      throw new Error("This user is already a member");
    }

    const [createdMember] = await db
      .insert(members)
      .values({
        userId: cleanInput.userId,
        planType: cleanInput.planType,
        currentPeriodEnd: cleanInput.currentPeriodEnd ?? null,
        discordName: cleanInput.discordName?.trim() || null
      })
      .returning();

    if (!createdMember) {
      throw new Error("Failed to create member");
    }

    return createdMember;
  });
}

export async function updateMember(id: string, input: UpdateMemberInput) {
  return safeAction(async () => {
    const memberId = memberIdSchema.parse(id);
    const cleanInput = updateMemberSchema.parse(input);

    const updateData: UpdateMemberInput = {
      ...cleanInput,
    };

    // if the user clears the discord name
    if (cleanInput.discordName !== undefined) {
      updateData.discordName = cleanInput.discordName?.trim() || null;
    }

    const [updatedMember] = await db
      .update(members)
      .set(updateData)
      .where(eq(members.id, memberId))
      .returning();

    if (!updatedMember) {
      throw new Error("The member you want to update does not exist");
    }

    return updatedMember;
  });
}

// this does not delete the associating user

export async function deleteMember(id: string) {
  return safeAction(async () => {
    const memberId = memberIdSchema.parse(id);

    const [deletedMember] = await db
      .delete(members)
      .where(eq(members.id, memberId))
      .returning();

    if (!deletedMember) {
      throw new Error("The member you want to delete does not exist");
    }

    return deletedMember;
  });
}

