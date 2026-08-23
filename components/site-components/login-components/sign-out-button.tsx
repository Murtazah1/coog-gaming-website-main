"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";

type SignOutButtonProps = {
  appearance?: "button" | "menu-item";
};

export function SignOutButton({
  appearance = "button",
}: SignOutButtonProps) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const signOut = async () => {
    setIsSigningOut(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signOut({ scope: "local" });

    if (error) {
      toast.error("Unable to sign out. Please try again.");
      setIsSigningOut(false);
      return;
    }

    router.replace("/auth/login");
    router.refresh();
  };

  if (appearance === "menu-item") {
    return (
      <DropdownMenuItem
        disabled={isSigningOut}
        onSelect={() => void signOut()}
        className="cursor-pointer py-2.5 text-base text-red-300 focus:bg-red-950/70 focus:text-red-200"
      >
        <LogOut aria-hidden="true" />
        {isSigningOut ? "Signing out..." : "Sign out"}
      </DropdownMenuItem>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="border-red-400/50 bg-black/80 text-white hover:bg-red-950/80 hover:text-white"
      onClick={signOut}
      disabled={isSigningOut}
    >
      {isSigningOut ? "Signing out..." : "Sign out"}
    </Button>
  );
}
