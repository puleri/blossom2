export type PlayerIdentity = {
  id: string;
  name: string;
};

export const ACTION_TYPES = ["grow", "root", "toTheSun", "pollinate"] as const;
export type ActionType = (typeof ACTION_TYPES)[number];

export type Resource = "water" | "compost" | "pollinator" | "mineral" | "trellis" | "wild";
export const FOOD_TOKEN_TYPES = ["W", "M", "C", "T", "P"] as const;
export type FoodToken = (typeof FOOD_TOKEN_TYPES)[number];
export const BIOME_IDS = ["understory", "oasisEdge", "canopy"] as const;
export type Biome = (typeof BIOME_IDS)[number];

export const ACTIVATION_ROW_IDS = ["understoryRow", "oasisEdgeRow"] as const;
export type ActivationRowId = (typeof ACTIVATION_ROW_IDS)[number];
export const TABLEAU_ROW_IDS = ["understoryRow", "oasisEdgeRow", "canopyRow"] as const;
export type TableauRowId = (typeof TABLEAU_ROW_IDS)[number];

export type Trigger = "onPlay"| "onActivate";
export type ActivateAction = "root" | "toTheSun" | "pollinate";

export type ConditionOperator = "==" | "!=" | ">" | ">=" | "<" | "<=";

export type Condition = {
  left: string;
  operator: ConditionOperator;
  right: unknown;
};

export type Effect =
  | { type: "gainResource"; resource: Resource; amount: number }
  | { type: "spendResource"; resource: Resource; amount: number }
  | { type: "gainSunlight"; amount: number }
  | { type: "spendSunlight"; amount: number }
  | { type: "drawCards"; amount: number }
  | { type: "tuckCards"; amount: number }
  | { type: "discardCards"; amount: number }
  | { type: "if"; condition: Condition; then: Effect[]; else?: Effect[] }
  | { type: "choice"; options: Array<{ label: string; effects: Effect[] }> };

export type Power = {
  trigger: Trigger;
  action?: ActivateAction;
  effects: Effect[];
};

export type RollDieTuckActivation = {
  type: "rollDieTuck";
  effect: {
    die: "d6";
    successIfLessThan: number;
    onSuccess: {
      tuckCards: number;
    };
  };
};

export type GroupBenefitActivation = {
  type: "groupBenefit";
  effect: {
    allPlayersGain: {
      resource: Resource;
      amount: number;
    };
    youGain: {
      resource: Resource;
      amount: number;
    };
  };
};

export type DrawCardsActivation = {
  type: "drawCards";
  effect: {
    draw: number;
  };
};

export type GainSunActivation = {
  type: "gainSun";
  effect: {
    amount: number;
  };
};

export type ActivationAbility =
  | RollDieTuckActivation
  | GroupBenefitActivation
  | DrawCardsActivation
  | GainSunActivation;

export type PlantDefinition = {
  id: string;
  key: string;
  name: string;
  cost: Partial<Record<Resource, number>>;
  points: number;
  maxSunTokens: number;
  biomes: Biome[];
  onPlay?: Power;
  onActivate?: ActivationAbility;
  // Legacy fields kept for compatibility with existing setup/DSL tests.
  biome?: Biome;
  sunlightCapacity?: number;
  powers?: Power[];
};

export type Card = PlantDefinition;
export type CardId = string;

export type TurnGameState = {
  gameId: string;
  seed: number;
  createdAt: string;
  players: Record<string, PlayerIdentity>;
  handsByPlayerId: Record<string, CardId[]>;
  tableauByPlayerId: Record<string, Record<TableauRowId, CardId[]>>;
  playerOrder: string[];
  currentPlayerId: string;
  turn: number;
  deck: CardId[];
  tray: CardId[];
  foodCache: FoodToken[];
  foodByPlayerId?: Record<string, FoodToken[]>;
  sunlightByPlayerId?: Record<string, number>;
  lastAction?: ActionType;
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

  isFinished: boolean;
  winnerId: string | null;
  scoringBreakdown: PlayerScoreBreakdown[];
}

export interface EndgameResult {
  isFinished: boolean;
  reason?: "deckExhausted" | "turnLimitReached";
}

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
};

export const BIOME_METADATA: Record<Biome, { displayName: string; rowId: TableauRowId }> = {
  canopy: { displayName: "Canopy", rowId: "canopyRow" },
  understory: { displayName: "Understory", rowId: "understoryRow" },
  oasisEdge: { displayName: "Oasis Edge", rowId: "oasisEdgeRow" },
};

export type PowerResolutionState = {
  resources: Record<Resource, number>;
  sunlight: number;
  score: number;
  hand: string[];
  deck: string[];
  tucked: string[];
  discard: string[];
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
