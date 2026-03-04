// Backwards-compatible type aliases. Canonical card/effect schemas live in lib/types.ts.
export type {
  Condition,
  ConditionOperator,
  Effect,
  PlantDefinition as CardDefinition,
  PowerResolutionState as GameState,
  Resource as ResourceType,
  Trigger as TriggerType,
} from "../types";

export const TRIGGER_TYPES = ["onPlay", "onActivate", "onMature"] as const;
