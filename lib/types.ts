export type ActionType = "grow" | "root" | "toTheSun" | "pollinate";

export interface PlayerScoreBreakdown {
  playerId: string;
  basePoints: number;
  tuckedCards: number;
  sunlightPoints: number;
  bonusPoints: number;
  total: number;
}

export interface PlantCard {
  id: string;
  points: number;
  sunlightTokens: number;
  tuckedCards: number;
  bonusPoints?: number;
}

export interface PlayerState {
  id: string;
  plants: PlantCard[];
}

export interface GameState {
  players: PlayerState[];
  deckCount: number;
  discardCount: number;
  currentTurn: number;
  maxTurns: number;

  /** Endgame fields */
  isFinished: boolean;
  winnerId: string | null;
  scoringBreakdown: PlayerScoreBreakdown[];
}

export interface EndgameResult {
  isFinished: boolean;
  reason?: "deckExhausted" | "turnLimitReached";
}
