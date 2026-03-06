import type { Biome, PlantDefinition } from "../types";

function card(
  biome: Biome,
  key: string,
  index: number,
  options: Omit<PlantDefinition, "id" | "biome">,
): PlantDefinition {
  return {
    ...options,
    biome,
    id: `${key}-${index}`,
  };
}

const BASE_CARDS: Array<Omit<PlantDefinition, "id"> & { key: string }> = [
 {
  name: "Venus Flytrap",
  cost: {
    water: 1,
    mineral: 1
  },
  onActivate: {
    type: "rollDieTuck",
    effect: {
      die: "d6",
      successIfLessThan: 4,
      onSuccess: {
        tuckCards: 1
      }
    }
  },
  maxSunTokens: 4,
  biomes: ["understory", "canopy"]
},
{
  name: "Western Hemlock",
  cost: {
    water: 2,
    wild: 1
  },
  onActivate: {
    type: "groupBenefit",
    effect: {
      allPlayersGain: {
        resource: "water",
        amount: 1
      },
      youGain: {
        resource: "water",
        amount: 2
      }
    }
  },
  maxSunTokens: 8,
  biomes: ["canopy"]
}
];

const COPIES_PER_BASE_CARD = 3;

export const EXPANDED_DECK: PlantDefinition[] = BASE_CARDS.flatMap((baseCard) =>
  Array.from({ length: COPIES_PER_BASE_CARD }, (_, i) => card(baseCard.biome, baseCard.key, i + 1, baseCard)),
);
