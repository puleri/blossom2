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

export function isTurnActionId(actionType: string): actionType is ActionType {
  return TURN_ACTION_IDS.has(actionType);
}

export function createGame(gameId: string, players: PlayerIdentity[], seed: number): TurnGameState {
  if (players.length < 2) {
    throw new Error("At least two players are required to create a game");
  }

  const createdAt = new Date().toISOString();
  const playerOrder = players.map((player) => player.id);

  return {
    gameId,
    seed,
    createdAt,
    players: Object.fromEntries(players.map((player) => [player.id, player])),
    playerOrder,
    currentPlayerId: playerOrder[0],
    turn: 1,
    deck: deterministicShuffle(STARTING_DECK, seed),
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
