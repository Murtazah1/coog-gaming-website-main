import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

export const planTypeEnum = ["semester", "year"] as const;

export const members = pgTable("members", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  planType: text("plan_type", { enum: planTypeEnum }).notNull(),
  currentPeriodEnd: timestamp("current_period_end", {
    withTimezone: true,
  }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  discordName: text("discord_name"),
});

export type Members = typeof members.$inferSelect;
