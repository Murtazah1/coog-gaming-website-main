"use client";

import { useState } from "react";
import { toast } from "sonner";

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
import { updateUserPassword } from "@/server/users";

export function PasswordChangeCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const savePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const result = await updateUserPassword({
        currentPassword,
        password,
        confirmPassword,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      setCurrentPassword("");
      setPassword("");
      setConfirmPassword("");
      toast.success("Password updated.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border-red-500/25 bg-black/90 text-white shadow-xl backdrop-blur-xl lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-xl">Change password</CardTitle>
        <CardDescription className="text-base leading-7 text-zinc-200">
          Enter your current password and choose a new password of at least
          eight characters.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5 md:grid-cols-3" onSubmit={savePassword}>
          <div className="grid gap-2">
            <Label htmlFor="current-password">Current password</Label>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </div>
          <div className="md:col-span-3">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Updating..." : "Update password"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
