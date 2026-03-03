import { validatePowerDsl } from "./dsl/validate";
import { TRIGGER_TYPES, type CardDefinition } from "./types";

const VALID_TRIGGER_TYPES = new Set<string>(TRIGGER_TYPES);

export function validateCardDefinitions(cards: CardDefinition[]): void {
  for (const card of cards) {
    if (!card.powers) {
      continue;
    }

    for (const [trigger, effects] of Object.entries(card.powers)) {
      validatePowerDsl(effects);
      if (!VALID_TRIGGER_TYPES.has(trigger)) {
        throw new Error(`Unknown trigger '${trigger}' on card '${card.id}'`);
      }
    }
  }
}
