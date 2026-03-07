import { describe, expect, it } from "vitest";
import { applyMoveIntent } from "../lib/game/intents";
import { createGame, takeTrayCard } from "../lib/game/rules";
import { BIOME_METADATA, type ActivationRowId, type Card } from "../lib/types";


function rowForCard(card: Card): ActivationRowId {
  const rowId = BIOME_METADATA[card.biomes[0] ?? "canopy"].rowId;
  if (!rowId) {
    throw new Error("Card is not playable to an activation row in this test.");
  }

  return rowId;
}

const game = createGame(
  "game-1",
  [
    { id: "p1", name: "P1" },
    { id: "p2", name: "P2" },
  ],
  7,
);

describe("applyMoveIntent", () => {
  it("deals an opening hand to each player", () => {
    expect(game.handsByPlayerId.p1.length).toBeGreaterThan(0);
    expect(game.handsByPlayerId.p2.length).toBe(game.handsByPlayerId.p1.length);
  });

  it("initializes game with tray + deck counts after opening deal", () => {
    const dealtCards = Object.values(game.handsByPlayerId).reduce((count, hand) => count + hand.length, 0);

    expect(game.tray).toHaveLength(3);
    const totalCards = game.deck.length + game.tray.length + dealtCards;
    expect(totalCards).toBeGreaterThan(8);
    expect(game.deck).toHaveLength(totalCards - dealtCards - game.tray.length);
  });

  it("returns NOT_YOUR_TURN when actor is not active player", () => {
    const result = applyMoveIntent(
      game,
      { cardId: game.handsByPlayerId.p1[0].id, rowId: rowForCard(game.handsByPlayerId.p1[0]), expectedTurn: 1, expectedActionCounter: 0 },
      "p2",
      0,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("NOT_YOUR_TURN");
    }
  });

  it("returns STALE_STATE when counters do not match", () => {
    const result = applyMoveIntent(
      game,
      { cardId: game.handsByPlayerId.p1[0].id, rowId: rowForCard(game.handsByPlayerId.p1[0]), expectedTurn: 1, expectedActionCounter: 0 },
      "p1",
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("STALE_STATE");
    }
  });

  it("plays a card, then advances turn and action counter on valid intent", () => {
    const result = applyMoveIntent(
      game,
      { cardId: game.handsByPlayerId.p1[0].id, rowId: rowForCard(game.handsByPlayerId.p1[0]), expectedTurn: 1, expectedActionCounter: 0 },
      "p1",
      0,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.turn).toBe(2);
      expect(result.state.currentPlayerId).toBe("p2");
      expect(result.actionCounter).toBe(1);
      expect(result.state.handsByPlayerId.p1.length).toBe(game.handsByPlayerId.p1.length - 1);
      const targetRowId = rowForCard(game.handsByPlayerId.p1[0]);
      expect(result.state.tableauByPlayerId.p1[targetRowId][0]?.id).toBe(game.handsByPlayerId.p1[0].id);
    }
  });


  it("supports solo games by keeping turn control with the same player", () => {
    const soloGame = createGame(
      "solo-game",
      [{ id: "solo", name: "Solo" }],
      9,
    );

    const result = applyMoveIntent(
      soloGame,
      { cardId: soloGame.handsByPlayerId.solo[0].id, rowId: rowForCard(soloGame.handsByPlayerId.solo[0]), expectedTurn: 1, expectedActionCounter: 0 },
      "solo",
      0,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.currentPlayerId).toBe("solo");
      expect(result.state.turn).toBe(2);
    }
  });

  it("refills tray after taking a tray card while deck has cards", () => {
    const beforeTakeDeck = game.deck.length;
    const taken = takeTrayCard(game, 1);

    expect(taken.card).not.toBeNull();
    expect(taken.game.tray).toHaveLength(3);
    expect(taken.game.deck).toHaveLength(beforeTakeDeck - 1);
  });

  it("allows tray to shrink when draw pile is exhausted", () => {
    const tinyGame = {
      ...game,
      tray: game.tray.slice(0, 2),
      deck: [],
    };

    const taken = takeTrayCard(tinyGame, 0);

    expect(taken.card).not.toBeNull();
    expect(taken.game.deck).toHaveLength(0);
    expect(taken.game.tray).toHaveLength(1);
  });
});
