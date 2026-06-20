import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";
import { events } from "./events";

export const checkIns = pgTable("check_ins", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  eventId: uuid("event_id").notNull().references(() => events.id),
  scannedAt: timestamp("scanned_at", { withTimezone: true }).defaultNow(),
});
