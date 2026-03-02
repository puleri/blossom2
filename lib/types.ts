export type PlayerIdentity = {
  id: string;
  name: string;
};

export type Card = {
  id: string;
  name: string;
};

export type GameState = {
  gameId: string;
  seed: number;
  createdAt: string;
  players: Record<string, PlayerIdentity>;
  playerOrder: string[];
  currentPlayerId: string;
  turn: number;
  deck: Card[];
};
