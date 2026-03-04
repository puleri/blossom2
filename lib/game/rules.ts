import { deterministicShuffle } from "./shuffle";
import { ACTION_TYPES, type ActionType, type Card, type PlayerIdentity, type TurnGameState } from "../types";

const STARTING_DECK: Card[] = [
  { id: "card-1", name: "Sprout" },
  { id: "card-2", name: "Fern" },
  { id: "card-3", name: "Moss" },
  { id: "card-4", name: "Oak Sapling" },
  { id: "card-5", name: "Willow" },
  { id: "card-6", name: "Lotus" },
  { id: "card-7", name: "Cedar" },
  { id: "card-8", name: "Birch" },
];

const TURN_ACTION_IDS = new Set<string>(ACTION_TYPES);
const TRAY_SIZE = 3;
const OPENING_HAND_SIZE = 2;

function dealOpeningHands(
  deck: Card[],
  playerIds: string[],
  cardsPerPlayer = OPENING_HAND_SIZE,
): { deck: Card[]; handsByPlayerId: Record<string, Card[]> } {
  const handsByPlayerId: Record<string, Card[]> = {};
  let nextDeck = deck;

  for (const playerId of playerIds) {
    handsByPlayerId[playerId] = nextDeck.slice(0, cardsPerPlayer);
    nextDeck = nextDeck.slice(cardsPerPlayer);
  }

  return { deck: nextDeck, handsByPlayerId };
}

function drawToTray(deck: Card[], tray: Card[], maxSize = TRAY_SIZE): { deck: Card[]; tray: Card[] } {
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
  const shuffledDeck = deterministicShuffle(STARTING_DECK, seed);
  const setupHands = dealOpeningHands(shuffledDeck, playerOrder);
  const setupCards = drawToTray(setupHands.deck, []);

  return {
    gameId,
    seed,
    createdAt,
    players: Object.fromEntries(players.map((player) => [player.id, player])),
    handsByPlayerId: setupHands.handsByPlayerId,
    playerOrder,
    currentPlayerId: playerOrder[0],
    turn: 1,
    deck: setupCards.deck,
    tray: setupCards.tray,
  };
}

export function takeTrayCard(game: TurnGameState, trayIndex: number): { game: TurnGameState; card: Card | null } {
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

export function getNextPlayerId(game: TurnGameState): string {
  const currentIndex = game.playerOrder.indexOf(game.currentPlayerId);

  if (currentIndex === -1) {
    throw new Error("Current player is not present in player order");
  }

  return game.playerOrder[(currentIndex + 1) % game.playerOrder.length];
}

export function endTurn(game: TurnGameState): TurnGameState {
  return {
    ...game,
    turn: game.turn + 1,
    currentPlayerId: getNextPlayerId(game),
  };
}
