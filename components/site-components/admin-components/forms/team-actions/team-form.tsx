"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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

import { createTeam, updateTeam } from "@/server/teams";

import type { DashboardTeam } from "../../games-dashboard";


// ==========================================
// FORM SCHEMA
// ==========================================

const teamFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Team name is required"),
});

type TeamFormValues = z.infer<typeof teamFormSchema>;


// ==========================================
// PROPS
// ==========================================

// When creating a team, we need to know
// which game the team belongs to.
interface CreateProps {
  mode: "create";

  gameId: string;

  // There is no team yet.
  team?: never;

  onSuccess?: () => void;
  onCancel?: () => void;
}


// When editing, the team already exists,
// so we don't need gameId separately.
interface EditProps {
  mode: "edit";

  team: DashboardTeam;

  gameId?: never;

  onSuccess?: () => void;
  onCancel?: () => void;
}


type TeamFormProps = CreateProps | EditProps;


// ==========================================
// COMPONENT
// ==========================================

export default function TeamForm({
  mode,
  gameId,
  team,
  onSuccess,
  onCancel,
}: TeamFormProps) {
  const isCreate = mode === "create";


  // ==========================================
  // FORM
  // ==========================================

  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamFormSchema),

    defaultValues: {
      name: team?.name ?? "",
    },
  });


  // ==========================================
  // SUBMIT
  // ==========================================

  async function onSubmit(values: TeamFormValues) {
    try {
      const teamData = {
        name: values.name.trim(),
      };

      // If creating:
      // we need gameId + team name.
      //
      // If editing:
      // we only need the existing team id + new values.
      const result =
        mode === "create"
          ? await createTeam({
              gameId,
              ...teamData,
            })
          : await updateTeam(
              team.id,
              teamData,
            );

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(
        `Team ${isCreate ? "created" : "updated"} successfully.`,
      );

      form.reset();

      onSuccess?.();
    } catch {
      toast.error(
        `An error occurred while ${
          isCreate ? "creating" : "updating"
        } the team.`,
      );
    }
  }


  // ==========================================
  // SAVING STATE
  // ==========================================

  const saving = form.formState.isSubmitting;


  // ==========================================
  // UI
  // ==========================================

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        {/* Team Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Team Name
              </FormLabel>

              <FormControl>
                <Input
                  {...field}
                  placeholder="Varsity Team"
                  autoComplete="off"
                  disabled={saving}
                />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />


        {/* Form Buttons */}
        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={saving}
            >
              Cancel
            </Button>
          )}

          <Button
            type="submit"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : isCreate
                ? "Add Team"
                : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}