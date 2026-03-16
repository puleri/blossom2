import { describe, expect, it, vi } from "vitest";
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
  it("plays a non-choice card, then advances turn and action counter on valid intent", () => {
    const turnEndingCard = game.handsByPlayerId.p1.find((cardId) => !cardById(cardId).onPlay);
    expect(turnEndingCard).toBeDefined();

    const result = applyMoveIntent(
      game,
      {
        type: "playCard",
        cardId: turnEndingCard!,
        rowId: rowForCard(turnEndingCard!),
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
      const targetRowId = rowForCard(turnEndingCard!);
      const targetRow = result.state.tableauByPlayerId.p1[targetRowId];
      expect(targetRow[targetRow.length - 1]).toBe(turnEndingCard);
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


  it("draw resolves oasis edge activations after draw selection is completed", () => {
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

    const firstDraw = applyMoveIntent(
      gameWithRow,
      {
        type: "drawCard",
        expectedTurn: 1,
        expectedActionCounter: 0,
      },
      "p1",
      0,
    );

    expect(firstDraw.ok).toBe(true);
    if (firstDraw.ok) {
      expect(firstDraw.actionCounter).toBe(1);
      expect(firstDraw.animation).toBeUndefined();
      expect(firstDraw.state.pendingDeckDraws).toEqual({ playerId: "p1", remaining: 1 });

      const result = applyMoveIntent(
        firstDraw.state,
        {
          type: "resolveOasisEdge",
          expectedTurn: 1,
          expectedActionCounter: 1,
        },
        "p1",
        1,
      );

      expect(result.ok).toBe(true);
      if (!result.ok) {
        return;
      }

      expect(result.actionCounter).toBe(2);
      expect(result.animation?.activationSteps.map((step) => step.cardId)).toEqual([
        gainSunCard!.id,
        noAbilityCard!.id,
        drawAbilityCard!.id,
      ]);
      expect(result.animation?.activationSteps.map((step) => step.hasAbility)).toEqual([true, false, true]);
      expect(result.state.sunlightByPlayerId?.p1).toBe(2);
      expect(result.state.handsByPlayerId.p1.slice(-2)).toEqual(["d2", "d3"]);
      expect(result.state.tray[0]).toBe("d4");
      expect(result.state.currentPlayerId).toBe("p2");
      expect(result.state.turn).toBe(2);
    }
  });

  it("draw resolves group benefit by granting all players resources and extra to actor", () => {
    const groupBenefitCard = EXPANDED_DECK.find(
      (card) =>
        card.onActivate?.type === "groupBenefit"
        && card.onActivate.effect.allPlayersGain.resource === "pollinator"
        && card.onActivate.effect.allPlayersGain.amount === 1
        && card.onActivate.effect.youGain.resource === "pollinator"
        && card.onActivate.effect.youGain.amount === 2,
    );

    expect(groupBenefitCard).toBeDefined();

    const gameWithGroupBenefit = {
      ...game,
      deck: ["d1", ...game.deck],
      tableauByPlayerId: {
        ...game.tableauByPlayerId,
        p1: {
          ...game.tableauByPlayerId.p1,
          oasisEdgeRow: [groupBenefitCard!.id],
        },
      },
    };

    const result = applyMoveIntent(
      gameWithGroupBenefit,
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
      expect(result.state.foodByPlayerId?.p1).toEqual(["P", "P", "P"]);
      expect(result.state.foodByPlayerId?.p2).toEqual(["P"]);
    }
  });

  it("draws a card into the active player's hand and ends turn when draw quota is completed", () => {
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
      expect(result.state.deck.length).toBe(game.deck.length - 4);
      expect(result.state.tray).toHaveLength(3);
      expect(result.state.currentPlayerId).toBe("p2");
      expect(result.state.turn).toBe(2);
      expect(result.actionCounter).toBe(1);
      expect(result.state.pendingDeckDraws).toBeNull();
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

  it("gain sun resolves canopy activations bottom-to-top with mixed abilities", () => {
    const drawAbilityCard = EXPANDED_DECK.find((card) => card.onActivate?.type === "drawCards" && card.biomes.includes("canopy"));
    const gainSunCard = EXPANDED_DECK.find((card) => card.onActivate?.type === "gainSun" && card.biomes.includes("canopy"));
    const noAbilityCard = EXPANDED_DECK.find((card) => !card.onActivate && card.biomes.includes("canopy"));
    const drawAmount = drawAbilityCard?.onActivate?.type === "drawCards" ? drawAbilityCard.onActivate.effect.draw : 0;

    expect(drawAbilityCard).toBeDefined();
    expect(gainSunCard).toBeDefined();
    expect(noAbilityCard).toBeDefined();

    const gameWithRow = {
      ...game,
      deck: ["d1", "d2", ...game.deck],
      tableauByPlayerId: {
        ...game.tableauByPlayerId,
        p1: {
          ...game.tableauByPlayerId.p1,
          canopyRow: [drawAbilityCard!.id, noAbilityCard!.id, gainSunCard!.id],
        },
      },
    };

    const result = applyMoveIntent(
      gameWithRow,
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
      expect(result.actionCounter).toBe(1);
      expect(result.animation?.activationSteps.map((step) => step.cardId)).toEqual([
        gainSunCard!.id,
        noAbilityCard!.id,
        drawAbilityCard!.id,
      ]);
      expect(result.animation?.activationSteps.map((step) => step.rowId)).toEqual([
        "canopyRow",
        "canopyRow",
        "canopyRow",
      ]);
      expect(result.animation?.activationSteps.map((step) => step.hasAbility)).toEqual([true, false, true]);
      expect(result.state.sunlightByPlayerId?.p1).toBe(1 + (gainSunCard!.onActivate?.type === "gainSun" ? gainSunCard!.onActivate.effect.amount : 0));
      expect(result.state.handsByPlayerId.p1.slice(-drawAmount)).toEqual(gameWithRow.deck.slice(0, drawAmount));
      expect(result.state.deck[0]).toBe(gameWithRow.deck[drawAmount]);
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

  it("allows multiple deck draws before oasis edge resolution when row has enough cards", () => {
    const gameWithTwoOasisCards = {
      ...game,
      deck: ["d1", "d2", "d3", ...game.deck],
      tableauByPlayerId: {
        ...game.tableauByPlayerId,
        p1: {
          ...game.tableauByPlayerId.p1,
          oasisEdgeRow: ["o1", "o2"],
        },
      },
    };

    const firstDraw = applyMoveIntent(
      gameWithTwoOasisCards,
      {
        type: "drawCard",
        expectedTurn: 1,
        expectedActionCounter: 0,
      },
      "p1",
      0,
    );

    expect(firstDraw.ok).toBe(true);
    if (!firstDraw.ok) {
      return;
    }

    expect(firstDraw.state.turn).toBe(1);
    expect(firstDraw.state.currentPlayerId).toBe("p1");
    expect(firstDraw.state.pendingDeckDraws).toEqual({ playerId: "p1", remaining: 1 });
    expect(firstDraw.animation).toBeUndefined();

    const secondDraw = applyMoveIntent(
      firstDraw.state,
      {
        type: "drawCard",
        expectedTurn: 1,
        expectedActionCounter: 1,
      },
      "p1",
      1,
    );

    expect(secondDraw.ok).toBe(true);
    if (secondDraw.ok) {
      expect(secondDraw.state.turn).toBe(2);
      expect(secondDraw.state.currentPlayerId).toBe("p2");
      expect(secondDraw.state.pendingDeckDraws).toBeNull();
      expect(secondDraw.state.handsByPlayerId.p1.slice(-2)).toEqual(["d1", "d2"]);
      expect(secondDraw.state.tray[0]).toBe("d3");
      expect(secondDraw.animation).toBeDefined();
    }
  });

  it("blocks non-draw actions while additional deck draws are pending", () => {
    const gameWithTwoOasisCards = {
      ...game,
      tableauByPlayerId: {
        ...game.tableauByPlayerId,
        p1: {
          ...game.tableauByPlayerId.p1,
          oasisEdgeRow: ["o1", "o2"],
        },
      },
    };

    const firstDraw = applyMoveIntent(
      gameWithTwoOasisCards,
      {
        type: "drawCard",
        expectedTurn: 1,
        expectedActionCounter: 0,
      },
      "p1",
      0,
    );

    expect(firstDraw.ok).toBe(true);
    if (!firstDraw.ok) {
      return;
    }

    const blocked = applyMoveIntent(
      firstDraw.state,
      {
        type: "gainSunToken",
        expectedTurn: 1,
        expectedActionCounter: 1,
      },
      "p1",
      1,
    );

    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.error.code).toBe("INVALID_ACTION");
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
      expect(result.state.currentPlayerId).toBe("p2");
      expect(result.state.turn).toBe(2);
      expect(result.state.pendingFoodGains).toBeNull();
      expect(result.actionCounter).toBe(1);
    }
  });

  it("rejects non-food actions while additional food gains are pending", () => {
    const gameWithTwoUnderstoryCards = {
      ...game,
      tableauByPlayerId: {
        ...game.tableauByPlayerId,
        p1: {
          ...game.tableauByPlayerId.p1,
          understoryRow: ["u1", "u2"],
        },
      },
    };

    const firstTake = applyMoveIntent(
      gameWithTwoUnderstoryCards,
      {
        type: "takeFoodToken",
        cacheIndex: 0,
        expectedTurn: 1,
        expectedActionCounter: 0,
      },
      "p1",
      0,
    );

    expect(firstTake.ok).toBe(true);
    if (!firstTake.ok) {
      return;
    }

    const blocked = applyMoveIntent(
      firstTake.state,
      {
        type: "drawCard",
        expectedTurn: 1,
        expectedActionCounter: 1,
      },
      "p1",
      1,
    );

    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.error.code).toBe("INVALID_ACTION");
    }
  });

  it("allows multiple food takes before ending turn when understory has enough cards", () => {
    const gameWithTwoUnderstoryCards = {
      ...game,
      tableauByPlayerId: {
        ...game.tableauByPlayerId,
        p1: {
          ...game.tableauByPlayerId.p1,
          understoryRow: ["u1", "u2"],
        },
      },
    };

    const firstTake = applyMoveIntent(
      gameWithTwoUnderstoryCards,
      {
        type: "takeFoodToken",
        cacheIndex: 0,
        expectedTurn: 1,
        expectedActionCounter: 0,
      },
      "p1",
      0,
    );

    expect(firstTake.ok).toBe(true);
    if (!firstTake.ok) {
      return;
    }

    expect(firstTake.state.turn).toBe(1);
    expect(firstTake.state.currentPlayerId).toBe("p1");
    expect(firstTake.state.pendingFoodGains).toEqual({
      playerId: "p1",
      remaining: 1,
    });

    const secondTake = applyMoveIntent(
      firstTake.state,
      {
        type: "takeFoodToken",
        cacheIndex: 0,
        expectedTurn: 1,
        expectedActionCounter: 1,
      },
      "p1",
      1,
    );

    expect(secondTake.ok).toBe(true);
    if (secondTake.ok) {
      expect(secondTake.state.turn).toBe(2);
      expect(secondTake.state.currentPlayerId).toBe("p2");
      expect(secondTake.state.pendingFoodGains).toBeNull();
      expect(secondTake.state.foodByPlayerId?.p1).toHaveLength(2);
    }
  });

  it("take food resolves understory activations bottom-to-top with mixed abilities", () => {
    const drawAbilityCard = EXPANDED_DECK.find((card) => card.onActivate?.type === "drawCards" && card.biomes.includes("understory"));
    const gainSunCard = EXPANDED_DECK.find((card) => card.onActivate?.type === "gainSun" && card.biomes.includes("understory"));
    const noAbilityCard = EXPANDED_DECK.find((card) => !card.onActivate && card.biomes.includes("understory"));
    const drawAmount = drawAbilityCard?.onActivate?.type === "drawCards" ? drawAbilityCard.onActivate.effect.draw : 0;

    expect(drawAbilityCard).toBeDefined();
    expect(gainSunCard).toBeDefined();
    expect(noAbilityCard).toBeDefined();

    const gameWithRow = {
      ...game,
      deck: ["d1", "d2", ...game.deck],
      tableauByPlayerId: {
        ...game.tableauByPlayerId,
        p1: {
          ...game.tableauByPlayerId.p1,
          understoryRow: [drawAbilityCard!.id, noAbilityCard!.id, gainSunCard!.id],
        },
      },
    };

    const firstTake = applyMoveIntent(
      gameWithRow,
      {
        type: "takeFoodToken",
        cacheIndex: 0,
        expectedTurn: 1,
        expectedActionCounter: 0,
      },
      "p1",
      0,
    );

    expect(firstTake.ok).toBe(true);
    if (!firstTake.ok) {
      return;
    }

    expect(firstTake.actionCounter).toBe(1);
    expect(firstTake.animation).toBeUndefined();
    expect(firstTake.state.foodByPlayerId?.p1).toEqual([gameWithRow.foodCache[0]]);
    expect(firstTake.state.currentPlayerId).toBe("p1");
    expect(firstTake.state.turn).toBe(1);
    expect(firstTake.state.pendingFoodGains).toEqual({ playerId: "p1", remaining: 1 });

    const result = applyMoveIntent(
      firstTake.state,
      {
        type: "activateUnderstory",
        expectedTurn: 1,
        expectedActionCounter: 1,
      },
      "p1",
      1,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.actionCounter).toBe(2);
      expect(result.animation?.activationSteps.map((step) => step.cardId)).toEqual([
        gainSunCard!.id,
        noAbilityCard!.id,
        drawAbilityCard!.id,
      ]);
      expect(result.animation?.activationSteps.map((step) => step.rowId)).toEqual([
        "understoryRow",
        "understoryRow",
        "understoryRow",
      ]);
      expect(result.animation?.activationSteps.map((step) => step.hasAbility)).toEqual([true, false, true]);
      expect(result.state.sunlightByPlayerId?.p1).toBe(gainSunCard!.onActivate?.type === "gainSun" ? gainSunCard!.onActivate.effect.amount : 0);
      expect(result.state.handsByPlayerId.p1.slice(-drawAmount)).toEqual(gameWithRow.deck.slice(0, drawAmount));
      expect(result.state.tray[0]).toBe(gameWithRow.deck[drawAmount]);
      expect(result.state.currentPlayerId).toBe("p2");
      expect(result.state.turn).toBe(2);
      expect(result.state.pendingFoodGains).toBeNull();
    }
  });



  it("allows rerolling food cache during food selection phase", () => {
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);
    const gameWithTwoUnderstoryCards = {
      ...game,
      foodCache: ["P", "P", "P", "P", "P"] as const,
      tableauByPlayerId: {
        ...game.tableauByPlayerId,
        p1: {
          ...game.tableauByPlayerId.p1,
          understoryRow: ["u1", "u2"],
        },
      },
    };

    const firstTake = applyMoveIntent(
      gameWithTwoUnderstoryCards,
      {
        type: "takeFoodToken",
        cacheIndex: 0,
        expectedTurn: 1,
        expectedActionCounter: 0,
      },
      "p1",
      0,
    );

    expect(firstTake.ok).toBe(true);
    if (!firstTake.ok) {
      randomSpy.mockRestore();
      return;
    }

    const rerolled = applyMoveIntent(
      firstTake.state,
      {
        type: "rerollFoodCache",
        expectedTurn: 1,
        expectedActionCounter: 1,
      },
      "p1",
      1,
    );

    expect(rerolled.ok).toBe(true);
    if (rerolled.ok) {
      expect(rerolled.state.foodCache).toEqual(["W", "W", "W", "W", "W"]);
      expect(rerolled.state.pendingFoodGains).toEqual({ playerId: "p1", remaining: 1 });
      expect(rerolled.state.turn).toBe(1);
      expect(rerolled.state.currentPlayerId).toBe("p1");
    }

    randomSpy.mockRestore();
  });

  it("activates understory manually after selecting fewer food tokens than allowed", () => {
    const drawAbilityCard = EXPANDED_DECK.find((card) => card.onActivate?.type === "drawCards" && card.biomes.includes("understory"));
    expect(drawAbilityCard).toBeDefined();

    const gameWithTwoUnderstoryCards = {
      ...game,
      deck: ["d1", ...game.deck],
      tableauByPlayerId: {
        ...game.tableauByPlayerId,
        p1: {
          ...game.tableauByPlayerId.p1,
          understoryRow: [drawAbilityCard!.id, "u2"],
        },
      },
    };

    const firstTake = applyMoveIntent(
      gameWithTwoUnderstoryCards,
      {
        type: "takeFoodToken",
        cacheIndex: 0,
        expectedTurn: 1,
        expectedActionCounter: 0,
      },
      "p1",
      0,
    );

    expect(firstTake.ok).toBe(true);
    if (!firstTake.ok) {
      return;
    }

    expect(firstTake.state.pendingFoodGains).toEqual({ playerId: "p1", remaining: 1 });
    expect(firstTake.animation).toBeUndefined();

    const activated = applyMoveIntent(
      firstTake.state,
      {
        type: "activateUnderstory",
        expectedTurn: 1,
        expectedActionCounter: 1,
      },
      "p1",
      1,
    );

    expect(activated.ok).toBe(true);
    if (activated.ok) {
      expect(activated.state.pendingFoodGains).toBeNull();
      expect(activated.state.turn).toBe(2);
      expect(activated.state.currentPlayerId).toBe("p2");
      expect(activated.animation?.activationSteps.map((step) => step.rowId)).toEqual(["understoryRow", "understoryRow"]);
    }
  });

  it("rerolls food cache when it is empty", () => {
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);

    const result = applyMoveIntent(
      {
        ...game,
        foodCache: [],
      },
      {
        type: "rerollFoodCache",
        expectedTurn: 1,
        expectedActionCounter: 0,
      },
      "p1",
      0,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.foodCache).toEqual(["W", "W", "W", "W", "W"]);
      expect(result.state.currentPlayerId).toBe("p1");
      expect(result.state.turn).toBe(1);
      expect(result.actionCounter).toBe(1);
    }

    randomSpy.mockRestore();
  });

  it("rerolls food cache when all tokens are the same type", () => {
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.2);

    const result = applyMoveIntent(
      {
        ...game,
        foodCache: ["P", "P", "P", "P", "P"],
      },
      {
        type: "rerollFoodCache",
        expectedTurn: 1,
        expectedActionCounter: 0,
      },
      "p1",
      0,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.foodCache).toEqual(["M", "M", "M", "M", "M"]);
    }

    randomSpy.mockRestore();
  });

  it("rejects rerolling food cache when it has multiple food types", () => {
    const result = applyMoveIntent(
      game,
      {
        type: "rerollFoodCache",
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


  it("plays on-play choice cards by opening a pending choice instead of ending turn", () => {
    const choiceCard = EXPANDED_DECK.find((card) => card.onPlay?.effects.some((effect) => effect.type === "choice"));
    expect(choiceCard).toBeDefined();

    const gameWithChoiceCard = {
      ...game,
      handsByPlayerId: {
        ...game.handsByPlayerId,
        p1: [choiceCard!.id],
      },
      tableauByPlayerId: {
        ...game.tableauByPlayerId,
        p1: {
          ...game.tableauByPlayerId.p1,
          [rowForCard(choiceCard!.id)]: [],
        },
      },
    };

    const result = applyMoveIntent(
      gameWithChoiceCard,
      {
        type: "playCard",
        cardId: choiceCard!.id,
        rowId: rowForCard(choiceCard!.id),
        expectedTurn: 1,
        expectedActionCounter: 0,
      },
      "p1",
      0,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.pendingChoice?.cardId).toBe(choiceCard!.id);
      expect(result.state.currentPlayerId).toBe("p1");
      expect(result.state.turn).toBe(1);
    }
  });

  it("resolves on-play choice and then ends turn", () => {
    const choiceCard = EXPANDED_DECK.find((card) => card.onPlay?.effects.some((effect) => effect.type === "choice"));
    expect(choiceCard).toBeDefined();

    const played = applyMoveIntent(
      {
        ...game,
        handsByPlayerId: {
          ...game.handsByPlayerId,
          p1: [choiceCard!.id],
        },
      },
      {
        type: "playCard",
        cardId: choiceCard!.id,
        rowId: rowForCard(choiceCard!.id),
        expectedTurn: 1,
        expectedActionCounter: 0,
      },
      "p1",
      0,
    );

    expect(played.ok).toBe(true);
    if (!played.ok) {
      return;
    }

    const resolved = applyMoveIntent(
      played.state,
      {
        type: "resolveChoice",
        optionIndex: 1,
        expectedTurn: 1,
        expectedActionCounter: 1,
      },
      "p1",
      1,
    );

    expect(resolved.ok).toBe(true);
    if (resolved.ok) {
      expect(resolved.state.pendingChoice).toBeNull();
      expect(resolved.state.sunlightByPlayerId?.p1).toBe(1);
      expect(resolved.state.currentPlayerId).toBe("p2");
      expect(resolved.state.turn).toBe(2);
    }
  });

  it("blocks other actions while a choice is pending", () => {
    const pendingChoiceState = {
      ...game,
      pendingChoice: {
        playerId: "p1",
        cardId: "moon-willow-2-1",
        trigger: "onPlay" as const,
        options: [
          {
            label: "Gain 1 sunlight",
            effects: [{ type: "gainSunlight" as const, amount: 1 }],
          },
        ],
        remainingEffects: [],
      },
    };

    const result = applyMoveIntent(
      pendingChoiceState,
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

  it("does not refill tray after taking a tray card until next upkeep", () => {
    const beforeTakeDeck = game.deck.length;
    const beforeTakeTray = game.tray.length;
    const taken = takeTrayCard(game, 1);

    expect(taken.card).not.toBeNull();
    expect(taken.game.tray).toHaveLength(beforeTakeTray - 1);
    expect(taken.game.deck).toHaveLength(beforeTakeDeck);
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
  it("allows drawing from the plant cache tray without refilling until next turn", () => {
    const startGame = createGame(
      "tray-draw-game",
      [
        { id: "p1", name: "P1" },
        { id: "p2", name: "P2" },
      ],
      11,
    );
    const gameWithPendingDraw = {
      ...startGame,
      tableauByPlayerId: {
        ...startGame.tableauByPlayerId,
        p1: {
          ...startGame.tableauByPlayerId.p1,
          oasisEdgeRow: ["o1", "o2"],
        },
      },
    };

    const trayCard = gameWithPendingDraw.tray[0];
    const result = applyMoveIntent(
      gameWithPendingDraw,
      {
        type: "drawCard",
        trayIndex: 0,
        expectedTurn: 1,
        expectedActionCounter: 0,
      },
      "p1",
      0,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.state.handsByPlayerId.p1).toContain(trayCard);
    expect(result.state.tray).toHaveLength(gameWithPendingDraw.tray.length - 1);
    expect(result.state.pendingDeckDraws).toEqual({ playerId: "p1", remaining: 1 });
  });

});
