import type { PlantDefinition } from "../types";

function card(baseCard: Omit<PlantDefinition, "id">, index: number): PlantDefinition {
  return {
    ...baseCard,
    id: `${baseCard.key}-${index}`,
  };
}

const BASE_CARDS: Array<Omit<PlantDefinition, "id">> = [
  {
    key: "venus-flytrap",
    name: "Venus Flytrap",
    points: 4,
    cost: {
      water: 1,
      mineral: 1,
    },
    onActivate: {
      type: "rollDieTuck",
      effect: {
        die: "d6",
        successIfLessThan: 4,
        onSuccess: {
          tuckCards: 1,
        },
      },
    },
    maxSunTokens: 4,
    biomes: ["understory", "canopy"],
  },
  {
    key: "western-hemlock",
    name: "Western Hemlock",
    points: 6,
    cost: {
      water: 2,
      wild: 1,
    },
    onActivate: {
      type: "groupBenefit",
      effect: {
        allPlayersGain: {
          resource: "water",
          amount: 1,
        },
        youGain: {
          resource: "water",
          amount: 2,
        },
      },
    },
    maxSunTokens: 8,
    biomes: ["canopy"],
  },
  {
    key: "prairie-clover",
    name: "Prairie Clover",
    points: 2,
    cost: {
      pollinator: 1,
    },
    onActivate: {
      type: "groupBenefit",
      effect: {
        allPlayersGain: {
          resource: "pollinator",
          amount: 1,
        },
        youGain: {
          resource: "pollinator",
          amount: 1,
        },
      },
    },
    maxSunTokens: 5,
    biomes: ["meadow"],
  },
  {
    key: "redwood-sorrel",
    name: "Redwood Sorrel",
    points: 3,
    cost: {
      water: 1,
      compost: 1,
    },
    onActivate: {
      type: "drawCards",
      effect: {
        draw: 1,
      },
    },
    maxSunTokens: 5,
    biomes: ["understory"],
  },
  {
    key: "alpine-lupine",
    name: "Alpine Lupine",
    points: 4,
    cost: {
      pollinator: 1,
      water: 1,
    },
    onActivate: {
      type: "gainSun",
      effect: {
        amount: 2,
      },
    },
    maxSunTokens: 6,
    biomes: ["meadow", "oasisEdge"],
  },
  {
    key: "sword-fern",
    name: "Sword Fern",
    points: 3,
    cost: {
      water: 1,
      compost: 1,
    },
    onActivate: {
      type: "rollDieTuck",
      effect: {
        die: "d6",
        successIfLessThan: 5,
        onSuccess: {
          tuckCards: 1,
        },
      },
    },
    maxSunTokens: 6,
    biomes: ["understory", "oasisEdge"],
  },
];

const COPIES_PER_BASE_CARD = 3;

export const EXPANDED_DECK: PlantDefinition[] = BASE_CARDS.flatMap((baseCard) =>
  Array.from({ length: COPIES_PER_BASE_CARD }, (_, i) => card(baseCard, i + 1)),
);
