import { endTurn, playCardToRow } from "./rules";
import type { TableauRowId, TurnGameState } from "../types";

export type MoveIntent = {
  cardId: string;
  rowId: TableauRowId;
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

  const played = playCardToRow(state, actorUid, intent.cardId, intent.rowId);

  if (!played.card) {
    return {
      ok: false,
      error: {
        code: "INVALID_ACTION",
        message: "Unable to play card to that row.",
      },
    };
  }

  const nextState = endTurn(played.game);

  return {
    ok: true,
    state: nextState,
    actionCounter: currentActionCounter + 1,
  };
}
