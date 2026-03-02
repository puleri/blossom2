import { aggregateFinalScoring, determineWinnerId } from "./scoring";
import type { ActionType, EndgameResult, GameState } from "../types";

export function applyAction(state: GameState, action: ActionType): GameState {
  const nextState: GameState = {
    ...state,
    currentTurn: state.currentTurn + 1,
    // Pollinate consumes cards, others do not in this simplified model.
    deckCount: action === "pollinate" ? Math.max(0, state.deckCount - 1) : state.deckCount,
  };

  const endgame = checkEndgame(nextState);

  if (!endgame.isFinished) {
    return nextState;
  }

  const scoringBreakdown = aggregateFinalScoring(nextState);

  return {
    ...nextState,
    isFinished: true,
    winnerId: determineWinnerId(scoringBreakdown),
    scoringBreakdown,
  };
}

export function checkEndgame(state: GameState): EndgameResult {
  if (state.deckCount <= 0) {
    return { isFinished: true, reason: "deckExhausted" };
  }

  if (state.currentTurn >= state.maxTurns) {
    return { isFinished: true, reason: "turnLimitReached" };
  }

  return { isFinished: false };
}
