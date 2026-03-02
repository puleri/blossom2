import { describe, expect, test } from "vitest";
import { activate, createGame, grow } from "../lib/game/rules";

describe("rules", () => {
  test("grow spends resources and adds to tableau", () => {
    const game = createGame("t1");
    const before = game.players[0].resources.dew;
    const cardId = game.players[0].hand[0].id;
    const updated = grow(game, "p1", cardId);

    expect(updated.players[0].tableau.cavern.length).toBe(1);
    expect(updated.players[0].resources.dew).toBeLessThanOrEqual(before);
  });

  test("activation advances turn", () => {
    const game = createGame("t2");
    const updated = activate(game, "p1", "pollinate");
    expect(updated.turn).toBe(2);
    expect(updated.currentPlayerId).toBe("p2");
  });
});
