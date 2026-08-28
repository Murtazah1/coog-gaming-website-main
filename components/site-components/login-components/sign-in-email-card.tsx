"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { updateOwnEmail } from "@/server/nonAdminUsers";

type SignInEmailCardProps = {
  authEmail: string;
  mirroredEmail: string;
  pendingEmail: string | null;
};

export function SignInEmailCard({
  authEmail,
  mirroredEmail,
  pendingEmail,
}: SignInEmailCardProps) {
  const router = useRouter();
  const [email, setEmail] = useState(pendingEmail ?? authEmail);
  const [isSaving, setIsSaving] = useState(false);

  const saveEmail = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const result = await updateOwnEmail(email);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(
        result.data?.confirmationRequired
          ? "Confirm the change from both your current and new inboxes."
          : "Email updated.",
      );
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border-red-500/25 bg-black/90 font-sans text-base font-bold text-white shadow-xl backdrop-blur-xl [&_button]:text-base [&_button]:font-bold [&_input]:text-base [&_label]:text-base [&_label]:font-bold">
      <CardHeader>
        <CardTitle className="font-heading text-xl font-bold">
          Sign-in email
        </CardTitle>
        <CardDescription className="text-base leading-8 text-zinc-200">
          Secure email changes must be confirmed from both the current and new
          inboxes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5" onSubmit={saveEmail}>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="rounded-lg border border-white/15 bg-black/55 p-4 text-base leading-7 text-zinc-200">
            <p>Current sign-in email: {authEmail}</p>
            <p>Database email: {mirroredEmail}</p>
            {pendingEmail && (
              <p className="mt-2 text-amber-200">
                Pending change: {pendingEmail}. Confirm the newest link in both
                inboxes to finish.
              </p>
            )}
          </div>
          <Button type="submit" disabled={isSaving} className="w-fit">
            {isSaving ? "Sending..." : "Change email"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
