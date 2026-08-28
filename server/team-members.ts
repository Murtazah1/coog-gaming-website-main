"use server";

import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { teamMembers } from "@/db/schema";
import safeAction from "./safe-action";
import { requireAdmin } from "./auth";

const teamMemberSchema = z.object({
  teamId: z.uuid("Invalid team ID"),
  memberId: z.uuid("Invalid member ID"),
});

type TeamMemberInput = z.infer<typeof teamMemberSchema>;

export async function addTeamMember(input: TeamMemberInput) {
  return safeAction(async () => {
    await requireAdmin();

    const cleanInput = teamMemberSchema.parse(input);

    // Make sure the team exists.
    const team = await db.query.teams.findFirst({
      where: {
        id: cleanInput.teamId,
      },

      columns: {
        id: true,
      },
    });

    if (!team) {
      throw new Error("The selected team does not exist");
    }

    // Make sure the member exists.
    const member = await db.query.members.findFirst({
      where: {
        id: cleanInput.memberId,
      },

      columns: {
        id: true,
      },
    });

    if (!member) {
      throw new Error("The selected member does not exist");
    }

    // Make sure they're not already on the team.
    const existingMembership = await db.query.teamMembers.findFirst({
      where: {
        teamId: cleanInput.teamId,
        memberId: cleanInput.memberId,
      },
    });

    if (existingMembership) {
      throw new Error("This member is already on the team");
    }

    const [createdMembership] = await db
      .insert(teamMembers)
      .values({
        teamId: cleanInput.teamId,
        memberId: cleanInput.memberId,
      })
      .returning();

    if (!createdMembership) {
      throw new Error("Failed to add member to team");
    }

    return createdMembership;
  });
}

export async function removeTeamMember(input: TeamMemberInput) {
  return safeAction(async () => {
    await requireAdmin();

    const cleanInput = teamMemberSchema.parse(input);

    const [deletedMembership] = await db
      .delete(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, cleanInput.teamId),
          eq(teamMembers.memberId, cleanInput.memberId),
        ),
      )
      .returning();

    if (!deletedMembership) {
      throw new Error("This member is not on the selected team");
    }

    return deletedMembership;
  });
}
