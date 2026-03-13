import { EXPANDED_DECK } from "./cards";
import { drawDeckCardToHand, endTurn, gainSunlightToken, playCardToRow, takeFoodTokenToInventory } from "./rules";
import type { ActivationAbility, CardId, Effect, FoodToken, Resource, TableauRowId, TurnGameState } from "../types";

export type ActivationAnimationStep = {
  stepIndex: number;
  cardId: CardId;
  rowId: TableauRowId;
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

function resolveRowActivations(
  state: TurnGameState,
  actorUid: string,
  rowId: TableauRowId,
): { state: TurnGameState; activationSteps: ActivationAnimationStep[] } {
  const row = state.tableauByPlayerId[actorUid]?.[rowId] ?? [];
  const orderedCardIds = [...row].reverse();

  let nextState = state;
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
      rowId,
      trigger: "onActivate",
      hasAbility: Boolean(ability),
      ...(rollOutcome ? { rollOutcome } : {}),
    };
  });

  return {
    state: nextState,
    activationSteps,
  };
}

export type MoveIntent =
  | {
      type: "playCard";
      cardId: string;
      rowId: TableauRowId;
      expectedTurn: number;
      expectedActionCounter: number;
    }
  | {
      type: "resolveChoice";
      optionIndex: number;
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

function evaluateCondition(state: TurnGameState, actorUid: string, condition: Extract<Effect, { type: "if" }>["condition"]): boolean {
  const leftValue = (() => {
    if (condition.left === "sunlight") {
      return state.sunlightByPlayerId?.[actorUid] ?? 0;
    }

    const resourcePrefix = "resource.";
    if (condition.left.startsWith(resourcePrefix)) {
      const resource = condition.left.slice(resourcePrefix.length) as Resource;
      const token = FOOD_TOKEN_BY_RESOURCE[resource];
      if (!token) {
        return 0;
      }

      const inventory = state.foodByPlayerId?.[actorUid] ?? [];
      return inventory.filter((entry) => entry === token).length;
    }

    return 0;
  })();

  const rightValue = typeof condition.right === "number" ? condition.right : Number.NaN;

  switch (condition.operator) {
    case "==":
      return leftValue === condition.right;
    case "!=":
      return leftValue !== condition.right;
    case ">":
      return leftValue > rightValue;
    case ">=":
      return leftValue >= rightValue;
    case "<":
      return leftValue < rightValue;
    case "<=":
      return leftValue <= rightValue;
    default:
      return false;
  }
}

function runEffects(
  state: TurnGameState,
  actorUid: string,
  sourceCardId: CardId,
  effects: Effect[],
): TurnGameState {
  let nextState = state;

  for (let index = 0; index < effects.length; index += 1) {
    const effect = effects[index];

    if (effect.type === "gainResource") {
      nextState = applyResourceGain(nextState, actorUid, effect.resource, effect.amount);
      continue;
    }

    if (effect.type === "gainSunlight") {
      nextState = gainSunlightToken(nextState, actorUid, effect.amount).game;
      continue;
    }

    if (effect.type === "if") {
      const branch = evaluateCondition(nextState, actorUid, effect.condition) ? effect.then : (effect.else ?? []);
      const branchState = runEffects(nextState, actorUid, sourceCardId, branch);

      if (branchState.pendingChoice) {
        const remainingEffects = effects.slice(index + 1);
        return {
          ...branchState,
          pendingChoice: {
            ...branchState.pendingChoice,
            remainingEffects: [...branchState.pendingChoice.remainingEffects, ...remainingEffects],
          },
        };
      }

      nextState = branchState;
      continue;
    }

    if (effect.type === "choice") {
      return {
        ...nextState,
        pendingChoice: {
          playerId: actorUid,
          cardId: sourceCardId,
          trigger: "onPlay",
          options: effect.options,
          remainingEffects: effects.slice(index + 1),
        },
      };
    }
  }

  return nextState;
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

  if (state.pendingChoice && intent.type !== "resolveChoice") {
    console.log("[choose-one] blocked non-resolve intent while pending choice", {
      intentType: intent.type,
      actorUid,
      pendingChoicePlayerId: state.pendingChoice.playerId,
      pendingChoiceCardId: state.pendingChoice.cardId,
    });

    return {
      ok: false,
      error: {
        code: "INVALID_ACTION",
        message: "Resolve the pending card choice first.",
      },
    };
  }

  if (intent.type === "resolveChoice") {
    console.log("[choose-one] resolving choice", {
      actorUid,
      hasPendingChoice: Boolean(state.pendingChoice),
      pendingChoicePlayerId: state.pendingChoice?.playerId,
      pendingChoiceCardId: state.pendingChoice?.cardId,
      optionIndex: intent.optionIndex,
    });
    const pendingChoice = state.pendingChoice;
    if (!pendingChoice || pendingChoice.playerId !== actorUid) {
      return {
        ok: false,
        error: {
          code: "INVALID_ACTION",
          message: "There is no choice to resolve.",
        },
      };
    }

    const selectedOption = pendingChoice.options[intent.optionIndex];
    if (!selectedOption) {
      console.log("[choose-one] invalid choice option", {
        optionIndex: intent.optionIndex,
        optionCount: pendingChoice.options.length,
      });
      return {
        ok: false,
        error: {
          code: "INVALID_ACTION",
          message: "Invalid choice option.",
        },
      };
    }

    const resolvedState = runEffects(
      {
        ...state,
        pendingChoice: null,
      },
      actorUid,
      pendingChoice.cardId,
      [...selectedOption.effects, ...pendingChoice.remainingEffects],
    );

    const nextState = resolvedState.pendingChoice ? resolvedState : endTurn(resolvedState);

    console.log("[choose-one] choice resolved", {
      stillPendingChoice: Boolean(nextState.pendingChoice),
      nextCurrentPlayerId: nextState.currentPlayerId,
      nextTurn: nextState.turn,
    });

    return {
      ok: true,
      state: nextState,
      actionCounter: currentActionCounter + 1,
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

    const onPlayEffects = cardById(played.card)?.onPlay?.effects ?? [];
    const postOnPlayState = onPlayEffects.length
      ? runEffects(
          {
            ...played.game,
            pendingChoice: null,
          },
          actorUid,
          played.card,
          onPlayEffects,
        )
      : {
          ...played.game,
          pendingChoice: null,
        };
    const nextState = postOnPlayState.pendingChoice ? postOnPlayState : endTurn(postOnPlayState);

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

    const activated = resolveRowActivations(taken.game, actorUid, "understoryRow");

    return {
      ok: true,
      state: activated.state,
      actionCounter: currentActionCounter + 1,
      animation: {
        actorUid,
        activationSteps: activated.activationSteps,
      },
    };
  }

  if (intent.type === "gainSunToken") {
    const gained = gainSunlightToken(state, actorUid, 1);
    const activated = resolveRowActivations(gained.game, actorUid, "canopyRow");

    return {
      ok: true,
      state: activated.state,
      actionCounter: currentActionCounter + 1,
      animation: {
        actorUid,
        activationSteps: activated.activationSteps,
      },
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

  const activated = resolveRowActivations(drawn.game, actorUid, "oasisEdgeRow");

  return {
    ok: true,
    state: activated.state,
    actionCounter: currentActionCounter + 1,
    animation: {
      actorUid,
      activationSteps: activated.activationSteps,
    },
  };
}
