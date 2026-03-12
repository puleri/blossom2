import { EXPANDED_DECK } from "./cards";
import { drawDeckCardToHand, endTurn, gainSunlightToken, playCardToRow, takeFoodTokenToInventory } from "./rules";
import type { ActivationAbility, CardId, FoodToken, Resource, TableauRowId, TurnGameState } from "../types";

export type ActivationAnimationStep = {
  stepIndex: number;
  cardId: CardId;
  rowId: "oasisEdgeRow";
  trigger: "onActivate";
  hasAbility: boolean;
  rollOutcome?: {
    rolled: number;
    successIfLessThan: number;
    success: boolean;
    tuckedCards: number;
  };
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

const FOOD_TOKEN_BY_RESOURCE: Partial<Record<Resource, FoodToken>> = {
  water: "W",
  mineral: "M",
  compost: "C",
  trellis: "T",
  pollinator: "P",
};

function gainFoodTokens(
  state: TurnGameState,
  playerId: string,
  token: FoodToken,
  amount: number,
): TurnGameState {
  if (amount <= 0) {
    return state;
  }

  const inventory = state.foodByPlayerId?.[playerId] ?? [];
  const gained = Array.from({ length: amount }, () => token);

  return {
    ...state,
    foodByPlayerId: {
      ...state.foodByPlayerId,
      [playerId]: [...inventory, ...gained],
    },
  };
}

function applyResourceGain(
  state: TurnGameState,
  playerId: string,
  resource: Resource,
  amount: number,
): TurnGameState {
  const token = FOOD_TOKEN_BY_RESOURCE[resource];
  if (!token) {
    return state;
  }

  return gainFoodTokens(state, playerId, token, amount);
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

  if (ability.type === "groupBenefit") {
    const { allPlayersGain, youGain } = ability.effect;
    let nextState = state;

    for (const playerId of state.playerOrder) {
      nextState = applyResourceGain(nextState, playerId, allPlayersGain.resource, allPlayersGain.amount);
    }

    return applyResourceGain(nextState, actorUid, youGain.resource, youGain.amount);
  }

  return state;
}

function rollDieValue(): number {
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    const randomValue = new Uint32Array(1);
    globalThis.crypto.getRandomValues(randomValue);
    return (randomValue[0] % 6) + 1;
  }

  return Math.floor(Math.random() * 6) + 1;
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
    let rollOutcome: ActivationAnimationStep["rollOutcome"];

    if (ability?.type === "rollDieTuck") {
      const rolled = rollDieValue();
      const success = rolled < ability.effect.successIfLessThan;
      const tuckedCards = success ? ability.effect.onSuccess.tuckCards : 0;

      if (tuckedCards > 0) {
        nextState = {
          ...nextState,
          deck: nextState.deck.slice(Math.min(nextState.deck.length, tuckedCards)),
        };
      }

      rollOutcome = {
        rolled,
        successIfLessThan: ability.effect.successIfLessThan,
        success,
        tuckedCards,
      };
    } else if (ability) {
      nextState = applyActivationAbility(nextState, actorUid, ability);
    }

    return {
      stepIndex,
      cardId,
      rowId: "oasisEdgeRow" as const,
      trigger: "onActivate" as const,
      hasAbility: Boolean(ability),
      ...(rollOutcome ? { rollOutcome } : {}),
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
