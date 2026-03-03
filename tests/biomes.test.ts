import { describe, expect, it } from "vitest";
import {
  biomeForRow,
  biomeLabel,
  rowDisplayName,
  rowIdForAction,
  rowIdForBiome,
} from "../lib/game/biome-naming";
import { ACTIVATION_ROW_METADATA, BIOME_METADATA } from "../lib/types";

describe("biome/action canonical naming", () => {
  it("maps root action to the Understory row and label", () => {
    const rowId = rowIdForAction("root");

    expect(rowId).toBe("understoryRow");
    expect(biomeForRow(rowId)).toBe("understory");
    expect(rowDisplayName(rowId)).toBe("Understory");
  });

  it("maps toTheSun action to the Oasis Edge row and label", () => {
    const rowId = rowIdForAction("toTheSun");

    expect(rowId).toBe("oasisEdgeRow");
    expect(biomeForRow(rowId)).toBe("oasisEdge");
    expect(rowDisplayName(rowId)).toBe("Oasis Edge");
  });

  it("maps pollinate action to the Meadow row and label", () => {
    const rowId = rowIdForAction("pollinate");

    expect(rowId).toBe("meadowRow");
    expect(biomeForRow(rowId)).toBe("meadow");
    expect(rowDisplayName(rowId)).toBe("Meadow");
  });

  it("keeps grow placement targeting the Canopy biome", () => {
    expect(rowIdForBiome("canopy")).toBeNull();
    expect(biomeLabel("canopy")).toBe("Canopy");
  });
});

describe("serialized game state and action logs use canonical names", () => {
  it("serializes game-state biome keys with canonical names only", () => {
    const serializedState = JSON.stringify({
      players: {
        p1: {
          tableau: {
            understory: ["card-u"],
            oasisEdge: ["card-o"],
            meadow: ["card-m"],
            canopy: ["card-c"],
          },
        },
      },
    }).toLowerCase();

    expect(serializedState).toContain("understory");
    expect(serializedState).toContain("oasisedge");
    expect(serializedState).toContain("meadow");
    expect(serializedState).toContain("canopy");
    expect(serializedState).not.toContain("cavern");
    expect(serializedState).not.toContain("grove");
    expect(serializedState).not.toContain("glade");
  });

  it("serializes action-log payloads with canonical display labels", () => {
    const activateRootRow = rowIdForAction("root");
    const activateToTheSunRow = rowIdForAction("toTheSun");
    const activatePollinateRow = rowIdForAction("pollinate");

    const serializedLogs = JSON.stringify([
      {
        type: "grow",
        biome: "canopy",
        biomeLabel: biomeLabel("canopy"),
      },
      {
        type: "activate",
        rowId: activateRootRow,
        rowLabel: rowDisplayName(activateRootRow),
        biome: biomeForRow(activateRootRow),
        biomeLabel: biomeLabel(biomeForRow(activateRootRow)),
      },
      {
        type: "activate",
        rowId: activateToTheSunRow,
        rowLabel: rowDisplayName(activateToTheSunRow),
        biome: biomeForRow(activateToTheSunRow),
        biomeLabel: biomeLabel(biomeForRow(activateToTheSunRow)),
      },
      {
        type: "activate",
        rowId: activatePollinateRow,
        rowLabel: rowDisplayName(activatePollinateRow),
        biome: biomeForRow(activatePollinateRow),
        biomeLabel: biomeLabel(biomeForRow(activatePollinateRow)),
      },
    ]);

    expect(serializedLogs).toContain('"biomeLabel":"Canopy"');
    expect(serializedLogs).toContain('"rowLabel":"Understory"');
    expect(serializedLogs).toContain('"rowLabel":"Oasis Edge"');
    expect(serializedLogs).toContain('"rowLabel":"Meadow"');
    expect(serializedLogs.toLowerCase()).not.toContain("cavern");
    expect(serializedLogs.toLowerCase()).not.toContain("grove");
    expect(serializedLogs.toLowerCase()).not.toContain("glade");
  });

  it("stores canonical metadata labels and row mappings", () => {
    const serializedMetadata = JSON.stringify({ BIOME_METADATA, ACTIVATION_ROW_METADATA }).toLowerCase();

    expect(serializedMetadata).toContain("understory");
    expect(serializedMetadata).toContain("oasis edge");
    expect(serializedMetadata).toContain("meadow");
    expect(serializedMetadata).toContain("canopy");
    expect(serializedMetadata).not.toContain("cavern");
    expect(serializedMetadata).not.toContain("grove");
    expect(serializedMetadata).not.toContain("glade");
  });
});
