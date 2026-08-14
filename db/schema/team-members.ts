import { pgTable, primaryKey, uuid, text } from "drizzle-orm/pg-core";
import { teams } from "./teams";
import { members } from "./members";

export const teamMembers = pgTable(
  "team_members",
  {
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    memberId: uuid("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.teamId, table.memberId] }),
  }),
);

export type TeamMembers = typeof teamMembers.$inferSelect;
