import { pgTable, text, uuid } from "drizzle-orm/pg-core";

export const games = pgTable("games", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  imageUrl: text("image_url"),
  imageObjectName: text("image_object_name"),
});
export type Game = typeof games.$inferSelect;
