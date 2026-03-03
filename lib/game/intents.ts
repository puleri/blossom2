import { endTurn, isTurnActionId } from "./rules";
import type { ActionType, TurnGameState } from "../types";

export type MoveIntent = {
  actionType: ActionType;
  expectedTurn: number;
  expectedActionCounter: number;
};

export type MoveErrorCode = "NOT_YOUR_TURN" | "INVALID_ACTION" | "STALE_STATE";

export type MoveResult =
  | {
      ok: true;
      state: TurnGameState;
      actionCounter: number;
    }
  | {
      ok: false;
      error: {
        code: MoveErrorCode;
        message: string;
      };
    };

export function applyMoveIntent(
  state: TurnGameState,
  intent: MoveIntent,
  actorUid: string,
  currentActionCounter: number,
): MoveResult {
  if (state.currentPlayerId !== actorUid) {
    return {
      ok: false,
      error: {
        code: "NOT_YOUR_TURN",
        message: "It is not your turn.",
      },
    };
  }

  if (state.turn !== intent.expectedTurn || currentActionCounter !== intent.expectedActionCounter) {
    return {
      ok: false,
      error: {
        code: "STALE_STATE",
        message: "The game has advanced. Refresh and try again.",
      },
    };
  }

  if (!isTurnActionId(intent.actionType)) {
    return {
      ok: false,
      error: {
        code: "INVALID_ACTION",
        message: "Unknown action.",
      },
    };
  }

  const nextState = {
    ...endTurn(state),
    lastAction: intent.actionType,
  };

  return {
    ok: true,
    state: nextState,
    actionCounter: currentActionCounter + 1,
  };
}
