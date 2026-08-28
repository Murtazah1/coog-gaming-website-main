import * as z from "zod";

export function userEmailSchema(
  message = "Enter a valid email address",
) {
  return z.string().trim().pipe(z.email(message));
}

export const userPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters");

export function userFirstNameSchema(message = "First name is required") {
  return z.string().trim().min(1, message);
}

export function userLastNameSchema(message = "Last name is required") {
  return z.string().trim().min(1, message);
}

export function userGamerNameSchema(
  message = "Gamer name cannot be empty",
) {
  return z.string().trim().min(1, message);
}

export const publicSignUpSchema = z
  .object({
    email: userEmailSchema(),
    password: userPasswordSchema,
    repeatPassword: z.string().min(1, "Repeat your password"),
    firstName: userFirstNameSchema(),
    lastName: userLastNameSchema(),
    gamerName: z.string().trim(),
  })
  .refine((data) => data.password === data.repeatPassword, {
    message: "Passwords do not match",
    path: ["repeatPassword"],
  });
