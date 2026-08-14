"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteGame } from "@/server/games";
import GameForm from "./game-form";
import TeamForm from "../team-collapsible/team-form";
import type { DashboardGame } from "../games-dashboard";


type GameActionsProps = {
  game: DashboardGame;
};

export default function GameActions({
  game,
}: GameActionsProps) {
  const router = useRouter();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [addTeamOpen, setAddTeamOpen] = useState(false);

  const [deleting, setDeleting] = useState(false);

  function handleEditSuccess() {
    setEditOpen(false);
    router.refresh();
  }

  function handleAddTeamSuccess() {
    setAddTeamOpen(false);
    router.refresh();
  }

  async function handleDelete() {
    setDeleting(true);

    try {
      const res = await deleteGame(game.id);

      if (res?.error) {
        toast.error(res.error);
        return;
      }

      toast.success(`${game.name} deleted successfully.`);

      setDeleteOpen(false);

      router.refresh();
    } catch {
      toast.error("Failed to delete game.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      {/* Game Actions */}
      <div className="flex items-center gap-1">
        {/* Add Team */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setAddTeamOpen(true)}
          aria-label={`Add team to ${game.name}`}
        >
          <Plus className="h-4 w-4" />
        </Button>

        {/* Edit Game */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setEditOpen(true)}
          aria-label={`Edit ${game.name}`}
        >
          <Pencil className="h-4 w-4" />
        </Button>

        {/* Delete Game */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDeleteOpen(true)}
          aria-label={`Delete ${game.name}`}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      {/* Add Team Dialog */}
      <Dialog
        open={addTeamOpen}
        onOpenChange={setAddTeamOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add Team
            </DialogTitle>

            <DialogDescription>
              Add a new team to {game.name}.
            </DialogDescription>
          </DialogHeader>

          <TeamForm
            mode="create"
            gameId={game.id}
            onSuccess={handleAddTeamSuccess}
            onCancel={() => setAddTeamOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Game Dialog */}
      <Dialog
        open={editOpen}
        onOpenChange={setEditOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Edit Game
            </DialogTitle>

            <DialogDescription>
              Update {game.name}.
            </DialogDescription>
          </DialogHeader>

          <GameForm
            mode="edit"
            game={game}
            onSuccess={handleEditSuccess}
            onCancel={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Game Dialog */}
      <Dialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Delete Game
            </DialogTitle>

            <DialogDescription>
              Are you sure you want to delete {game.name}? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>

            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting
                ? "Deleting..."
                : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}