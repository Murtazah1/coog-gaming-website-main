"use server";

import { db } from "@/db";
import { events } from "@/db/schema/events";
import { eq } from "drizzle-orm";
import * as z from "zod";
import safeAction from "./safe-action";

const eventSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required"),
    location: z.string().trim().min(1, "Location is required"),
    startDate: z.date(),
    endDate: z.date(),
    description: z.string().trim().nullable().optional(),
    createdBy: z.uuid("Please select an admin"),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "End time must be after start time",
    path: ["endDate"],
  });

export async function getEvents() {
  return safeAction(() =>
    db.query.events.findMany({
      orderBy: (table, { asc }) => [asc(table.startDate)],
    }),
  );
}

export async function createEvent(data: z.infer<typeof eventSchema>) {
  return safeAction(async () => {
    const result = eventSchema.safeParse(data);

    if (!result.success) {
      throw new Error(result.error.issues[0]?.message ?? "Invalid event");
    }

    const [event] = await db.insert(events).values(result.data).returning();

    return event;
  });
}

export async function updateEvent(
  id: string,
  data: z.infer<typeof eventSchema>,
) {
  return safeAction(async () => {
    const result = eventSchema.safeParse(data);

    if (!result.success) {
      throw new Error(result.error.issues[0]?.message ?? "Invalid event");
    }

    const [updatedEvent] = await db
      .update(events)
      .set(result.data)
      .where(eq(events.id, id))
      .returning();

    if (!updatedEvent) {
      throw new Error("Event not found");
    }

    return updatedEvent;
  });
}

export async function deleteEvent(id: string) {
  return safeAction(async () => {
    const [deletedEvent] = await db
      .delete(events)
      .where(eq(events.id, id))
      .returning();

    if (!deletedEvent) {
      throw new Error("Event not found");
    }

    return { id };
  });
}
