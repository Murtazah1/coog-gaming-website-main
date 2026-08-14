import { pgTable, text, uuid, unique } from "drizzle-orm/pg-core";
import { games } from "./games";

export const teams = pgTable(
  "teams",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
  },
  (table) => ({
    uniqueNamePerGame: unique().on(table.gameId, table.name),
  }),
);

export type Team = typeof teams.$inferSelect;
