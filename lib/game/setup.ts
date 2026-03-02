import { validatePowerDsl } from "./dsl/validate";
import type { CardDefinition } from "./types";

export function validateCardDefinitions(cards: CardDefinition[]): void {
  for (const card of cards) {
    if (!card.powers) {
      continue;
    }

    for (const [trigger, effects] of Object.entries(card.powers)) {
      validatePowerDsl(effects);
      if (!["onPlay", "onActivate", "onMature"].includes(trigger)) {
        throw new Error(`Unknown trigger '${trigger}' on card '${card.id}'`);
      }
    }
  }
}
