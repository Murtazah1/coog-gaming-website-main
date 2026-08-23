export type TeamPageMember = {
  id: string;
  user: {
    firstName: string | null;
    lastName: string | null;
    gamerName: string | null;
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
