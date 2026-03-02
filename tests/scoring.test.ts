import { describe, expect, it } from "vitest";
import { aggregateFinalScoring, scorePlayer } from "../lib/game/scoring";
import type { GameState, PlayerState } from "../lib/types";

describe("scorePlayer", () => {
  it("aggregates base points, tucked cards, sunlight scoring, and bonuses", () => {
    const player: PlayerState = {
      id: "p1",
      plants: [
        { id: "a", points: 5, tuckedCards: 2, sunlightTokens: 3, bonusPoints: 1 },
        { id: "b", points: 2, tuckedCards: 1, sunlightTokens: 4, bonusPoints: 0 },
      ],
    };

    expect(scorePlayer(player)).toEqual({
      playerId: "p1",
      basePoints: 7,
      tuckedCards: 3,
      sunlightPoints: 3,
      bonusPoints: 1,
      total: 14,
    });
  });
});

describe("aggregateFinalScoring", () => {
  it("breaks ties by sunlight points", () => {
    const state = {
      players: [
        { id: "p1", plants: [{ id: "a", points: 10, tuckedCards: 0, sunlightTokens: 0 }] },
        { id: "p2", plants: [{ id: "b", points: 8, tuckedCards: 0, sunlightTokens: 4 }] },
      ],
    } as GameState;

    const scored = aggregateFinalScoring(state);
    expect(scored[0].playerId).toBe("p2");
    expect(scored[1].playerId).toBe("p1");
  });
});
