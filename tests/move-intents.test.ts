import { describe, expect, it } from "vitest";
import { applyMoveIntent, type MoveIntent } from "../lib/game/intents";
import { createGame } from "../lib/game/rules";
import type { TurnGameState } from "../lib/types";

function createThreePlayerGame(seed = 7): TurnGameState {
  return createGame(
    "game-1",
    [
      { id: "p1", name: "P1" },
      { id: "p2", name: "P2" },
      { id: "p3", name: "P3" },
    ],
    seed,
  );
}

describe("applyMoveIntent", () => {
  it("returns NOT_YOUR_TURN when actor is not active player", () => {
    const game = createThreePlayerGame();
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
    const game = createThreePlayerGame();
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

  it("returns INVALID_ACTION for an illegal action type", () => {
    const game = createThreePlayerGame();
    const result = applyMoveIntent(
      game,
      { actionType: "illegal-action" as MoveIntent["actionType"], expectedTurn: 1, expectedActionCounter: 0 },
      "p1",
      0,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INVALID_ACTION");
    }
  });

  it("enforces turn ownership and rejects out-of-order submissions across multiple turns", () => {
    let state = createThreePlayerGame();
    let actionCounter = 0;

    const firstMove = applyMoveIntent(
      state,
      { actionType: "pollinate", expectedTurn: 1, expectedActionCounter: 0 },
      "p1",
      actionCounter,
    );

    expect(firstMove.ok).toBe(true);
    if (!firstMove.ok) {
      return;
    }

    state = firstMove.state;
    actionCounter = firstMove.actionCounter;
    expect(state.turn).toBe(2);
    expect(state.currentPlayerId).toBe("p2");

    const outOfOrder = applyMoveIntent(
      state,
      { actionType: "root", expectedTurn: 2, expectedActionCounter: 1 },
      "p1",
      actionCounter,
    );
    expect(outOfOrder.ok).toBe(false);
    if (!outOfOrder.ok) {
      expect(outOfOrder.error.code).toBe("NOT_YOUR_TURN");
    }

    const legalSecondMove = applyMoveIntent(
      state,
      { actionType: "root", expectedTurn: 2, expectedActionCounter: 1 },
      "p2",
      actionCounter,
    );
    expect(legalSecondMove.ok).toBe(true);
    if (!legalSecondMove.ok) {
      return;
    }

    state = legalSecondMove.state;
    actionCounter = legalSecondMove.actionCounter;
    expect(state.turn).toBe(3);
    expect(state.currentPlayerId).toBe("p3");

    const staleReplay = applyMoveIntent(
      state,
      { actionType: "toTheSun", expectedTurn: 2, expectedActionCounter: 1 },
      "p3",
      actionCounter,
    );

    expect(staleReplay.ok).toBe(false);
    if (!staleReplay.ok) {
      expect(staleReplay.error.code).toBe("STALE_STATE");
    }
  });

  it("produces identical final state for same seed and action sequence (replay determinism)", () => {
    const actions = [
      { actor: "p1", actionType: "grow" as const },
      { actor: "p2", actionType: "root" as const },
      { actor: "p3", actionType: "pollinate" as const },
      { actor: "p1", actionType: "toTheSun" as const },
      { actor: "p2", actionType: "grow" as const },
    ];

    const runReplay = (seed: number) => {
      let state = createThreePlayerGame(seed);
      let actionCounter = 0;

      for (const action of actions) {
        const result = applyMoveIntent(
          state,
          {
            actionType: action.actionType,
            expectedTurn: state.turn,
            expectedActionCounter: actionCounter,
          },
          action.actor,
          actionCounter,
        );

        if (!result.ok) {
          throw new Error(`Replay failed for ${action.actor}:${action.actionType} with ${result.error.code}`);
        }

        state = result.state;
        actionCounter = result.actionCounter;
      }

      return { state, actionCounter };
    };

    const first = runReplay(23);
    const second = runReplay(23);

    expect(first).toEqual(second);
  });

  it("rejects duplicate concurrent-like submissions so maturity-style triggers cannot resolve twice", () => {
    const game = createThreePlayerGame();

    const accepted = applyMoveIntent(
      game,
      { actionType: "toTheSun", expectedTurn: 1, expectedActionCounter: 0 },
      "p1",
      0,
    );

    expect(accepted.ok).toBe(true);
    if (!accepted.ok) {
      return;
    }

    const duplicate = applyMoveIntent(
      accepted.state,
      { actionType: "toTheSun", expectedTurn: 1, expectedActionCounter: 0 },
      "p1",
      accepted.actionCounter,
    );

    expect(duplicate.ok).toBe(false);
    if (!duplicate.ok) {
      expect(duplicate.error.code).toBe("NOT_YOUR_TURN");
    }

    expect(accepted.state.lastAction).toBe("toTheSun");
    expect(accepted.actionCounter).toBe(1);
  });
});
