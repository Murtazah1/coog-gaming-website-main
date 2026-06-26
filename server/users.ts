"use server";

import { db } from "@/db/index";
import { users, type User } from "@/db/schema/users";
import { eq } from "drizzle-orm";

type UpdateUserData = Partial<Pick<User, "firstName" | "lastName" | "avatarUrl">>

export async function getUsers(): Promise<{ data: User[] | null; error: string | null }> {
  try {
    const data = await db.select().from(users);
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Failed to fetch users" };
  }
}

export async function getUserById(id: string): Promise<{ data: User | null; error: string | null }> {
  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return { data: result[0] ?? null, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Failed to fetch user" };
  }
}

export async function getUserByEmail(email: string): Promise<{ data: User | null; error: string | null }> {
  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return { data: result[0] ?? null, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Failed to fetch user" };
  }
}

export async function updateUser(
  id: string,
  data: Partial<Omit<UpdateUserData, "id" | "email" | "createdAt">>,
): Promise<{ data: User | null; error: string | null }> {
  try {
    const result = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return { data: result[0] ?? null, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Failed to update user" };
  }
}

export async function deleteUser(id: string): Promise<{ error: string | null }> {
  try {
    await db.delete(users).where(eq(users.id, id));
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to delete user" };
  }
}
