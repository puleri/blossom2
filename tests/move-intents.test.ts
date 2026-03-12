import { describe, expect, it } from "vitest";
import { applyMoveIntent } from "../lib/game/intents";
import { EXPANDED_DECK } from "../lib/game/cards";
import { createGame, takeTrayCard } from "../lib/game/rules";
import { BIOME_METADATA, type Card, type CardId, type TableauRowId } from "../lib/types";

function cardById(cardId: CardId): Card {
  const card = EXPANDED_DECK.find((candidate) => candidate.id === cardId);
  if (!card) {
    throw new Error(`Missing card definition for ${cardId}`);
  }

  return card;
}

function rowForCard(cardId: CardId): TableauRowId {
  const card = cardById(cardId);
  const rowId = BIOME_METADATA[card.biomes[0] ?? "canopy"].rowId;
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
    expect(game.tableauByPlayerId.p1.canopyRow).toEqual([]);
    expect(game.tableauByPlayerId.p2.canopyRow).toEqual([]);
  });

  it("returns NOT_YOUR_TURN when actor is not active player", () => {
    const result = applyMoveIntent(
      game,
      {
        type: "playCard",
        cardId: game.handsByPlayerId.p1[0],
        rowId: rowForCard(game.handsByPlayerId.p1[0]),
        expectedTurn: 1,
        expectedActionCounter: 0,
      },
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
      {
        type: "playCard",
        cardId: game.handsByPlayerId.p1[0],
        rowId: rowForCard(game.handsByPlayerId.p1[0]),
        expectedTurn: 1,
        expectedActionCounter: 0,
      },
      "p1",
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("STALE_STATE");
    }
  });



  it("rejects play intents for card IDs that are not in the active player hand", () => {
    const intentCardId = game.handsByPlayerId.p2[0];
    const result = applyMoveIntent(
      game,
      {
        type: "playCard",
        cardId: intentCardId,
        rowId: rowForCard(intentCardId),
        expectedTurn: 1,
        expectedActionCounter: 0,
      },
      "p1",
      0,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INVALID_ACTION");
    }
  });

  it("rejects play intents for unknown card IDs", () => {
    const result = applyMoveIntent(
      game,
      {
        type: "playCard",
        cardId: "unknown-card-id",
        rowId: "understoryRow",
        expectedTurn: 1,
        expectedActionCounter: 0,
      },
      "p1",
      0,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INVALID_ACTION");
    }
  });



  it("allows playing multi-biome cards into the understory row", () => {
    const multiBiomeUnderstoryCard = EXPANDED_DECK.find(
      (card) => card.biomes.includes("understory") && card.biomes[0] !== "understory",
    );

    expect(multiBiomeUnderstoryCard).toBeDefined();
    const gameWithSpecificHand = {
      ...game,
      handsByPlayerId: {
        ...game.handsByPlayerId,
        p1: [multiBiomeUnderstoryCard!.id],
      },
      tableauByPlayerId: {
        ...game.tableauByPlayerId,
        p1: {
          ...game.tableauByPlayerId.p1,
          understoryRow: [],
        },
      },
    };

    const result = applyMoveIntent(
      gameWithSpecificHand,
      {
        type: "playCard",
        cardId: multiBiomeUnderstoryCard!.id,
        rowId: "understoryRow",
        expectedTurn: 1,
        expectedActionCounter: 0,
      },
      "p1",
      0,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.tableauByPlayerId.p1.understoryRow).toContain(multiBiomeUnderstoryCard!.id);
      expect(result.state.handsByPlayerId.p1).toEqual([]);
    }
  });
  it("plays a card, then advances turn and action counter on valid intent", () => {
    const result = applyMoveIntent(
      game,
      {
        type: "playCard",
        cardId: game.handsByPlayerId.p1[0],
        rowId: rowForCard(game.handsByPlayerId.p1[0]),
        expectedTurn: 1,
        expectedActionCounter: 0,
      },
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
      const targetRow = result.state.tableauByPlayerId.p1[targetRowId];
      expect(targetRow[targetRow.length - 1]).toBe(game.handsByPlayerId.p1[0]);
    }
  });

  it("adds played cards to the bottom of an occupied row", () => {
    const cardId = game.handsByPlayerId.p1[0];
    const rowId = rowForCard(cardId);
    const gameWithExistingRow = {
      ...game,
      tableauByPlayerId: {
        ...game.tableauByPlayerId,
        p1: {
          ...game.tableauByPlayerId.p1,
          [rowId]: ["c0", "c1"],
        },
      },
    };

    const result = applyMoveIntent(
      gameWithExistingRow,
      {
        type: "playCard",
        cardId,
        rowId,
        expectedTurn: 1,
        expectedActionCounter: 0,
      },
      "p1",
      0,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.tableauByPlayerId.p1[rowId]).toEqual(["c0", "c1", cardId]);
    }
  });


  it("draw resolves oasis edge activations bottom-to-top with mixed abilities", () => {
    const drawAbilityCard = EXPANDED_DECK.find((card) => card.onActivate?.type === "drawCards");
    const gainSunCard = EXPANDED_DECK.find((card) => card.onActivate?.type === "gainSun");
    const noAbilityCard = EXPANDED_DECK.find((card) => !card.onActivate && card.biomes.includes("oasisEdge"));

    expect(drawAbilityCard).toBeDefined();
    expect(gainSunCard).toBeDefined();
    expect(noAbilityCard).toBeDefined();

    const gameWithRow = {
      ...game,
      deck: ["d1", "d2", "d3", "d4", ...game.deck],
      tableauByPlayerId: {
        ...game.tableauByPlayerId,
        p1: {
          ...game.tableauByPlayerId.p1,
          oasisEdgeRow: [drawAbilityCard!.id, noAbilityCard!.id, gainSunCard!.id],
        },
      },
    };

    const result = applyMoveIntent(
      gameWithRow,
      {
        type: "drawCard",
        expectedTurn: 1,
        expectedActionCounter: 0,
      },
      "p1",
      0,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.actionCounter).toBe(1);
      expect(result.animation?.activationSteps.map((step) => step.cardId)).toEqual([
        gainSunCard!.id,
        noAbilityCard!.id,
        drawAbilityCard!.id,
      ]);
      expect(result.animation?.activationSteps.map((step) => step.hasAbility)).toEqual([true, false, true]);
      expect(result.state.sunlightByPlayerId?.p1).toBe(2);
      expect(result.state.handsByPlayerId.p1.slice(-3)).toEqual(["d1", "d2", "d3"]);
      expect(result.state.deck[0]).toBe("d4");
    }
  });

  it("draws a card into the active player's hand without ending turn", () => {
    const result = applyMoveIntent(
      game,
      {
        type: "drawCard",
        expectedTurn: 1,
        expectedActionCounter: 0,
      },
      "p1",
      0,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.handsByPlayerId.p1.length).toBe(game.handsByPlayerId.p1.length + 1);
      expect(result.state.deck.length).toBe(game.deck.length - 1);
      expect(result.state.currentPlayerId).toBe("p1");
      expect(result.state.turn).toBe(1);
      expect(result.actionCounter).toBe(1);
    }
  });


  it("gains a sun token for the active player without ending turn", () => {
    const result = applyMoveIntent(
      game,
      {
        type: "gainSunToken",
        expectedTurn: 1,
        expectedActionCounter: 0,
      },
      "p1",
      0,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.sunlightByPlayerId?.p1).toBe(1);
      expect(result.state.currentPlayerId).toBe("p1");
      expect(result.state.turn).toBe(1);
      expect(result.actionCounter).toBe(1);
    }
  });

  it("rejects draw card when the deck is empty", () => {
    const emptyDeckGame = {
      ...game,
      deck: [],
    };

    const result = applyMoveIntent(
      emptyDeckGame,
      {
        type: "drawCard",
        expectedTurn: 1,
        expectedActionCounter: 0,
      },
      "p1",
      0,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INVALID_ACTION");
    }
  });


  it("takes a specific food token from cache into active player inventory", () => {
    const tokenAtIndexOne = game.foodCache[1];
    const result = applyMoveIntent(
      game,
      {
        type: "takeFoodToken",
        cacheIndex: 1,
        expectedTurn: 1,
        expectedActionCounter: 0,
      },
      "p1",
      0,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.foodByPlayerId?.p1).toEqual([tokenAtIndexOne]);
      expect(result.state.foodCache).toEqual(game.foodCache.filter((_, index) => index !== 1));
      expect(result.state.currentPlayerId).toBe("p1");
      expect(result.state.turn).toBe(1);
      expect(result.actionCounter).toBe(1);
    }
  });

  it("rejects taking a food token when cache index is out of bounds", () => {
    const result = applyMoveIntent(
      game,
      {
        type: "takeFoodToken",
        cacheIndex: game.foodCache.length,
        expectedTurn: 1,
        expectedActionCounter: 0,
      },
      "p1",
      0,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INVALID_ACTION");
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
      {
        type: "playCard",
        cardId: soloGame.handsByPlayerId.solo[0],
        rowId: rowForCard(soloGame.handsByPlayerId.solo[0]),
        expectedTurn: 1,
        expectedActionCounter: 0,
      },
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
