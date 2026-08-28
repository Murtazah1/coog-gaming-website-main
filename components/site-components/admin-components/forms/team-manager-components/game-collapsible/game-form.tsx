"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CircleX } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { createGame, updateGame } from "@/server/games";

import type { DashboardGame } from "../games-dashboard";

// ==========================================
// FORM SCHEMA
// ==========================================

const gameFormSchema = z.object({
  name: z.string().trim().min(1, "Game name is required"),
});

type GameFormValues = z.infer<typeof gameFormSchema>;

// ==========================================
// PROPS
// ==========================================

// When creating a game, no existing game should be passed in.
interface CreateProps {
  mode: "create";
  game?: never;

  onSuccess?: () => void;
  onCancel?: () => void;
}

// When editing a game, we need the existing game.
interface EditProps {
  mode: "edit";
  game: DashboardGame;

  onSuccess?: () => void;
  onCancel?: () => void;
}

type GameFormProps = CreateProps | EditProps;

// ==========================================
// COMPONENT
// ==========================================

export default function GameForm({
  mode,
  game,
  onSuccess,
  onCancel,
}: GameFormProps) {
  const isCreate = mode === "create";

  // Reference to the actual file input.
  const fileInputRef = useRef<HTMLInputElement>(null);

  // The image we currently show to the user.
  // When editing, start with the game's existing image.
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    game?.imageUrl ?? null,
  );

  // Temporary browser URL created when the user selects a new image.
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  // Keeps track of whether the user explicitly removed the image.
  const [removeImage, setRemoveImage] = useState(false);

  // Tracks the image/database upload process.
  const [uploading, setUploading] = useState(false);

  // ==========================================
  // FORM
  // ==========================================

  const form = useForm<GameFormValues>({
    resolver: zodResolver(gameFormSchema),

    defaultValues: {
      name: game?.name ?? "",
    },
  });

  // ==========================================
  // OBJECT URL CLEANUP
  // ==========================================

  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  // ==========================================
  // IMAGE HANDLING
  // ==========================================

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    // If we already created a temporary preview,
    // clean it up first.
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }

    // Create a temporary local URL so we can
    // preview the selected image immediately.
    const newObjectUrl = URL.createObjectURL(file);

    setObjectUrl(newObjectUrl);
    setPreviewUrl(newObjectUrl);

    // Since a new image was selected,
    // the image is no longer considered removed.
    setRemoveImage(false);
  }

  function handleRemoveImage() {
    // Clean up the temporary preview if one exists.
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      setObjectUrl(null);
    }

    setPreviewUrl(null);

    // Remember that the user explicitly removed
    // the game's image.
    setRemoveImage(true);

    // Clear the actual file input too.
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  // ==========================================
  // SUBMIT
  // ==========================================

  async function onSubmit(values: GameFormValues) {
    setUploading(true);

    try {
      /*
       * CREATE:
       * imageUrl starts as null.
       *
       * EDIT:
       * imageUrl starts as the existing game's image.
       *
       * REMOVE:
       * imageUrl becomes null.
       */
      const file = fileInputRef.current?.files?.[0];
      const payload = new FormData();
      payload.set("name", values.name);
      payload.set("removeImage", String(removeImage));

      if (file) {
        payload.set("image", file);
      }

      // ========================================
      // CREATE OR UPDATE
      // ========================================

      const res =
        mode === "create"
          ? await createGame(payload)
          : await updateGame(game.id, payload);

      if (res?.error) {
        toast.error(res.error);
        return;
      }

      // ========================================
      // SUCCESS
      // ========================================

      toast.success(`Game ${isCreate ? "created" : "updated"} successfully.`);

      form.reset();

      // Clean up temporary browser image URL.
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        setObjectUrl(null);
      }

      setPreviewUrl(null);
      setRemoveImage(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      onSuccess?.();
    } catch {
      toast.error("An error has occurred.");
    } finally {
      setUploading(false);
    }
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Game Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Game Name</FormLabel>

              <FormControl>
                <Input
                  {...field}
                  placeholder="Valorant"
                  autoComplete="off"
                  disabled={uploading}
                />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        {/* Game Image */}
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">Game Image</label>

          {/* Current / selected image preview */}
          {previewUrl && (
            <div className="flex items-center gap-4">
              <Image
                src={previewUrl}
                alt="Game image preview"
                width={100}
                height={100}
                className="h-24 w-24 rounded-md border object-cover"
              />

              <button
                type="button"
                onClick={handleRemoveImage}
                className="text-red-500 hover:text-red-700"
                aria-label="Remove game image"
                disabled={uploading}
              >
                <CircleX className="h-6 w-6" />
              </button>
            </div>
          )}

          {/* File Input */}
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
          />

          <p className="text-xs text-muted-foreground">
            Optional. Max 1MB. Formats: PNG, JPEG, WebP, GIF.
          </p>
        </div>

        {/* Form Buttons */}
        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={uploading}
            >
              Cancel
            </Button>
          )}

          <Button
            type="submit"
            disabled={form.formState.isSubmitting || uploading}
          >
            {uploading
              ? "Uploading..."
              : isCreate
                ? "Add Game"
                : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
