import { smallint, pgTable, uuid } from "drizzle-orm/pg-core";
import { members } from "./members";
import { users } from "./users";

export const admins = pgTable("admins", {
  id: uuid("id").primaryKey().defaultRandom(),
  memberId: uuid("member_id").notNull().references(() => members.id),
  role: smallint("role").notNull().unique(),
});
