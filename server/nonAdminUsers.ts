"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import * as z from "zod";

import { db } from "@/db/index";
import { users } from "@/db/schema/users";
import {
  deleteAvatarFile,
  uploadAvatarFile,
  validateAvatarFile,
} from "@/lib/supabase/avatar-storage";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { publicSignUpSchema } from "@/lib/validation/users";
import { requireUser, verifyCurrentPassword } from "./auth";
import safeAction from "./safe-action";
import { getUserById } from "./users";

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
  gamerName: z.string().trim(),
});

const ownEmailSchema = z
  .email("Enter a valid email address")
  .trim()
  .transform((email) => email.toLowerCase());

export async function signUpUser(formData: FormData) {
  return safeAction(async () => {
    const input = publicSignUpSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
      repeatPassword: formData.get("repeatPassword"),
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      gamerName: formData.get("gamerName") ?? "",
    });
    const avatarValue = formData.get("avatar");
    const avatar =
      avatarValue instanceof File && avatarValue.size > 0 ? avatarValue : null;

    if (avatar) {
      validateAvatarFile(avatar);
    }

    const origin = (await headers()).get("origin");

    if (!origin) {
      throw new Error("Unable to determine the confirmation URL.");
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email: input.email.toLowerCase(),
      password: input.password,
      options: {
        emailRedirectTo: origin,
        data: {
          first_name: input.firstName,
          last_name: input.lastName,
          gamer_name: input.gamerName || null,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    const authUser = data.user;

    if (!authUser || !authUser.identities?.length) {
      throw new Error(
        "Unable to create this account. Try signing in or resetting your password.",
      );
    }

    const mirroredUserResult = await getUserById(authUser.id);

    if (mirroredUserResult.error) {
      throw new Error(mirroredUserResult.error);
    }

    if (!mirroredUserResult.data) {
      throw new Error("Unable to create your public user profile.");
    }

    const [updatedProfile] = await db
      .update(users)
      .set({
        firstName: input.firstName,
        lastName: input.lastName,
        gamerName: input.gamerName || null,
      })
      .where(eq(users.id, authUser.id))
      .returning({ id: users.id });

    if (!updatedProfile) {
      throw new Error("Unable to save your public user profile.");
    }

    let avatarWarning: string | null = null;

    if (avatar) {
      let uploadedUrl: string | null = null;

      try {
        uploadedUrl = await uploadAvatarFile(avatar, authUser.id);

        const [updatedUser] = await db
          .update(users)
          .set({ avatarUrl: uploadedUrl })
          .where(eq(users.id, authUser.id))
          .returning({ id: users.id });

        if (!updatedUser) {
          throw new Error("Unable to save the profile picture.");
        }
      } catch (avatarError) {
        if (uploadedUrl) {
          try {
            await deleteAvatarFile(uploadedUrl);
          } catch (cleanupError) {
            console.error("Unable to clean up signup avatar:", cleanupError);
          }
        }

        console.error("Signup avatar could not be saved:", avatarError);
        avatarWarning =
          "Your account was created, but the profile picture could not be saved.";
      }
    }

    return { avatarWarning };
  });
}

export async function updateOwnProfile(data: {
  firstName: string;
  lastName: string;
  gamerName: string;
}) {
  return safeAction(async () => {
    const authenticatedUser = await requireUser();
    const cleanData = ownProfileSchema.parse(data);

    const [updatedUser] = await db
      .update(users)
      .set({
        firstName: cleanData.firstName || null,
        lastName: cleanData.lastName || null,
        gamerName: cleanData.gamerName || null,
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
        } catch (cleanupError) {
          console.error("Failed to delete the previous avatar:", cleanupError);
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
    } catch (cleanupError) {
      console.error("Failed to delete the removed avatar:", cleanupError);
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

export async function deleteOwnAccount() {
  return safeAction(async () => {
    const authenticatedUser = await requireUser();
    const supabase = await createClient();
    const { data: currentUserData, error: currentUserError } =
      await supabase.auth.getUser();

    if (
      currentUserError ||
      !currentUserData.user ||
      currentUserData.user.id !== authenticatedUser.id
    ) {
      throw new Error(
        currentUserError?.message ?? "Unable to verify your account.",
      );
    }

    const existingUser = await db.query.users.findFirst({
      where: { id: authenticatedUser.id },
    });

    const supabaseAdmin = createAdminClient();
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(
      authenticatedUser.id,
    );

    if (authError) {
      throw new Error(authError.message);
    }

    await db.delete(users).where(eq(users.id, authenticatedUser.id));

    if (existingUser?.avatarUrl) {
      try {
        await deleteAvatarFile(existingUser.avatarUrl);
      } catch (cleanupError) {
        console.error("Failed to delete account avatar:", cleanupError);
      }
    }

    return { id: authenticatedUser.id };
  });
}
