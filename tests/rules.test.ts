import { describe, expect, it } from "vitest";
import { applyAction } from "../lib/game/rules";
import type { GameState } from "../lib/types";

function makeState(partial: Partial<GameState> = {}): GameState {
  return {
    players: [
      { id: "a", plants: [{ id: "a1", points: 5, tuckedCards: 1, sunlightTokens: 2, bonusPoints: 1 }] },
      { id: "b", plants: [{ id: "b1", points: 4, tuckedCards: 2, sunlightTokens: 4, bonusPoints: 0 }] },
    ],
    deckCount: 5,
    discardCount: 0,
    currentTurn: 0,
    maxTurns: 10,
    isFinished: false,
    winnerId: null,
    scoringBreakdown: [],
    ...partial,
  };
}

describe("applyAction endgame checks", () => {
  it("finishes the game when deck is exhausted", () => {
    const next = applyAction(makeState({ deckCount: 1 }), "pollinate");

    expect(next.isFinished).toBe(true);
    expect(next.winnerId).toBe("b");
    expect(next.scoringBreakdown.length).toBe(2);
  });

  it("finishes the game when turn limit is reached", () => {
    const next = applyAction(makeState({ currentTurn: 9, maxTurns: 10 }), "grow");

    expect(next.isFinished).toBe(true);
    expect(next.winnerId).toBe("b");
  });

  it("uses deterministic player id tie-break when totals and sunlight are equal", () => {
    const tiedState = makeState({
      players: [
        { id: "alpha", plants: [{ id: "x", points: 6, tuckedCards: 0, sunlightTokens: 2, bonusPoints: 0 }] },
        { id: "beta", plants: [{ id: "y", points: 6, tuckedCards: 0, sunlightTokens: 2, bonusPoints: 0 }] },
      ],
      currentTurn: 9,
      maxTurns: 10,
    });

    const next = applyAction(tiedState, "grow");
    expect(next.winnerId).toBe("alpha");
  });
});
