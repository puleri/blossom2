import { validatePowerDsl } from "./dsl/validate";
import type { PlantDefinition, Trigger } from "../types";

const VALID_TRIGGER_TYPES = new Set<Trigger>(["onPlay", "onActivate", "onMature"]);

export function validateCardDefinitions(cards: PlantDefinition[]): void {
  for (const card of cards) {
    for (const power of card.powers ?? []) {
      validatePowerDsl(power.effects);
      if (!VALID_TRIGGER_TYPES.has(power.trigger)) {
        throw new Error(`Unknown trigger '${power.trigger}' on card '${card.id}'`);
      }
    }
  }
}
