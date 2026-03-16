import { describe, expect, it } from "vitest";
import { createGame, getCanopySunGainAmount, getPlayerCanopySunGainAmount } from "../lib/game/rules";

describe("canopy sun gain progression", () => {
  it("maps canopy card counts to expected sun token gains", () => {
    expect(getCanopySunGainAmount(0)).toBe(2);
    expect(getCanopySunGainAmount(1)).toBe(2);
    expect(getCanopySunGainAmount(2)).toBe(3);
    expect(getCanopySunGainAmount(3)).toBe(3);
    expect(getCanopySunGainAmount(4)).toBe(4);
    expect(getCanopySunGainAmount(5)).toBe(4);
    expect(getCanopySunGainAmount(6)).toBe(5);
    expect(getCanopySunGainAmount(10)).toBe(5);
  });

  it("derives canopy gain from a player's canopy row", () => {
    const game = createGame(
      "game-canopy-gain",
      [
        { id: "p1", name: "Player One" },
        { id: "p2", name: "Player Two" },
      ],
      1,
    );

    const gameWithCanopy = {
      ...game,
      tableauByPlayerId: {
        ...game.tableauByPlayerId,
        p1: {
          ...game.tableauByPlayerId.p1,
          canopyRow: ["c1", "c2", "c3", "c4"],
        },
      },
    };

    expect(getPlayerCanopySunGainAmount(game, "p1")).toBe(2);
    expect(getPlayerCanopySunGainAmount(gameWithCanopy, "p1")).toBe(4);
  });
});
