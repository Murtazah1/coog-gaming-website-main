"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import dayjs, { type Dayjs } from "dayjs";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { Event } from "@/db/schema/events";

import { createEvent, updateEvent } from "@/server/events";
import { requireAdmin } from "@/server/auth";

// ==========================================
// FORM SCHEMA
// ==========================================

const eventFormSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required"),
    location: z.string().trim().min(1, "Location is required"),
    description: z.string().trim().optional(),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: "End date must be after start date",
    path: ["endDate"],
  });

type EventFormValues = z.infer<typeof eventFormSchema>;

// ==========================================
// ADMIN OPTION
// ==========================================

// This is all the form needs to know about an admin.
// You can change this to your existing admin type
// if you already have one that includes these fields.


// ==========================================
// PROPS
// ==========================================

interface CreateProps {
  mode: "create";
  event?: never;
  initialDate: Dayjs;
  
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface EditProps {
  mode: "edit";
  event: Event;
  initialDate?: never;
  
  onSuccess?: () => void;
  onCancel?: () => void;
}

type EventFormProps = CreateProps | EditProps;

// ==========================================
// HELPER
// ==========================================

// datetime-local wants a string formatted like:
//
// 2026-08-16T14:30
//
// Dayjs makes that easy for us.

function toDateTimeLocal(date: Date | string | Dayjs) {
  return dayjs(date).format("YYYY-MM-DDTHH:mm");
}

// ==========================================
// COMPONENT
// ==========================================

export default function EventForm({
  mode,
  event,
  initialDate,
  
  onSuccess,
  onCancel,
}: EventFormProps) {

  // lets us easily check whether
  // we are creating or editing
  const isCreate = mode === "create";

  // ==========================================
  // DEFAULT DATES
  // ==========================================

  /*
   * CREATE:
   *
   * Use the calendar block the user clicked.
   *
   * For now we can start the event at that
   * selected date and make the default ending
   * one hour later.
   *
   *
   * EDIT:
   *
   * Use the dates already stored on the event.
   */

  const defaultStartDate = isCreate ? initialDate : dayjs(event.startDate);

  const defaultEndDate = isCreate
    ? initialDate.add(1, "hour")
    : dayjs(event.endDate);

  // ==========================================
  // FORM
  // ==========================================

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),

    defaultValues: {
      title: event?.title ?? "",

      location: event?.location ?? "",

      description: event?.description ?? "",

      startDate: toDateTimeLocal(defaultStartDate),

      endDate: toDateTimeLocal(defaultEndDate),

    },
  });

  // ==========================================
  // SUBMIT
  // ==========================================

  async function onSubmit(values: EventFormValues) {
    /*
     * The <input type="datetime-local">
     * gives us strings.
     *
     * Our database timestamp columns expect
     * actual Date objects, so convert them here.
     */

    const eventData = {
      title: values.title.trim(),

      location: values.location.trim(),

      description: values.description?.trim() || null,

      startDate: new Date(values.startDate),

      endDate: new Date(values.endDate),

      
    };

    /*
     * CREATE
     */

    const result = isCreate
      ? await createEvent(eventData)
      : /*
         * EDIT
         */
        await updateEvent(event.id, eventData);

    // ==========================================
    // ERROR
    // ==========================================

    if (result.error) {
      toast.error(result.error);
      return;
    }

    // ==========================================
    // SUCCESS
    // ==========================================

    toast.success(`Event ${isCreate ? "created" : "updated"} successfully.`);

    onSuccess?.();
  }

  // ==========================================
  // JSX
  // ==========================================

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* ================================= */}
        {/* TITLE */}
        {/* ================================= */}

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>

              <FormControl>
                <Input placeholder="Event title" {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        {/* ================================= */}
        {/* LOCATION */}
        {/* ================================= */}

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>

              <FormControl>
                <Input placeholder="Event location" {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        {/* ================================= */}
        {/* START DATE */}
        {/* ================================= */}

        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Date</FormLabel>

              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        {/* ================================= */}
        {/* END DATE */}
        {/* ================================= */}

        <FormField
          control={form.control}
          name="endDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>End Date</FormLabel>

              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

      

        {/* ================================= */}
        {/* DESCRIPTION */}
        {/* ================================= */}

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>

              <FormControl>
                <Textarea placeholder="Event description" {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        {/* ================================= */}
        {/* ACTIONS */}
        {/* ================================= */}

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}

          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? "Saving..."
              : isCreate
                ? "Create Event"
                : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
