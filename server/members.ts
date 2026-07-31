"use server";

import { db } from "@/db/index";
import { members, type Member } from "@/db/schema/members";
import { createAdminClient } from "@/lib/supabase/admin";
import { eq, ilike } from "drizzle-orm";
import safeAction from "./safe-action";

type UpdateMemberData = Partial<
  Pick<Member, "planType" | "currentPeriodEnd" | "discordName">
>;



export async function getMembers(search?: string) {
  return safeAction(() =>
    db.query.members.findMany({
      where: search ? ilike(members.discordName, `%${search}%`) : undefined,
    }),
  );
}

export async function getMemberByID(id: string) {
  return safeAction(() =>
    db.query.members.findFirst({ where: eq(members.id, id) }),
  ).then((res) => res ?? null);
}

export async function createMember(data: {
  planType: string;
  currentPeriodEnd: string;
  discordName: string;
}) {


}
