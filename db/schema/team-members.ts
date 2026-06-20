import { pgTable, primaryKey, uuid } from "drizzle-orm/pg-core";
import { teams } from "./teams";
import { members } from "./members";

export const teamMembers = pgTable(
  "team_members",
  {
    teamId: uuid("team_id").notNull().references(() => teams.id),
    memberId: uuid("member_id").notNull().references(() => members.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.teamId, table.memberId] }),
  }),
);
