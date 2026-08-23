"use server";

// this file houses all the routes/ database actions for users table
import { db } from "@/db/index";
import { users, type User } from "@/db/schema/users";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  deleteAvatarFile,
  uploadAvatarFile,
} from "@/lib/supabase/avatar-storage";
import { eq } from "drizzle-orm";
import safeAction from "./safe-action";
import * as z from "zod";
import { deleteAvatar } from "./storage";
import { requireUser, verifyCurrentPassword } from "./auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

// just a type for making user updating easier
type UpdateUserData = Partial<
  Pick<User, "email" | "firstName" | "lastName" | "avatarUrl">
>;

// since users can technically call a server actions without using the user form I made we need to add zod validation in this file too

const userIdSchema = z.uuid("Invalid member ID");

const createUserSchema = z.object({
  email: z.email("Enter in a valid email address").trim(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z
    .string()
    .trim()
    .min(1, "Give a first name")
    .nullable()
    .optional(),
  lastName: z.string().trim().min(1, "Give a last name").nullable().optional(),
  avatarUrl: z.url("Avatar URL must be valid").nullable(),
});

const updateUserSchema = z
  .object({
    email: z.email("Enter in a valid email address").trim().optional(),
    firstName: z
      .string()
      .trim()
      .min(1, "Give a first name")
      .nullable()
      .optional(),
    lastName: z
      .string()
      .trim()
      .min(1, "Give a last name")
      .nullable()
      .optional(),
    avatarUrl: z.url("Avatar URL must be valid").nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "at least one field must be provided",
  });

// and lets make a type for user creation + updating

type CreateUserInput = {
  email: string;
  password: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl: string | null;
};

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const ownProfileSchema = z.object({
  firstName: z.string().trim().max(100, "First name is too long"),
  lastName: z.string().trim().max(100, "Last name is too long"),
});

const ownEmailSchema = z
  .email("Enter a valid email address")
  .trim()
  .transform((email) => email.toLowerCase());

// get users by email, this one is for the search implementation that we will do later
export async function getUsers(search?: string) {
  const cleanSearch = search?.trim();

  return safeAction(() =>
    db.query.users.findMany({
      where: cleanSearch
        ? {
            OR: [
              {
                email: {
                  ilike: `%${cleanSearch}%`,
                },
              },
              {
                firstName: {
                  ilike: `%${cleanSearch}%`,
                },
              },
              {
                lastName: {
                  ilike: `%${cleanSearch}%`,
                },
              },
            ],
          }
        : undefined,

      orderBy: (table, { desc }) => [desc(table.createdAt)],
    }),
  );
}

// getting the user by ID, useful function to have
export async function getUserById(id: string) {
  return safeAction(async () => {
    const userId = userIdSchema.parse(id);
    const user = await db.query.users.findFirst({
      where: {
        id: userId,
      },
    });
    return user ?? null;
  });
}

// finding a user by email
export async function getUserByEmail(email: string) {
  // we lower case the email as emails are case insensitive
  return safeAction(async () => {
    const cleanEmail = email.trim().toLowerCase();
    const user = await db.query.users.findFirst({
      where: {
        email: cleanEmail,
      },
    });

    return user ?? null;
  });
}
// this is a function for creating users, takes in an object that defines user fields
export async function createUser(data: CreateUserInput) {
  return safeAction(async () => {
    // make sure to validate the user info beforehand
    const validation = createUserSchema.safeParse(data);

    // and if our validation fails we need to throw an error that our save action can handle
    if (!validation.success) {
      throw new Error(
        validation.error.issues[0]?.message ?? "Invalid User Info",
      );
    }

    const validatedData = validation.data;
    const email = validatedData.email.toLowerCase();

    // connect to the admin client as we are making a user
    const supabaseAuth = createAdminClient();
    const { data: authData, error: authError } =
      // we enter in email + password first as for some reason the way supabase makes it work
      // is that u enter in those fields first, it gets sent to a special auth table
      // and from the auth table it gets added to the users table, as no passwords are stored in the user table
      await supabaseAuth.auth.admin.createUser({
        email: email,
        password: validatedData.password,
        email_confirm: true,
      });

    if (authError || !authData.user) {
      throw new Error(authError?.message || "Failed to create auth user");
    }

    try {
      const [updatedUser] = await db
        .update(users)
        .set({
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          avatarUrl: validatedData.avatarUrl,
        })
        .where(eq(users.id, authData.user.id))
        .returning(); // returning is nice as it just returns the rows that were changed as an array, which in this case is an array of 1 element

      if (!updatedUser) {
        throw new Error(
          "Auth account was created, but was not made into public user",
        );
      }

      return updatedUser ?? null;
    } catch (error) {
      // for this part of the code we cleanup partially created user if the error is thrown
      // and this cleanup involves us deleting the user from the auth table
      const { error: cleanupError } = await supabaseAuth.auth.admin.deleteUser(
        authData.user.id,
      );

      if (cleanupError) {
        console.error(
          "Failed to cleanup the partially created user: ",
          cleanupError.message,
        );
      }

      throw error;
    }
    // after we insert the users we now need to update it with the name and avatar
  });
}

// function for updating user
export async function updateUser(id: string, data: UpdateUserData) {
  return safeAction(async () => {
    // added in zod validation for this
    const validRes = updateUserSchema.safeParse(data);
    if (!validRes.success) {
      throw new Error(
        validRes.error.issues[0]?.message ??
          "Invalid Information for user update",
      );
    }

    const validData = validRes.data;

    // validate if the user exists

    const existingUser = await db.query.users.findFirst({
      where: {
        id,
      },
    });

    if (!existingUser) {
      throw new Error("User not found");
    }
    const email = validData.email?.toLowerCase();

    const emailChanged = email !== undefined && email !== existingUser.email;

    const avatarChanged =
      validData.avatarUrl !== undefined &&
      validData.avatarUrl !== existingUser.avatarUrl;

    const supabaseAuth = emailChanged ? createAdminClient() : null;
    // If the email is being changed, update it in Supabase Auth as well.
    if (emailChanged && supabaseAuth) {
      const { error } = await supabaseAuth.auth.admin.updateUserById(id, {
        email: email,
      });
      if (error) {
        console.warn("Failed to get user from db: ", error.message);
      }
    }

    // now we build an object containing only the fields provided in data
    const databaseUpdateData: UpdateUserData = {};

    if (email !== undefined) {
      databaseUpdateData.email = email;
    }

    if (validData.firstName !== undefined) {
      databaseUpdateData.firstName = validData.firstName;
    }

    if (validData.lastName !== undefined) {
      databaseUpdateData.lastName = validData.lastName;
    }

    if (validData.avatarUrl !== undefined) {
      databaseUpdateData.avatarUrl = validData.avatarUrl;
    }

    try {
      const [updatedUser] = await db
        .update(users)
        .set(databaseUpdateData)
        .where(eq(users.id, id))
        .returning();

      if (!updatedUser) {
        throw new Error("User not found");
      }

      if (avatarChanged && existingUser.avatarUrl) {
        const { error } = await deleteAvatar(existingUser.avatarUrl);

        if (error) {
          console.error("Failed to delete old avatar:", error);
        }
      }

      return updatedUser;
    } catch (error) {
      // if the update failed we need to roll back the email change as that was updated in the auth table

      if (supabaseAuth && emailChanged) {
        const { error: rollbackError } =
          await supabaseAuth.auth.admin.updateUserById(id, {
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

// function to delete the user
export async function deleteUser(id: string) {
  return safeAction(async () => {
    const supabaseAuth = createAdminClient();
    const user = await db.query.users.findFirst({
      where: {
        id,
      },
    });
    if (!user) {
      throw new Error("User not found");
    }

    // Delete the user's authentication account.
    const { error: authError } = await supabaseAuth.auth.admin.deleteUser(id);
    // delete the user from the db
    await db.delete(users).where(eq(users.id, id));
    if (authError) {
      throw new Error(authError.message);
    }

    // if the user had an avatar, remove it from storage
    if (user.avatarUrl) {
      const { error: avatarError } = await deleteAvatar(user.avatarUrl);

      if (avatarError) {
        console.error("Failed to delete user avatar:", avatarError);
      }
    }

    return { id };
  });
}

// update the user password, only the user is able to run this function

export async function updateOwnProfile(data: {
  firstName: string;
  lastName: string;
}) {
  return safeAction(async () => {
    const authenticatedUser = await requireUser();
    const cleanData = ownProfileSchema.parse(data);

    const [updatedUser] = await db
      .update(users)
      .set({
        firstName: cleanData.firstName || null,
        lastName: cleanData.lastName || null,
      })
      .where(eq(users.id, authenticatedUser.id))
      .returning();

    if (!updatedUser) {
      throw new Error("Your public user profile could not be found.");
    }

    revalidatePath("/profile");
    return updatedUser;
  });
}

export async function updateOwnAvatar(formData: FormData) {
  return safeAction(async () => {
    const authenticatedUser = await requireUser();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new Error("Choose an image to upload.");
    }

    const existingUser = await db.query.users.findFirst({
      where: { id: authenticatedUser.id },
    });

    if (!existingUser) {
      throw new Error("Your public user profile could not be found.");
    }

    const newAvatarUrl = await uploadAvatarFile(file, authenticatedUser.id);

    try {
      const [updatedUser] = await db
        .update(users)
        .set({ avatarUrl: newAvatarUrl })
        .where(eq(users.id, authenticatedUser.id))
        .returning();

      if (!updatedUser) {
        throw new Error("Your public user profile could not be found.");
      }

      if (existingUser.avatarUrl) {
        try {
          await deleteAvatarFile(existingUser.avatarUrl);
        } catch (error) {
          console.error("Failed to delete the previous avatar:", error);
        }
      }

      revalidatePath("/profile");
      return updatedUser;
    } catch (error) {
      try {
        await deleteAvatarFile(newAvatarUrl);
      } catch (cleanupError) {
        console.error("Failed to clean up the new avatar:", cleanupError);
      }

      throw error;
    }
  });
}

export async function removeOwnAvatar() {
  return safeAction(async () => {
    const authenticatedUser = await requireUser();
    const existingUser = await db.query.users.findFirst({
      where: { id: authenticatedUser.id },
    });

    if (!existingUser) {
      throw new Error("Your public user profile could not be found.");
    }

    if (!existingUser.avatarUrl) {
      return existingUser;
    }

    const [updatedUser] = await db
      .update(users)
      .set({ avatarUrl: null })
      .where(eq(users.id, authenticatedUser.id))
      .returning();

    if (!updatedUser) {
      throw new Error("Your public user profile could not be found.");
    }

    try {
      await deleteAvatarFile(existingUser.avatarUrl);
    } catch (error) {
      console.error("Failed to delete the removed avatar:", error);
    }

    revalidatePath("/profile");
    return updatedUser;
  });
}

export async function updateOwnEmail(email: string) {
  return safeAction(async () => {
    await requireUser();
    const cleanEmail = ownEmailSchema.parse(email);
    const supabase = await createClient();
    const { data: currentUserData, error: currentUserError } =
      await supabase.auth.getUser();

    if (currentUserError || !currentUserData.user) {
      throw new Error(
        currentUserError?.message ?? "Unable to verify your account.",
      );
    }

    if (currentUserData.user.email?.toLowerCase() === cleanEmail) {
      return { email: cleanEmail, confirmationRequired: false };
    }

    const requestHeaders = await headers();
    const origin = requestHeaders.get("origin");
    const { data, error } = await supabase.auth.updateUser(
      { email: cleanEmail },
      origin ? { emailRedirectTo: `${origin}/profile` } : undefined,
    );

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/profile");

    return {
      email: cleanEmail,
      confirmationRequired: data.user.email?.toLowerCase() !== cleanEmail,
    };
  });
}

export async function updateUserPassword(data: {
  currentPassword: string;
  password: string;
  confirmPassword: string;
}) {
  return safeAction(async () => {
    const authenticatedUser = await requireUser();
    const cleanData = changePasswordSchema.parse(data);
    const supabase = await createClient();
    const { data: currentUserData, error: currentUserError } =
      await supabase.auth.getUser();

    if (
      currentUserError ||
      !currentUserData.user ||
      currentUserData.user.id !== authenticatedUser.id ||
      !currentUserData.user.email
    ) {
      throw new Error(
        currentUserError?.message ?? "Unable to verify your account.",
      );
    }

    const passwordIsValid = await verifyCurrentPassword(
      currentUserData.user.email,
      cleanData.currentPassword,
    );

    if (!passwordIsValid) {
      throw new Error("Current password is incorrect.");
    }

    const { error } = await supabase.auth.updateUser({
      current_password: cleanData.currentPassword,
      password: cleanData.password,
    });

    if (error) {
      throw new Error(error.message);
    }

    return { updated: true };
  });
}
