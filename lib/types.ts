export type Resource = "dew" | "spores" | "nectar" | "humus";
export type Biome = "cavern" | "grove" | "glade" | "canopy";
export type Trigger = "onPlay" | "onMature" | "onActivate";
export type ActivateAction = "root" | "toTheSun" | "pollinate";

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

export type PlantCard = {
  id: string;
  name: string;
  biome: Biome;
  points: number;
  sunlightCapacity: number;
  cost: Partial<Record<Resource, number>>;
  powers: Power[];
};

export type TableauCard = PlantCard & {
  ownerId: string;
  sunlight: number;
  matureTriggered: boolean;
};

export type PlayerState = {
  id: string;
  name: string;
  hand: PlantCard[];
  tableau: Record<Biome, TableauCard[]>;
  resources: Record<Resource, number>;
  score: number;
};

export type GameState = {
  id: string;
  turn: number;
  currentPlayerId: string;
  players: PlayerState[];
  deck: PlantCard[];
  log: string[];
};
