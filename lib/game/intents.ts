import { endTurn, isTurnActionId } from "./rules";
import type { ActivationRowId, ActionType, TurnGameState } from "../types";

export type MoveIntent = {
  actionType: ActionType;
  expectedTurn: number;
  expectedActionCounter: number;
  growSelection?: {
    cardId: string;
    rowId: ActivationRowId;
  };
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


  if (intent.actionType === "grow") {
    if (!intent.growSelection) {
      return {
        ok: false,
        error: {
          code: "INVALID_ACTION",
          message: "Grow requires selecting a card and row.",
        },
      };
    }

    const hand = state.handsByPlayerId[actorUid] ?? [];
    const selectedCard = hand.find((card) => card.id === intent.growSelection?.cardId);
    if (!selectedCard) {
      return {
        ok: false,
        error: {
          code: "INVALID_ACTION",
          message: "Selected grow card is no longer in your hand.",
        },
      };
    }

    const nextHand = hand.filter((card) => card.id !== intent.growSelection?.cardId);
    const currentRow = state.tableauByPlayerId[actorUid]?.[intent.growSelection.rowId] ?? [];
    const nextTableauByPlayerId = {
      ...state.tableauByPlayerId,
      [actorUid]: {
        ...(state.tableauByPlayerId[actorUid] ?? {
          understoryRow: [],
          oasisEdgeRow: [],
          meadowRow: [],
        }),
        [intent.growSelection.rowId]: [...currentRow, selectedCard],
      },
    };

    const nextState = {
      ...endTurn({
        ...state,
        handsByPlayerId: {
          ...state.handsByPlayerId,
          [actorUid]: nextHand,
        },
        tableauByPlayerId: nextTableauByPlayerId,
      }),
      lastAction: intent.actionType,
    };

    return {
      ok: true,
      state: nextState,
      actionCounter: currentActionCounter + 1,
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
