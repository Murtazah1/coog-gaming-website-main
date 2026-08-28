"use client";

import { useEffect, useRef, useState } from "react";
import { CircleX } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { publicSignUpSchema } from "@/lib/validation/users";
import { cn } from "@/lib/utils";
import { signUpUser } from "@/server/nonAdminUsers";

const MAX_AVATAR_SIZE = 1024 * 1024;
const allowedAvatarTypes = new Set([
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gamerName, setGamerName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreviewUrl(null);
      return;
    }

    const previewUrl = URL.createObjectURL(avatarFile);
    setAvatarPreviewUrl(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [avatarFile]);

  const initials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "CG";

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setError(null);

    if (!file) {
      setAvatarFile(null);
      return;
    }

    if (!allowedAvatarTypes.has(file.type)) {
      event.target.value = "";
      setAvatarFile(null);
      setError("Choose a PNG, JPG, WEBP, or GIF image.");
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      event.target.value = "";
      setAvatarFile(null);
      setError("Profile pictures must be under 1MB.");
      return;
    }

    setAvatarFile(file);
  };

  const removeAvatar = () => {
    setAvatarFile(null);

    if (avatarInputRef.current) {
      avatarInputRef.current.value = "";
    }
  };

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const validation = publicSignUpSchema.safeParse({
      email,
      password,
      repeatPassword,
      firstName,
      lastName,
      gamerName,
    });

    if (!validation.success) {
      setError(
        validation.error.issues[0]?.message ?? "Enter valid signup details.",
      );
      return;
    }

    const formData = new FormData();
    formData.set("email", validation.data.email);
    formData.set("password", validation.data.password);
    formData.set("repeatPassword", validation.data.repeatPassword);
    formData.set("firstName", validation.data.firstName);
    formData.set("lastName", validation.data.lastName);
    formData.set("gamerName", validation.data.gamerName);

    if (avatarFile) {
      formData.set("avatar", avatarFile);
    }

    setIsLoading(true);

    try {
      const result = await signUpUser(formData);

      if (result.error) {
        setError(result.error);
        return;
      }

      const query = result.data?.avatarWarning ? "?avatar=retry" : "";
      router.push(`/auth/sign-up-success${query}`);
    } catch (unexpectedError) {
      setError(
        unexpectedError instanceof Error
          ? unexpectedError.message
          : "An unexpected error occurred.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Sign up</CardTitle>
          <CardDescription>
            Create your account and player profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="first-name">First name</Label>
                  <Input
                    id="first-name"
                    autoComplete="given-name"
                    required
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="last-name">Last name</Label>
                  <Input
                    id="last-name"
                    autoComplete="family-name"
                    required
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="gamer-name">Gamer name</Label>
                <Input
                  id="gamer-name"
                  autoComplete="nickname"
                  placeholder="Optional in-game or community name"
                  value={gamerName}
                  onChange={(event) => setGamerName(event.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="avatar">Avatar</Label>
                {avatarPreviewUrl && (
                  <div className="flex items-center gap-3">
                    <Avatar className="size-20 border">
                      <AvatarImage
                        src={avatarPreviewUrl}
                        alt="Avatar preview"
                        className="object-cover"
                      />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <button
                      type="button"
                      onClick={removeAvatar}
                      disabled={isLoading}
                      className="text-red-500 hover:text-red-700 disabled:opacity-50"
                      aria-label="Remove selected avatar"
                    >
                      <CircleX className="size-6" />
                    </button>
                  </div>
                )}
                <Input
                  ref={avatarInputRef}
                  id="avatar"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleAvatarChange}
                  disabled={isLoading}
                  aria-describedby="avatar-help"
                />
                <p id="avatar-help" className="text-xs text-muted-foreground">
                  Optional. PNG, JPG, WEBP, or GIF. Maximum 1MB.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="repeat-password">Repeat password</Label>
                  <Input
                    id="repeat-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={repeatPassword}
                    onChange={(event) => setRepeatPassword(event.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {error && (
                <p role="alert" className="text-sm text-red-500">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating your account..." : "Sign up"}
              </Button>
            </div>

            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link href="/auth/login" className="underline underline-offset-4">
                Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
