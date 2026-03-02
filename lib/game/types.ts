export type ResourceType = "water" | "nutrients" | "seeds" | "compost";

export type Condition = {
  left: string;
  operator: "==" | "!=" | ">" | ">=" | "<" | "<=";
  right: unknown;
};

export type Effect =
  | { op: "gainResource"; resource: ResourceType; amount: number }
  | { op: "spendResource"; resource: ResourceType; amount: number }
  | { op: "gainSunlight"; amount: number }
  | { op: "drawCards"; count: number }
  | { op: "tuckCard"; count: number }
  | { op: "scorePoints"; amount: number }
  | { op: "if"; condition: Condition; then: Effect[]; else?: Effect[] }
  | { op: "choice"; options: Array<{ label: string; effects: Effect[] }> };

export type TriggerType = "onPlay" | "onActivate" | "onMature";

export type CardPowerSet = Partial<Record<TriggerType, Effect[]>>;

export type CardDefinition = {
  id: string;
  name: string;
  powers?: CardPowerSet;
};

export type GameState = {
  resources: Record<ResourceType, number>;
  sunlight: number;
  score: number;
  hand: string[];
  deck: string[];
  tucked: string[];
};
