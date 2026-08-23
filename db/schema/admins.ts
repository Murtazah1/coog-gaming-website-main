// since I want to keep a general officer role available, admin roles will not be considered unique

import { pgTable, smallint, uuid } from "drizzle-orm/pg-core";

import { members } from "./members";

import type { Member } from "@/db/schema/members";
import type { User } from "@/db/schema/users";

export const adminRoles = [
  { value: 0, label: "President" },
  { value: 1, label: "VP" },
  { value: 2, label: "Treasurer" },
  { value: 3, label: "Secretary" },
  { value: 4, label: "Esports Director" },
  { value: 5, label: "Board Game Manager" },
  { value: 6, label: "Tabletop Manager" },
  { value: 7, label: "TCG Manager" },
  { value: 8, label: "Event Manager" },
  { value: 9, label: "Sponsorship Manager" },
  { value: 10, label: "Officer" },
] as const;

export const admins = pgTable("admins", {
  id: uuid("id").primaryKey().defaultRandom(),

  memberId: uuid("member_id")
    .notNull()
    .unique()
    .references(() => members.id, {
      onDelete: "cascade",
    }),

  role: smallint("role").notNull(),
});

export type Admin = typeof admins.$inferSelect;

export type AdminMember = Pick<Member, "id"> &
  Pick<
    User,
    "email" | "firstName" | "lastName" | "gamerName" | "avatarUrl"
  >;

export function getAdminRoleLabel(role: number) {
  return (
    adminRoles.find((adminRole) => adminRole.value === role)?.label ?? "Unknown"
  );
}
