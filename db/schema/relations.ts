// this file is for defining relations between the tables

import { defineRelations } from "drizzle-orm";

import { users } from "./users";
import { members } from "./members";
import { admins } from "./admins";
import { address } from "./address";
import { events } from "./events";
import { games } from "./games";
import { teams } from "./teams";
import { teamMembers } from "./team-members";
import { checkIns } from "./check-ins";

export const relations = defineRelations(
  {
    users,
    members,
    admins,
    address,
    events,
    checkIns,
    games,
    teams,
    teamMembers,
  },
  (r) => ({
    // users have a 1-1 relationship with members and a 1-many relationship with checkIns
    users: {
      member: r.one.members({
        from: r.users.id,
        to: r.members.userId,
      }),

      checkIns: r.many.checkIns(),
    },
    // members have a 1-1 relationship with admins, have a 1-many relationship with teams through teamMembers
    // and lets redefine the users to members relationship as that we routinely need user info for members
    // members also have a 1 to many relationship with addresses

    members: {
      user: r.one.users({
        from: r.members.userId,
        to: r.users.id,
        optional: false
      }),

      admin: r.one.admins({
        from: r.members.id,
        to: r.admins.memberId,
      }),
      // we need to add the through to connect teams and members through the teamMembers junction table
      teams: r.many.teams({
        from: r.members.id.through(r.teamMembers.memberId),
        to: r.teams.id.through(r.teamMembers.teamId),
      }),

      address: r.one.address({
        from: r.members.id,
        to: r.address.id,
      }),
      teamMemberships: r.many.teamMembers(),
    },
    // admins have a 1-1 relationship with members that I need to redefine
    // and they have a 1-many relationship with events that they create

    admins: {
      member: r.one.members({
        from: r.admins.memberId,
        to: r.members.id,
      }),

      events: r.many.events(),
    },

    // games have a 1 to many relationship with teams

    games: {
      teams: r.many.teams(),
    },

    // teams have a many to many relationship with members
    // and they have a many to 1 relationship with games

    teams: {
      members: r.many.members({
        from: r.teams.id.through(r.teamMembers.teamId),
        to: r.members.id.through(r.teamMembers.memberId),
      }),
      game: r.one.games({
        from: r.teams.gameId,
        to: r.games.id,
      }),
      teamMemberships: r.many.teamMembers(),
    },

    // events have a many to 1 relationship with admins
    // and they have a 1 to many relationship with checkIns

    events: {
      admin: r.one.admins({
        from: r.events.createdBy,
        to: r.admins.id,
      }),

      checkIns: r.many.checkIns(),
    },

    // checkins have relations with events and users many - 1
    checkIns: {
      event: r.one.events({
        from: r.checkIns.eventId,
        to: r.events.id,
      }),
      user: r.one.users({
        from: r.checkIns.userId,
        to: r.users.id,
      }),
    },

    // team members have a many to 1 relationship with both teams and members
    teamMembers: {
      team: r.one.teams({
        from: r.teamMembers.teamId,
        to: r.teams.id,
      }),

      member: r.one.members({
        from: r.teamMembers.memberId,
        to: r.members.id,
      }),
    },

    address: {
      member: r.one.members({
        from: r.address.id,
        to: r.members.id,
      }),
    },
  }),
);
