import { describe, it } from 'vitest';

describe('rules: right-to-left activation order', () => {
  it.todo('activates root row right-to-left (right-most plant first)');
  it.todo('activates toTheSun row right-to-left (right-most plant first)');
  it.todo('activates pollinate row right-to-left (right-most plant first)');
});

describe('rules: onMature trigger de-duplication', () => {
  it.todo('fires onMature exactly once when sunlight first reaches capacity');
  it.todo('does not fire onMature again across repeated toTheSun actions after maturity');
});

describe('rules: invalid turns/actions', () => {
  it.todo('rejects action from a non-current player');
  it.todo('rejects grow when resources are insufficient');
  it.todo('rejects grow when card is missing from player hand');
});

describe('rules: draw/deck exhaustion behavior', () => {
  it.todo('draws only available cards when deck has fewer cards than requested');
  it.todo('handles empty deck/tray without throwing and without negative counts');
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
