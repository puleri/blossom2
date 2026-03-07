import { describe, expect, it } from "vitest";
import { projectTurnGameState } from "../lib/game/projection";
import { EXPANDED_DECK } from "../lib/game/cards";
import type { TurnGameState } from "../lib/types";

const CARD_ONE = EXPANDED_DECK[0]?.id;
const CARD_TWO = EXPANDED_DECK[1]?.id;
const CARD_THREE = EXPANDED_DECK[2]?.id;

if (!CARD_ONE || !CARD_TWO || !CARD_THREE) {
  throw new Error("Test deck is missing required cards.");
}

describe("projectTurnGameState", () => {
  it("hydrates valid card IDs for viewer hand, tray, and tableau", () => {
    const state: TurnGameState = {
      gameId: "g-1",
      seed: 1,
      createdAt: "2024-01-01T00:00:00.000Z",
      players: {
        p1: { id: "p1", name: "P1" },
      },
      handsByPlayerId: {
        p1: [CARD_ONE],
      },
      tableauByPlayerId: {
        p1: {
          understoryRow: [CARD_TWO],
          oasisEdgeRow: [],
        },
      },
      playerOrder: ["p1"],
      currentPlayerId: "p1",
      turn: 1,
      deck: [CARD_THREE],
      tray: [CARD_THREE],
      foodCache: ["W", "M", "C", "T", "P"],
    };

    const projected = projectTurnGameState(state, "p1");

    expect(projected.players.p1.hand?.[0]?.id).toBe(CARD_ONE);
    expect(projected.players.p1.tableau.understoryRow[0]?.id).toBe(CARD_TWO);
    expect(projected.tray[0]?.id).toBe(CARD_THREE);
    expect(projected.diagnostics).toEqual([]);
  });

  it("drops unknown card IDs consistently and records diagnostics for hand, tray, and tableau", () => {
    const state: TurnGameState = {
      gameId: "g-2",
      seed: 2,
      createdAt: "2024-01-01T00:00:00.000Z",
      players: {
        p1: { id: "p1", name: "P1" },
      },
      handsByPlayerId: {
        p1: ["unknown-hand-card", CARD_ONE],
      },
      tableauByPlayerId: {
        p1: {
          understoryRow: ["unknown-tableau-card", CARD_TWO],
          oasisEdgeRow: [],
        },
      },
      playerOrder: ["p1"],
      currentPlayerId: "p1",
      turn: 1,
      deck: [CARD_THREE],
      tray: ["unknown-tray-card", CARD_THREE],
      foodCache: ["W", "M", "C", "T", "P"],
    };

    const projected = projectTurnGameState(state, "p1");

    expect(projected.players.p1.hand?.map((card) => card.id)).toEqual([CARD_ONE]);
    expect(projected.players.p1.tableau.understoryRow.map((card) => card.id)).toEqual([CARD_TWO]);
    expect(projected.tray.map((card) => card.id)).toEqual([CARD_THREE]);

    expect(projected.diagnostics).toEqual([
      {
        code: "UNKNOWN_CARD_ID",
        cardId: "unknown-tableau-card",
        source: "tableau",
        playerId: "p1",
        rowId: "understoryRow",
      },
      {
        code: "UNKNOWN_CARD_ID",
        cardId: "unknown-hand-card",
        source: "hand",
        playerId: "p1",
      },
      {
        code: "UNKNOWN_CARD_ID",
        cardId: "unknown-tray-card",
        source: "tray",
      },
    ]);
  });
});
