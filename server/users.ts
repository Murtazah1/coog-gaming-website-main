"use server";

// this file houses all the routes/ database actions for users table
import { db } from "@/db/index";
import { users, type User } from "@/db/schema/users";
import { createAdminClient } from "@/lib/supabase/admin";
import { eq, ilike } from "drizzle-orm";

// just a type for making user updating easier
type UpdateUserData = Partial<
  Pick<User, "email" | "firstName" | "lastName" | "avatarUrl">
>;

// a function that acts as a try catch handler for all the functions in this file
async function safeAction<T>(
  // takes in the database query code
  action: () => Promise<T>,
): Promise<{ data: T | null; error: string | null }> {
  try {
    // runs it and if no error it will return data: data, error: null and if the opposite it will throw an error
    const data = await action();
    return { data, error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error ? err.message : "Error fetching user information",
    };
  }
}

// get users by email, this one is for the search implementation that we will do later
export async function getUsers(search?: string) {
  return safeAction(() =>
    db.query.users.findMany({
      where: search ? ilike(users.email, `%${search}%`) : undefined,
    }),
  );
}

// getting the user by ID, useful function to have
export async function getUserById(id: string) {
  return safeAction(() =>
    db.query.users
      .findFirst({ where: eq(users.id, id) })
      .then((res) => res ?? null),
  );
}

// finding a user by email
export async function getUserByEmail(email: string) {
  return safeAction(() =>
    db.query.users
      .findFirst({ where: eq(users.email, email) })
      .then((res) => res ?? null),
  );
}
// this is a function for creating users, takes in an object that defines user fields
export async function createUser(data: {
  email: string;
  password: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl: string | null;
}) {
  return safeAction(async () => {
    // connect to the admin client as we are making a user
    const supabaseAuth = createAdminClient();
    const { data: authData, error: authError } =
      // we enter in email + password first as for some reason the way supabase makes it work
      // is that u enter in those fields first, it gets sent to a special auth table
      // and from the auth table it gets added to the users table, as no passwords are stored in the user table
      await supabaseAuth.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
      });

    if (authError || !authData.user) {
      throw new Error(authError?.message || "Failed to create auth user");
    }
    // after we insert the users we now need to update it with the name and avatar
    const [updatedUser] = await db
      .update(users)
      .set({
        firstName: data.firstName,
        lastName: data.lastName,
        avatarUrl: data.avatarUrl,
      })
      .where(eq(users.id, authData.user.id))
      .returning(); // returning is nice as it just returns the rows that were changed as an array, which in this case is an array of 1 element

    return updatedUser ?? null;
  });
}
// function for updating user
export async function updateUser(
  id: string,
  // Partial tells us that all the fields in user is optional, so we do not need to upload everything in order to run this update function
  data: Partial<Omit<UpdateUserData, "id" | "createdAt">>, // id and creation omited because we do not need to update those
) {
  return safeAction(async () => {
    // If the email is being changed, update it in Supabase Auth as well.
    if (data.email) {
      const supabaseAuth = createAdminClient();
      const { error } = await supabaseAuth.auth.admin.updateUserById(id, {
        email: data.email,
      });
      if (error) {
        console.warn("Failed to get user from db: ", error.message);
      }
    }
    // then we update the user with the data that we entered in 
    const [updatedUser] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return updatedUser ?? null;
  });
}

// function to delete the user
export async function deleteUser(id: string){
  return safeAction(async () => {
    const supabaseAuth = createAdminClient()
    // Delete the user's authentication account.
    const { error: authError } = await supabaseAuth.auth.admin.deleteUser(id)
    // delete the user from the db
    await db.delete(users).where(eq(users.id, id))
    if (authError){
      throw new Error(authError.message)
    }
    return null
  })
}
