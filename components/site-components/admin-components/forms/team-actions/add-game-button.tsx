"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import GameForm from "./game-form";

export default function AddGameButton() {
  const router = useRouter();

  const [dialogOpen, setDialogOpen] =
    useState(false);

  function handleSuccess() {
    setDialogOpen(false);

    router.refresh();
  }

  function handleCancel() {
    setDialogOpen(false);
  }

  return (
    <>
      <Button
        onClick={() => setDialogOpen(true)}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Game
      </Button>

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add Game
            </DialogTitle>

            <DialogDescription>
              Add a new game to the club.
            </DialogDescription>
          </DialogHeader>

          <GameForm
            mode="create"
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}