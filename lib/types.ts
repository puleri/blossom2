export type PlayerIdentity = {
  id: string;
  name: string;
};

export type Card = {
  id: string;
  name: string;
};

export const ACTION_TYPES = ["grow", "root", "toTheSun", "pollinate"] as const;
export type ActionType = (typeof ACTION_TYPES)[number];


export type TurnGameState = {
  gameId: string;
  seed: number;
  createdAt: string;
  players: Record<string, PlayerIdentity>;
  playerOrder: string[];
  currentPlayerId: string;
  turn: number;
  deck: Card[];
};

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

export type Resource = "dew" | "spores" | "nectar" | "humus";
export const BIOME_IDS = ["understory", "oasisEdge", "meadow", "canopy"] as const;
export type Biome = (typeof BIOME_IDS)[number];

export const ACTIVATION_ROW_IDS = [
  "understoryRow",
  "oasisEdgeRow",
  "meadowRow",
] as const;
export type ActivationRowId = (typeof ACTIVATION_ROW_IDS)[number];

export type Trigger = "onPlay" | "onMature" | "onActivate";
export type ActivateAction = "root" | "toTheSun" | "pollinate";

export type ActivationOrder = "leftToRight" | "rightToLeft";

export type ActivationRowMetadata = {
  biome: Exclude<Biome, "canopy">;
  displayName: string;
  actionType: ActivateAction;
  activationOrder: ActivationOrder;
};

export const ACTIVATION_ROW_METADATA: Record<ActivationRowId, ActivationRowMetadata> = {
  understoryRow: {
    biome: "understory",
    displayName: "Understory",
    actionType: "root",
    activationOrder: "rightToLeft",
  },
  oasisEdgeRow: {
    biome: "oasisEdge",
    displayName: "Oasis Edge",
    actionType: "toTheSun",
    activationOrder: "rightToLeft",
  },
  meadowRow: {
    biome: "meadow",
    displayName: "Meadow",
    actionType: "pollinate",
    activationOrder: "rightToLeft",
  },
};

export const BIOME_METADATA: Record<Biome, { displayName: string; rowId: ActivationRowId | null }> = {
  canopy: { displayName: "Canopy", rowId: null },
  understory: { displayName: "Understory", rowId: "understoryRow" },
  oasisEdge: { displayName: "Oasis Edge", rowId: "oasisEdgeRow" },
  meadow: { displayName: "Meadow", rowId: "meadowRow" },
};

export type Effect =
  | { type: "gainResource"; resource: Resource; amount: number }
  | { type: "gainSunlight"; amount: number }
  | { type: "drawCards"; amount: number }
  | { type: "scorePoints"; amount: number };

export type Power = {
  trigger: Trigger;
  action?: ActivateAction;
  effects: Effect[];
};

export type PlantDefinition = {
  id: string;
  name: string;
  biome: Biome;
  points: number;
  sunlightCapacity: number;
  cost: Partial<Record<Resource, number>>;
  powers: Power[];
};

export type TableauCard = PlantDefinition & {
  ownerId: string;
  sunlight: number;
  matureTriggered: boolean;
};

export type EnginePlayerState = {
  id: string;
  name: string;
  hand: PlantDefinition[];
  tableau: Record<Biome, TableauCard[]>;
  resources: Record<Resource, number>;
  score: number;
};

export type EngineGameState = {
  id: string;
  turn: number;
  currentPlayerId: string;
  players: EnginePlayerState[];
  deck: PlantDefinition[];
  log: string[];
};
