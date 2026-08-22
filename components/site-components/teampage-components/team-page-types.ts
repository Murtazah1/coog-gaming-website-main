export type TeamPageMember = {
  id: string;
  discordName: string | null;
  user: {
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
};

export type TeamPageTeam = {
  id: string;
  name: string;
  members: TeamPageMember[];
};

export type TeamPageGame = {
  id: string;
  name: string;
  imageUrl: string | null;
  teams: TeamPageTeam[];
};
