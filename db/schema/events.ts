import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { admins } from "./admins";

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  location: text("location").notNull(),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }).notNull(),
  createdBy: uuid("created_by").references(() => admins.id, {
    onDelete: "set null",
  }),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type Event = typeof events.$inferSelect
