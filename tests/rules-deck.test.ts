import { describe, expect, it, vi } from "vitest";
import { EXPANDED_DECK } from "../lib/game/cards";
import { createGame, endTurn, getUnderstoryFoodGainAmount } from "../lib/game/rules";

describe("createGame deck setup", () => {
  it("shuffles deterministically for the same seed", () => {
    const players = [
      { id: "p1", name: "P1" },
      { id: "p2", name: "P2" },
    ];

    const gameA = createGame("g1", players, 42);
    const gameB = createGame("g2", players, 42);

    const sequenceA = [...gameA.handsByPlayerId.p1, ...gameA.handsByPlayerId.p2, ...gameA.tray, ...gameA.deck].map((c) => c.id);
    const sequenceB = [...gameB.handsByPlayerId.p1, ...gameB.handsByPlayerId.p2, ...gameB.tray, ...gameB.deck].map((c) => c.id);

    expect(sequenceA).toEqual(sequenceB);
  });

  it("scales opening deal correctly for 4 players", () => {
    const players = [
      { id: "p1", name: "P1" },
      { id: "p2", name: "P2" },
      { id: "p3", name: "P3" },
      { id: "p4", name: "P4" },
    ];

    const game = createGame("g1", players, 7);
    const dealt = Object.values(game.handsByPlayerId).reduce((sum, hand) => sum + hand.length, 0);
    const total = dealt + game.tray.length + game.deck.length;

    expect(dealt).toBe(players.length * 2);
    expect(game.tray).toHaveLength(3);
    expect(total).toBe(EXPANDED_DECK.length);
  });

  it("rolls five letter food tokens during setup", () => {
    const players = [
      { id: "p1", name: "P1" },
      { id: "p2", name: "P2" },
    ];

    const game = createGame("g1", players, 42);

    expect(game.foodCache).toHaveLength(5);
    expect(game.foodCache.every((token) => ["W", "M", "C", "T", "P"].includes(token))).toBe(true);
  });

  it("automatically rerolls food when the cache has one food type", () => {
    const players = [
      { id: "p1", name: "P1" },
      { id: "p2", name: "P2" },
    ];
    const game = createGame("g1", players, 42);
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.4);

    const next = endTurn({ ...game, foodCache: ["W", "W", "W", "W", "W"] });

    expect(next.foodCache).toEqual(["C", "C", "C", "C", "C"]);
    randomSpy.mockRestore();
  });



  it("refills the plant cache tray from deck at the start of next turn", () => {
    const players = [
      { id: "p1", name: "P1" },
      { id: "p2", name: "P2" },
    ];

    const game = createGame("g1", players, 42);
    const trayAfterPick = game.tray.slice(0, 1);
    const next = endTurn({ ...game, tray: trayAfterPick });

    expect(next.tray).toHaveLength(3);
    expect(next.deck.length).toBe(game.deck.length - 3);
  });
  it("automatically rerolls food when the cache is empty", () => {
    const players = [
      { id: "p1", name: "P1" },
      { id: "p2", name: "P2" },
    ];
    const game = createGame("g1", players, 42);
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);

    const next = endTurn({ ...game, foodCache: [] });

    expect(next.foodCache).toEqual(["W", "W", "W", "W", "W"]);
    randomSpy.mockRestore();
  });
});


describe("getUnderstoryFoodGainAmount", () => {
  it("scales food gains by understory card count", () => {
    expect(getUnderstoryFoodGainAmount(0)).toBe(1);
    expect(getUnderstoryFoodGainAmount(1)).toBe(1);
    expect(getUnderstoryFoodGainAmount(2)).toBe(2);
    expect(getUnderstoryFoodGainAmount(3)).toBe(2);
    expect(getUnderstoryFoodGainAmount(4)).toBe(3);
    expect(getUnderstoryFoodGainAmount(5)).toBe(3);
    expect(getUnderstoryFoodGainAmount(6)).toBe(4);
    expect(getUnderstoryFoodGainAmount(7)).toBe(4);
  });
});
