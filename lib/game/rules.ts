import { deterministicShuffle } from "./shuffle";
import type { Card, GameState, PlayerIdentity } from "../types";

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

export function createGame(gameId: string, players: PlayerIdentity[], seed: number): GameState {
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

export function getNextPlayerId(game: GameState): string {
  const currentIndex = game.playerOrder.indexOf(game.currentPlayerId);

  if (currentIndex === -1) {
    throw new Error("Current player is not present in player order");
  }

  return game.playerOrder[(currentIndex + 1) % game.playerOrder.length];
}

export function endTurn(game: GameState): GameState {
  return {
    ...game,
    turn: game.turn + 1,
    currentPlayerId: getNextPlayerId(game),
  };
}
