import { pgTable, text, timestamp, uuid, date } from "drizzle-orm/pg-core";
import { users } from "./users";

export const planTypeEnum = ["semester", "year"] as const;

export const members = pgTable("members", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  planType: text("plan_type", { enum: planTypeEnum }).notNull(),
  currentPeriodEnd: date("current_period_end",{
    mode: "string"
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  discordName: text("discord_name"),
});

export type Member = typeof members.$inferSelect;
