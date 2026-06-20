import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { games } from "./games";

export const teams = pgTable("teams", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  gameId: uuid("game_id").notNull().references(() => games.id),
});
