import type { ActivationAbility, Condition, Effect, PlantDefinition, Resource } from "../types";

const RESOURCE_LABELS: Record<Resource, string> = {
  water: "water",
  compost: "compost",
  pollinator: "pollinator",
  mineral: "mineral",
  trellis: "trellis",
  wild: "wild",
};

function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return count === 1 ? singular : plural;
}

function describeCondition(condition: Condition): string {
  return `${condition.left} ${condition.operator} ${String(condition.right)}`;
}

function describeEffect(effect: Effect): string {
  switch (effect.type) {
    case "gainResource":
      return `gain ${effect.amount} ${RESOURCE_LABELS[effect.resource]}`;
    case "spendResource":
      return `spend ${effect.amount} ${RESOURCE_LABELS[effect.resource]}`;
    case "gainSunlight":
      return `gain ${effect.amount} sunlight`;
    case "spendSunlight":
      return `spend ${effect.amount} sunlight`;
    case "drawCards":
      return `draw ${effect.amount} ${pluralize(effect.amount, "card")}`;
    case "tuckCards":
      return `tuck ${effect.amount} ${pluralize(effect.amount, "card")}`;
    case "discardCards":
      return `discard ${effect.amount} ${pluralize(effect.amount, "card")}`;
    case "if": {
      const thenEffects = describeEffects(effect.then);
      const elseEffects = effect.else?.length ? ` Otherwise, ${describeEffects(effect.else)}` : "";
      return `if ${describeCondition(effect.condition)}, ${thenEffects}${elseEffects}`;
    }
    case "choice": {
      const optionLabels = effect.options.map((option) => option.label);
      return `choose one: ${optionLabels.join(" or ")}`;
    }
    default:
      return "";
  }
}

function describeEffects(effects: Effect[]): string {
  return effects.map((effect) => describeEffect(effect)).filter(Boolean).join("; ");
}

function describeActivation(ability: ActivationAbility): string {
  switch (ability.type) {
    case "gainSun":
      return `Activate: gain ${ability.effect.amount} sunlight.`;
    case "drawCards":
      return `Activate: draw ${ability.effect.draw} ${pluralize(ability.effect.draw, "card")}.`;
    case "rollDieTuck":
      return `Activate: roll a ${ability.effect.die}. If the result is less than ${ability.effect.successIfLessThan}, tuck ${ability.effect.onSuccess.tuckCards} ${pluralize(ability.effect.onSuccess.tuckCards, "card")}.`;
    case "groupBenefit": {
      const allPlayers = ability.effect.allPlayersGain;
      const you = ability.effect.youGain;
      return `Activate: all players gain ${allPlayers.amount} ${RESOURCE_LABELS[allPlayers.resource]}. You gain ${you.amount} ${RESOURCE_LABELS[you.resource]}.`;
    }
    default:
      return "";
  }
}

export function describePlantAbility(card: PlantDefinition): string | null {
  const segments: string[] = [];

  if (card.onPlay?.effects?.length) {
    const onPlayDescription = describeEffects(card.onPlay.effects);
    if (onPlayDescription) {
      segments.push(`On play: ${onPlayDescription}.`);
    }
  }

  if (card.onActivate) {
    const activateDescription = describeActivation(card.onActivate);
    if (activateDescription) {
      segments.push(activateDescription);
    }
  }

  return segments.length ? segments.join(" ") : null;
}
