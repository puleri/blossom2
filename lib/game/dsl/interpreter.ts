import type { Condition, Effect, PowerResolutionState } from "../../types";

export type ExecutionContext = {
  state: PowerResolutionState;
  conditionValues?: Record<string, unknown>;
  chooseOption?: (labels: string[]) => number;
};

export function executeEffects(context: ExecutionContext, effects: Effect[]): void {
  for (const effect of effects) {
    executeEffect(context, effect);
  }
}

function executeEffect(context: ExecutionContext, effect: Effect): void {
  switch (effect.type) {
    case "gainResource":
      context.state.resources[effect.resource] += effect.amount;
      return;
    case "spendResource": {
      const current = context.state.resources[effect.resource];
      if (current < effect.amount) {
        throw new Error(`Insufficient ${effect.resource}: need ${effect.amount}, have ${current}`);
      }
      context.state.resources[effect.resource] -= effect.amount;
      return;
    }
    case "gainSunlight":
      context.state.sunlight += effect.amount;
      return;
    case "spendSunlight":
      if (context.state.sunlight < effect.amount) {
        throw new Error(`Insufficient sunlight: need ${effect.amount}, have ${context.state.sunlight}`);
      }
      context.state.sunlight -= effect.amount;
      return;
    case "drawCards":
      moveCards(context.state.deck, context.state.hand, effect.amount);
      return;
    case "tuckCards":
      moveCards(context.state.hand, context.state.tucked, effect.amount);
      return;
    case "discardCards":
      moveCards(context.state.hand, context.state.discard, effect.amount);
      return;
    case "scorePoints":
      context.state.score += effect.amount;
      return;
    case "if": {
      const branch = evaluateCondition(context.conditionValues, effect.condition) ? effect.then : (effect.else ?? []);
      executeEffects(context, branch);
      return;
    }
    case "choice": {
      const labels = effect.options.map((option) => option.label);
      const selectedIndex = context.chooseOption ? context.chooseOption(labels) : 0;
      const option = effect.options[selectedIndex];
      if (!option) {
        throw new Error(`Invalid choice index: ${selectedIndex}`);
      }
      executeEffects(context, option.effects);
      return;
    }
  }
}

function evaluateCondition(conditionValues: Record<string, unknown> | undefined, condition: Condition): boolean {
  const left = conditionValues?.[condition.left];
  const right = condition.right;

  switch (condition.operator) {
    case "==":
      return left === right;
    case "!=":
      return left !== right;
    case ">":
      return Number(left) > Number(right);
    case ">=":
      return Number(left) >= Number(right);
    case "<":
      return Number(left) < Number(right);
    case "<=":
      return Number(left) <= Number(right);
  }
}

function moveCards(source: string[], destination: string[], amount: number): void {
  for (let i = 0; i < amount; i += 1) {
    const card = source.shift();
    if (!card) {
      return;
    }
    destination.push(card);
  }
}
