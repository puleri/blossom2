import { describe, expect, test } from "bun:test";
import { executeEffects } from "../lib/game/dsl/interpreter";
import { applyEffects } from "../lib/game/rules";
import { validateCardDefinitions } from "../lib/game/setup";
import { validatePowerDsl } from "../lib/game/dsl/validate";
import type { Effect, GameState } from "../lib/game/types";

function makeState(): GameState {
  return {
    resources: { water: 0, nutrients: 0, seeds: 0, compost: 0 },
    sunlight: 0,
    score: 0,
    hand: ["H1", "H2"],
    deck: ["D1", "D2", "D3"],
    tucked: []
  };
}

describe("opcode execution", () => {
  test("supports gainResource", () => {
    const state = makeState();
    executeEffects({ state }, [{ op: "gainResource", resource: "water", amount: 2 }]);
    expect(state.resources.water).toBe(2);
  });

  test("supports spendResource", () => {
    const state = makeState();
    state.resources.seeds = 3;
    executeEffects({ state }, [{ op: "spendResource", resource: "seeds", amount: 2 }]);
    expect(state.resources.seeds).toBe(1);
  });

  test("supports gainSunlight", () => {
    const state = makeState();
    executeEffects({ state }, [{ op: "gainSunlight", amount: 3 }]);
    expect(state.sunlight).toBe(3);
  });

  test("supports drawCards", () => {
    const state = makeState();
    executeEffects({ state }, [{ op: "drawCards", count: 2 }]);
    expect(state.hand).toEqual(["H1", "H2", "D1", "D2"]);
  });

  test("supports tuckCard", () => {
    const state = makeState();
    executeEffects({ state }, [{ op: "tuckCard", count: 2 }]);
    expect(state.hand).toEqual([]);
    expect(state.tucked).toEqual(["H1", "H2"]);
  });

  test("supports scorePoints", () => {
    const state = makeState();
    executeEffects({ state }, [{ op: "scorePoints", amount: 4 }]);
    expect(state.score).toBe(4);
  });

  test("supports if", () => {
    const state = makeState();
    const effects: Effect[] = [{
      op: "if",
      condition: { left: "sunlight", operator: ">=", right: 2 },
      then: [{ op: "scorePoints", amount: 2 }],
      else: [{ op: "scorePoints", amount: 1 }]
    }];
    executeEffects({ state, conditionValues: { sunlight: 3 } }, effects);
    expect(state.score).toBe(2);
  });

  test("supports choice", () => {
    const state = makeState();
    const effects: Effect[] = [{
      op: "choice",
      options: [
        { label: "gain water", effects: [{ op: "gainResource", resource: "water", amount: 1 }] },
        { label: "gain seeds", effects: [{ op: "gainResource", resource: "seeds", amount: 2 }] }
      ]
    }];
    executeEffects({ state, chooseOption: () => 1 }, effects);
    expect(state.resources.water).toBe(0);
    expect(state.resources.seeds).toBe(2);
  });
});

describe("trigger effects and setup validation", () => {
  test("runs onPlay, onActivate, onMature through applyEffects", () => {
    const state = makeState();
    applyEffects(state, [{ op: "scorePoints", amount: 1 }]);
    applyEffects(state, [{ op: "gainSunlight", amount: 1 }]);
    applyEffects(state, [{ op: "gainResource", resource: "compost", amount: 1 }]);

    expect(state.score).toBe(1);
    expect(state.sunlight).toBe(1);
    expect(state.resources.compost).toBe(1);
  });

  test("validates powers at setup time", () => {
    expect(() => validateCardDefinitions([
      {
        id: "c1",
        name: "Sapling",
        powers: {
          onPlay: [{ op: "gainResource", resource: "water", amount: 1 }],
          onActivate: [{ op: "scorePoints", amount: 1 }],
          onMature: [{ op: "gainSunlight", amount: 1 }]
        }
      }
    ])).not.toThrow();

    expect(() => validatePowerDsl([{ op: "gainResource", resource: "gold", amount: 1 }])).toThrow();
  });
});
