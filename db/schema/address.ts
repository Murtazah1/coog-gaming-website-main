import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { members } from "./members";

export const address = pgTable("address", {
  id: uuid("id").primaryKey().defaultRandom().references(() => members.id, {onDelete: "cascade"}),
  line1: text("line1").notNull(),
  line2: text("line2"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  postalCode: text("postal_code").notNull(),
  country: text("country").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
