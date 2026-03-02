import type { Effect, GameState } from "../types";

export type ExecutionContext = {
  state: GameState;
  conditionValues?: Record<string, unknown>;
  chooseOption?: (labels: string[]) => number;
};

export function executeEffects(context: ExecutionContext, effects: Effect[]): void {
  for (const effect of effects) {
    executeEffect(context, effect);
  }
}

function executeEffect(context: ExecutionContext, effect: Effect): void {
  switch (effect.op) {
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
    case "drawCards":
      drawCards(context.state, effect.count);
      return;
    case "tuckCard":
      tuckCards(context.state, effect.count);
      return;
    case "scorePoints":
      context.state.score += effect.amount;
      return;
    case "if": {
      const branch = evaluateCondition(context, effect.condition) ? effect.then : (effect.else ?? []);
      executeEffects(context, branch);
      return;
    }
    case "choice": {
      const labels = effect.options.map((option) => option.label);
      const chosen = context.chooseOption ? context.chooseOption(labels) : 0;
      const option = effect.options[chosen];
      if (!option) {
        throw new Error(`Invalid choice index: ${chosen}`);
      }
      executeEffects(context, option.effects);
      return;
    }
  }
}

function evaluateCondition(context: ExecutionContext, condition: Effect & { op: "if" }["condition"]): boolean {
  const left = context.conditionValues?.[condition.left];
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

function drawCards(state: GameState, count: number): void {
  for (let i = 0; i < count; i += 1) {
    const card = state.deck.shift();
    if (!card) {
      return;
    }
    state.hand.push(card);
  }
}

function tuckCards(state: GameState, count: number): void {
  for (let i = 0; i < count; i += 1) {
    const card = state.hand.shift();
    if (!card) {
      return;
    }
    state.tucked.push(card);
  }
}
