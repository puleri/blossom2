import { describe, expect, it } from "vitest";
import { executeEffects } from "../lib/game/dsl/interpreter";
import { validateCardDefinitions } from "../lib/game/setup";
import { validatePowerDsl } from "../lib/game/dsl/validate";
import type { Effect, PlantDefinition, PowerResolutionState } from "../lib/types";

function makeState(): PowerResolutionState {
  return {
    resources: { water: 0, compost: 0, pollinator: 0, mineral: 0, trellis: 0 },
    sunlight: 1,
    score: 0,
    hand: ["H1", "H2"],
    deck: ["D1", "D2", "D3"],
    tucked: [],
    discard: [],
  };
}

describe("opcode execution", () => {
  it("supports gain/spend resource and sunlight", () => {
    const state = makeState();
    executeEffects({ state }, [
      { type: "gainResource", resource: "water", amount: 2 },
      { type: "spendResource", resource: "water", amount: 1 },
      { type: "gainSunlight", amount: 3 },
      { type: "spendSunlight", amount: 2 },
    ]);

    expect(state.resources.water).toBe(1);
    expect(state.sunlight).toBe(2);
  });

  it("supports draw/tuck/discard card flows", () => {
    const state = makeState();
    executeEffects({ state }, [
      { type: "drawCards", amount: 2 },
      { type: "tuckCards", amount: 1 },
      { type: "discardCards", amount: 1 },
    ]);

    expect(state.hand).toEqual(["D1", "D2"]);
    expect(state.tucked).toEqual(["H1"]);
    expect(state.discard).toEqual(["H2"]);
  });

  it("supports score, if, and choice", () => {
    const state = makeState();
    const effects: Effect[] = [
      {
        type: "if",
        condition: { left: "sunlight", operator: ">=", right: 1 },
        then: [{ type: "scorePoints", amount: 2 }],
        else: [{ type: "scorePoints", amount: 1 }],
      },
      {
        type: "choice",
        options: [
          { label: "gain water", effects: [{ type: "gainResource", resource: "water", amount: 1 }] },
          { label: "gain pollinator", effects: [{ type: "gainResource", resource: "pollinator", amount: 2 }] },
        ],
      },
    ];

    executeEffects({ state, conditionValues: { sunlight: 3 }, chooseOption: () => 1 }, effects);

    expect(state.score).toBe(2);
    expect(state.resources.pollinator).toBe(2);
  });
});

describe("setup validation", () => {
  it("validates card definitions and effects", () => {
    const cards: PlantDefinition[] = [
      {
        id: "c1",
        name: "Sapling",
        biome: "understory",
        points: 1,
        sunlightCapacity: 1,
        cost: { water: 1 },
        powers: [{ trigger: "onPlay", effects: [{ type: "gainResource", resource: "water", amount: 1 }] }],
      },
    ];

    expect(() => validateCardDefinitions(cards)).not.toThrow();
    expect(() => validatePowerDsl([{ type: "gainResource", resource: "gold", amount: 1 }])).toThrow();
  });
});
