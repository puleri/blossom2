import { executeEffects, type ExecutionContext } from "./dsl/interpreter";
import type { Effect, GameState } from "./types";

export function applyEffects(state: GameState, effects: Effect[], ctx: Omit<ExecutionContext, "state"> = {}): void {
  executeEffects({ state, ...ctx }, effects);
}
