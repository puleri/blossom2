import { deterministicShuffle } from "./shuffle";
import { EXPANDED_DECK } from "./cards";
import { aggregateFinalScoring, determineWinnerId } from "./scoring";
import { ACTION_TYPES, BIOME_METADATA, FOOD_TOKEN_TYPES, type ActionType, type CardId, type TableauRowId, type FoodToken, type GameState as ScoringGameState, type PlayerIdentity, type TurnGameState } from "../types";

const TURN_ACTION_IDS = new Set<string>(ACTION_TYPES);
const TRAY_SIZE = 3;
const OPENING_HAND_SIZE = 2;
const FOOD_TOKEN_COUNT = 5;
function rollFoodToken(): FoodToken {
  const index = Math.floor(Math.random() * FOOD_TOKEN_TYPES.length);
  return FOOD_TOKEN_TYPES[index] ?? FOOD_TOKEN_TYPES[0];
}

function rollFoodCache(count = FOOD_TOKEN_COUNT): FoodToken[] {
  return Array.from({ length: count }, () => rollFoodToken());
}

function createEmptyTableau(): Record<TableauRowId, CardId[]> {
  return {
    understoryRow: [],
    oasisEdgeRow: [],
    canopyRow: [],
  };
}

export function initialTableauByPlayerId(playerIds: string[]): Record<string, Record<TableauRowId, CardId[]>> {
  return Object.fromEntries(playerIds.map((playerId) => [playerId, createEmptyTableau()]));
}


function dealOpeningHands(
  deck: CardId[],
  playerIds: string[],
  cardsPerPlayer = OPENING_HAND_SIZE,
): { deck: CardId[]; handsByPlayerId: Record<string, CardId[]> } {
  const handsByPlayerId: Record<string, CardId[]> = {};
  let nextDeck = deck;

  for (const playerId of playerIds) {
    handsByPlayerId[playerId] = nextDeck.slice(0, cardsPerPlayer);
    nextDeck = nextDeck.slice(cardsPerPlayer);
  }

  return { deck: nextDeck, handsByPlayerId };
}

function drawToTray(deck: CardId[], tray: CardId[], maxSize = TRAY_SIZE): { deck: CardId[]; tray: CardId[] } {
  if (tray.length >= maxSize || deck.length === 0) {
    return { deck, tray };
  }

  const cardsNeeded = maxSize - tray.length;
  return {
    tray: [...tray, ...deck.slice(0, cardsNeeded)],
    deck: deck.slice(cardsNeeded),
  };
}

export function isTurnActionId(actionType: string): actionType is ActionType {
  return TURN_ACTION_IDS.has(actionType);
}

export function createGame(gameId: string, players: PlayerIdentity[], seed: number): TurnGameState {
  if (players.length < 1) {
    throw new Error("At least one player is required to create a game");
  }

  const createdAt = new Date().toISOString();
  const playerOrder = players.map((player) => player.id);
  const shuffledDeck = deterministicShuffle(EXPANDED_DECK.map((card) => card.id), seed);
  const setupHands = dealOpeningHands(shuffledDeck, playerOrder);
  const setupCards = drawToTray(setupHands.deck, []);

  return {
    gameId,
    seed,
    createdAt,
    players: Object.fromEntries(players.map((player) => [player.id, player])),
    handsByPlayerId: setupHands.handsByPlayerId,
    tableauByPlayerId: initialTableauByPlayerId(playerOrder),
    playerOrder,
    currentPlayerId: playerOrder[0],
    turn: 1,
    deck: setupCards.deck,
    tray: setupCards.tray,
    foodCache: rollFoodCache(),
  };
}

export function takeTrayCard(game: TurnGameState, trayIndex: number): { game: TurnGameState; card: CardId | null } {
  if (trayIndex < 0 || trayIndex >= game.tray.length) {
    return { game, card: null };
  }

  const card = game.tray[trayIndex] ?? null;
  if (!card) {
    return { game, card: null };
  }

  const trayWithoutCard = game.tray.filter((_, index) => index !== trayIndex);
  const nextCards = drawToTray(game.deck, trayWithoutCard);
  return {
    card,
    game: {
      ...game,
      deck: nextCards.deck,
      tray: nextCards.tray,
    },
  };
}

export function playCardToRow(
  game: TurnGameState,
  playerId: string,
  cardId: string,
  rowId: TableauRowId,
): { game: TurnGameState; card: CardId | null } {
  const hand = game.handsByPlayerId[playerId] ?? [];
  const handIndex = hand.findIndex((id) => id === cardId);
  if (handIndex === -1) {
    return { game, card: null };
  }

  const card = hand[handIndex] ?? null;
  if (!card) {
    return { game, card: null };
  }

  const deckCard = EXPANDED_DECK.find((candidate) => candidate.id === card);
  if (!deckCard) {
    return { game, card: null };
  }

  const biome = BIOME_METADATA[deckCard.biomes[0] ?? "canopy"]?.rowId;
  if (biome !== rowId) {
    return { game, card: null };
  }

  const nextHand = hand.filter((_, index) => index !== handIndex);
  const playerTableau = game.tableauByPlayerId[playerId] ?? initialTableauByPlayerId([playerId])[playerId];
  const nextRow = [card, ...(playerTableau[rowId] ?? [])];

  return {
    card,
    game: {
      ...game,
      handsByPlayerId: {
        ...game.handsByPlayerId,
        [playerId]: nextHand,
      },
      tableauByPlayerId: {
        ...game.tableauByPlayerId,
        [playerId]: {
          ...playerTableau,
          [rowId]: nextRow,
        },
      },
    },
  };
}

export function getNextPlayerId(game: TurnGameState): string {
  const currentIndex = game.playerOrder.indexOf(game.currentPlayerId);

  if (currentIndex === -1) {
    throw new Error("Current player is not present in player order");
  }

  return game.playerOrder[(currentIndex + 1) % game.playerOrder.length];
}

export function endTurn(game: TurnGameState): TurnGameState {
  const nextFoodCache = game.foodCache.length === 0 ? rollFoodCache() : game.foodCache;

  return {
    ...game,
    turn: game.turn + 1,
    currentPlayerId: getNextPlayerId(game),
    foodCache: nextFoodCache,
  };
}


export function applyAction(state: ScoringGameState, _action: ActionType): ScoringGameState {
  const nextDeckCount = Math.max(0, state.deckCount - 1);
  const nextTurn = state.currentTurn + 1;
  const shouldFinish = nextDeckCount === 0 || nextTurn >= state.maxTurns;

  if (!shouldFinish) {
    return {
      ...state,
      deckCount: nextDeckCount,
      currentTurn: nextTurn,
    };
  }

  const scoringBreakdown = aggregateFinalScoring(state);
  return {
    ...state,
    deckCount: nextDeckCount,
    currentTurn: nextTurn,
    isFinished: true,
    scoringBreakdown,
    winnerId: determineWinnerId(scoringBreakdown),
  };
}
