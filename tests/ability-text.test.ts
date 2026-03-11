import { describe, expect, it } from "vitest";
import { describePlantAbility } from "../lib/game/ability-text";
import type { PlantDefinition } from "../lib/types";

function buildCard(overrides: Partial<PlantDefinition>): PlantDefinition {
  return {
    id: "card-1",
    key: "card-1",
    name: "Test Card",
    cost: {},
    points: 1,
    maxSunTokens: 1,
    biomes: ["canopy"],
    ...overrides,
  };
}

describe("describePlantAbility", () => {
  it("describes on-play choice powers", () => {
    const text = describePlantAbility(
      buildCard({
        onPlay: {
          trigger: "onPlay",
          effects: [
            {
              type: "choice",
              options: [
                { label: "Gain 1 mineral", effects: [{ type: "gainResource", resource: "mineral", amount: 1 }] },
                { label: "Gain 1 sunlight", effects: [{ type: "gainSunlight", amount: 1 }] },
              ],
            },
          ],
        },
      }),
    );

    expect(text).toBe("On play: choose one: Gain 1 mineral or Gain 1 sunlight.");
  });

  it("describes activation powers", () => {
    const text = describePlantAbility(
      buildCard({
        onActivate: {
          type: "rollDieTuck",
          effect: {
            die: "d6",
            successIfLessThan: 5,
            onSuccess: { tuckCards: 2 },
          },
        },
      }),
    );

    expect(text).toBe("Activate: roll a d6. If the result is less than 5, tuck 2 cards.");
  });

  it("returns null when no ability is present", () => {
    const text = describePlantAbility(buildCard({}));
    expect(text).toBeNull();
  });
});
