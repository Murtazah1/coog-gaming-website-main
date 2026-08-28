"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { SignOutButton } from "@/components/site-components/login-components/sign-out-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { deleteOwnAccount } from "@/server/nonAdminUsers";

export function AccountActionsCard() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const setDialogOpen = (open: boolean) => {
    if (isDeleting) {
      return;
    }

    setIsOpen(open);
  };

  const deleteAccount = async () => {
    setIsDeleting(true);

    try {
      const result = await deleteOwnAccount();

      if (result.error) {
        toast.error(result.error);
        return;
      }

      const supabase = createClient();
      await supabase.auth.signOut({ scope: "local" });
      toast.success("Your account has been deleted.");
      router.replace("/");
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section
      aria-label="Account actions"
      className="relative grid gap-6 py-4 lg:col-span-2 lg:grid-cols-2 [&_button]:h-12 [&_button]:w-full [&_button]:px-8 [&_button]:font-sans [&_button]:text-lg [&_button]:font-bold"
    >
      <SignOutButton />

      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 z-10 h-px w-24 -translate-x-1/2 -translate-y-1/2 bg-red-500/70 shadow-[0_0_12px_rgba(239,68,68,0.6)] lg:h-16 lg:w-px"
      />

      <Dialog open={isOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="destructive">
            <Trash2 aria-hidden="true" />
            Delete account
          </Button>
        </DialogTrigger>
        <DialogContent className="border-red-500/40 bg-zinc-950 text-white">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl font-bold">
              Delete your account?
            </DialogTitle>
            <DialogDescription className="font-sans text-base font-bold leading-7 text-zinc-300">
              This permanently deletes your sign-in, public profile, avatar,
              and related account records. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="[&_button]:text-base [&_button]:font-bold">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                disabled={isDeleting}
                className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              onClick={deleteAccount}
              disabled={isDeleting}
            >
              <Trash2 aria-hidden="true" />
              {isDeleting ? "Deleting..." : "Permanently delete account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
