import { EXPANDED_DECK } from "./cards";
import { drawDeckCardToHand, endTurn, gainSunlightToken, playCardToRow, takeFoodTokenToInventory } from "./rules";
import type { ActivationAbility, CardId, TableauRowId, TurnGameState } from "../types";

export type ActivationAnimationStep = {
  stepIndex: number;
  cardId: CardId;
  rowId: "oasisEdgeRow";
  trigger: "onActivate";
  hasAbility: boolean;
};

export type MoveAnimationPayload = {
  actorUid: string;
  activationSteps: ActivationAnimationStep[];
};

export type MoveIntent =
  | {
      type: "playCard";
      cardId: string;
      rowId: TableauRowId;
      expectedTurn: number;
      expectedActionCounter: number;
    }
  | {
      type: "drawCard";
      expectedTurn: number;
      expectedActionCounter: number;
    }
  | {
      type: "takeFoodToken";
      cacheIndex: number;
      expectedTurn: number;
      expectedActionCounter: number;
    }
  | {
      type: "gainSunToken";
      expectedTurn: number;
      expectedActionCounter: number;
    };

export type MoveErrorCode = "NOT_YOUR_TURN" | "INVALID_ACTION" | "STALE_STATE";

export type MoveResult =
  | {
      ok: true;
      state: TurnGameState;
      actionCounter: number;
      animation?: MoveAnimationPayload;
    }
  | {
      ok: false;
      error: {
        code: MoveErrorCode;
        message: string;
      };
    };



function cardById(cardId: CardId) {
  return EXPANDED_DECK.find((card) => card.id === cardId);
}

function applyActivationAbility(state: TurnGameState, actorUid: string, ability: ActivationAbility): TurnGameState {
  if (ability.type === "gainSun") {
    return gainSunlightToken(state, actorUid, ability.effect.amount).game;
  }

  if (ability.type === "drawCards") {
    let nextState = state;
    for (let index = 0; index < ability.effect.draw; index += 1) {
      const drawn = drawDeckCardToHand(nextState, actorUid);
      if (!drawn.card) {
        break;
      }

      nextState = drawn.game;
    }

    return nextState;
  }

  return state;
}

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

  if (intent.type === "playCard") {
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


  if (intent.type === "takeFoodToken") {
    const taken = takeFoodTokenToInventory(state, actorUid, intent.cacheIndex);

    if (!taken.token) {
      return {
        ok: false,
        error: {
          code: "INVALID_ACTION",
          message: "Unable to take that food token.",
        },
      };
    }

    return {
      ok: true,
      state: taken.game,
      actionCounter: currentActionCounter + 1,
    };
  }

  if (intent.type === "gainSunToken") {
    const gained = gainSunlightToken(state, actorUid, 1);

    return {
      ok: true,
      state: gained.game,
      actionCounter: currentActionCounter + 1,
    };
  }

  const drawn = drawDeckCardToHand(state, actorUid);

  if (!drawn.card) {
    return {
      ok: false,
      error: {
        code: "INVALID_ACTION",
        message: "Unable to draw a card.",
      },
    };
  }

  const oasisEdgeRow = drawn.game.tableauByPlayerId[actorUid]?.oasisEdgeRow ?? [];
  const orderedCardIds = [...oasisEdgeRow].reverse();

  let nextState = drawn.game;
  const activationSteps: ActivationAnimationStep[] = orderedCardIds.map((cardId, stepIndex) => {
    const ability = cardById(cardId)?.onActivate;

    if (ability) {
      nextState = applyActivationAbility(nextState, actorUid, ability);
    }

    return {
      stepIndex,
      cardId,
      rowId: "oasisEdgeRow" as const,
      trigger: "onActivate" as const,
      hasAbility: Boolean(ability),
    };
  });

  return {
    ok: true,
    state: nextState,
    actionCounter: currentActionCounter + 1,
    animation: {
      actorUid,
      activationSteps,
    },
  };
}
