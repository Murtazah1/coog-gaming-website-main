// similar to the user form
// we are given a user to turn into a member in this form tho
// and when we are done the dialog closes and we go on our merry way

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
import type { Member } from "@/db/schema/members";
import { planTypeEnum } from "@/db/schema/members";
import type { User } from "@/db/schema/users";
import { createMember, updateMember } from "@/server/members";
// this type is called Nonmember b/c this is all the information we need from the users table to make a member
type NonMember = Pick<User, "id" | "email" | "firstName" | "lastName">;

const memberFormSchema = z.object({
  planType: z.enum(planTypeEnum),
  currentPeriodEnd: z.string().optional(),
});

type MemberFormValues = z.infer<typeof memberFormSchema>;

interface CreateProps {
  mode: "create";
  user: NonMember;
  // there is no member yet
  member?: never;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface EditProps {
  mode: "edit";
  user: NonMember;
  member: Member;
  onSuccess?: () => void;
  onCancel?: () => void;
}

type MemberFormProps = CreateProps | EditProps;

export default function MemberForm({
  mode,
  user,
  member,
  onSuccess,
  onCancel,
}: MemberFormProps) {
  const isCreate = mode === "create";

  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: {
      planType: member?.planType ?? planTypeEnum[0],

      currentPeriodEnd: member?.currentPeriodEnd ?? "",
    },
  });

  async function onSubmit(values: MemberFormValues) {
    try {
      const memberData = {
        planType: values.planType,

        currentPeriodEnd: values.currentPeriodEnd?.trim() || null,
      };

      // if we are creating we run createMember, if we are editing we run EditMember

      const result = isCreate
        ? await createMember({ userId: user.id, ...memberData })
        : await updateMember(member.id, memberData);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(`Member ${isCreate ? "created" : "updated"} successfully`);

      form.reset();
      onSuccess?.();
    } catch {
      toast.error(
        `An error occurred while ${
          isCreate ? "creating" : "updating"
        } the member.`,
      );
    }
  }

  const saving = form.formState.isSubmitting;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        

        <FormField
          control={form.control}
          name="planType"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <select
                  {...field}
                  disabled={saving}
                  className="
                    flex h-10 w-full rounded-md
                    border border-input bg-background
                    px-3 py-2 text-sm
                    ring-offset-background
                    focus:outline-none focus:ring-2
                    focus:ring-ring focus:ring-offset-2
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  {planTypeEnum.map((planType) => (
                    <option key={planType} value={planType}>
                      {planType}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="currentPeriodEnd"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Current Period End
              </FormLabel>

              <FormControl>
                <Input
                  {...field}
                  type="date"
                  disabled={saving}
                />
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

          <Button
            type="submit"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : isCreate
                ? "Add Member"
                : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
