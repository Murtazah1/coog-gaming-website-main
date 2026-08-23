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

import { adminRoles, type Admin } from "@/db/schema/admins";

import { createAdmin, updateAdmin } from "@/server/admins";

import type { AdminMember } from "@/db/schema/admins";

const adminFormSchema = z.object({
  role: z
    .number()
    .int()
    .min(0, "Select an admin role")
    .max(10, "Select an admin role"),
});

type AdminFormValues = z.infer<typeof adminFormSchema>;

interface CreateProps {
  mode: "create";
  member: AdminMember;
  admin?: never;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface EditProps {
  mode: "edit";
  member: AdminMember;
  admin: Admin;
  onSuccess?: () => void;
  onCancel?: () => void;
}

type AdminFormProps = CreateProps | EditProps;

function getMemberLabel(member: AdminMember) {
  const fullName = [member.firstName, member.lastName]
    .filter(Boolean)
    .join(" ");

  return fullName ? `${fullName} - ${member.gamerName}` : member.email;
}

export default function AdminForm(props: AdminFormProps) {
  const { mode, member, onSuccess, onCancel } = props;

  const isCreate = mode === "create";

  const form = useForm<AdminFormValues>({
    resolver: zodResolver(adminFormSchema),

    defaultValues: {
      role: mode === "edit" ? props.admin.role : -1,
    },
  });

  async function onSubmit(values: AdminFormValues) {
    try {
      const adminData = {
        role: values.role,
      };

      const result =
        mode === "create"
          ? await createAdmin({
              memberId: member.id,
              ...adminData,
            })
          : await updateAdmin(props.admin.id, adminData);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(`Admin ${isCreate ? "created" : "updated"} successfully.`);

      form.reset();
      onSuccess?.();
    } catch {
      toast.error(
        `An error occurred while ${
          isCreate ? "creating" : "updating"
        } the admin.`,
      );
    }
  }

  const saving = form.formState.isSubmitting;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="rounded-md border bg-muted/40 p-3">
          <p className="text-sm text-muted-foreground">
            {isCreate ? "Creating admin for" : "Editing admin"}
          </p>

          <p className="font-medium">{getMemberLabel(member)}</p>
        </div>

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Admin Role</FormLabel>

              <FormControl>
                <select
                  value={field.value}
                  onChange={(event) =>
                    field.onChange(Number(event.target.value))
                  }
                  disabled={saving}
                  className="
                    flex h-10 w-full
                    rounded-md border
                    border-input bg-background
                    px-3 py-2 text-sm
                    ring-offset-background
                    focus:outline-none
                    focus:ring-2
                    focus:ring-ring
                    focus:ring-offset-2
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  <option value={-1} disabled>
                    Select a role
                  </option>

                  {adminRoles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={saving}
            >
              {isCreate ? "Back" : "Cancel"}
            </Button>
          )}

          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : isCreate ? "Add Admin" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
