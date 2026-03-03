import { describe, expect, it } from "vitest";
import { getDisplayPlayerOrder } from "../app/oasis/[gameId]/player-order";

describe("getDisplayPlayerOrder", () => {
  it("returns original order when current uid is absent", () => {
    expect(getDisplayPlayerOrder(["p1", "p2", "p3"], null)).toEqual(["p1", "p2", "p3"]);
    expect(getDisplayPlayerOrder(["p1", "p2", "p3"], "p9")).toEqual(["p1", "p2", "p3"]);
  });

  it("keeps order when current uid is already first", () => {
    expect(getDisplayPlayerOrder(["p2", "p1", "p3"], "p2")).toEqual(["p2", "p1", "p3"]);
  });

  it("moves current uid to front while preserving relative order", () => {
    expect(getDisplayPlayerOrder(["p1", "p2", "p3", "p4"], "p3")).toEqual(["p3", "p1", "p2", "p4"]);
  });
});
