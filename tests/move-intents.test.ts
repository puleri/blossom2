import { describe, expect, it } from "vitest";
import { applyMoveIntent } from "../lib/game/intents";
import { createGame } from "../lib/game/rules";

const game = createGame(
  "game-1",
  [
    { id: "p1", name: "P1" },
    { id: "p2", name: "P2" },
  ],
  7,
);

describe("applyMoveIntent", () => {
  it("returns NOT_YOUR_TURN when actor is not active player", () => {
    const result = applyMoveIntent(
      game,
      { actionType: "grow", expectedTurn: 1, expectedActionCounter: 0 },
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
      { actionType: "grow", expectedTurn: 1, expectedActionCounter: 0 },
      "p1",
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("STALE_STATE");
    }
  });

  it("advances turn and action counter on valid intent", () => {
    const result = applyMoveIntent(
      game,
      { actionType: "pollinate", expectedTurn: 1, expectedActionCounter: 0 },
      "p1",
      0,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.turn).toBe(2);
      expect(result.state.currentPlayerId).toBe("p2");
      expect(result.actionCounter).toBe(1);
      expect(result.state.lastAction).toBe("pollinate");
    }
  });
});
