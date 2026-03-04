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
    key: "lichen-archivist",
    name: "Lichen Archivist",
    biome: "understory",
    points: 3,
    sunlightCapacity: 2,
    cost: { water: 1 },
    powers: [{ trigger: "onActivate", action: "root", effects: [{ type: "gainResource", resource: "mineral", amount: 1 }] }],
  },
  {
    key: "burrow-mycorrhiza",
    name: "Burrow Mycorrhiza",
    biome: "understory",
    points: 2,
    sunlightCapacity: 2,
    cost: { compost: 1 },
    powers: [{ trigger: "onPlay", effects: [{ type: "drawCards", amount: 1 }] }],
  },
  {
    key: "moss-cache",
    name: "Moss Cache",
    biome: "understory",
    points: 3,
    sunlightCapacity: 1,
    cost: { mineral: 1 },
    powers: [{ trigger: "onActivate", action: "root", effects: [{ type: "tuckCards", amount: 1 }] }],
  },
  {
    key: "sunspore-spiral",
    name: "Sunspore Spiral",
    biome: "oasisEdge",
    points: 4,
    sunlightCapacity: 3,
    cost: { compost: 1, water: 1 },
    powers: [{ trigger: "onMature", effects: [{ type: "scorePoints", amount: 2 }] }],
  },
  {
    key: "reed-broker",
    name: "Reed Broker",
    biome: "oasisEdge",
    points: 3,
    sunlightCapacity: 2,
    cost: { water: 1 },
    powers: [
      {
        trigger: "onActivate",
        action: "toTheSun",
        effects: [
          { type: "spendSunlight", amount: 1 },
          { type: "gainResource", resource: "water", amount: 1 },
        ],
      },
    ],
  },
  {
    key: "dew-oracle",
    name: "Dew Oracle",
    biome: "oasisEdge",
    points: 2,
    sunlightCapacity: 2,
    cost: { pollinator: 1 },
    powers: [{ trigger: "onPlay", effects: [{ type: "gainSunlight", amount: 1 }] }],
  },
  {
    key: "hollow-petal",
    name: "Hollow Petal Lantern",
    biome: "meadow",
    points: 2,
    sunlightCapacity: 1,
    cost: { pollinator: 1 },
    powers: [{ trigger: "onPlay", effects: [{ type: "drawCards", amount: 1 }] }],
  },
  {
    key: "finch-companion",
    name: "Finch Companion",
    biome: "meadow",
    points: 3,
    sunlightCapacity: 2,
    cost: { trellis: 1 },
    powers: [{ trigger: "onActivate", action: "pollinate", effects: [{ type: "discardCards", amount: 1 }, { type: "drawCards", amount: 2 }] }],
  },
  {
    key: "nectar-scribe",
    name: "Nectar Scribe",
    biome: "meadow",
    points: 3,
    sunlightCapacity: 2,
    cost: { pollinator: 1, compost: 1 },
    powers: [
      {
        trigger: "onActivate",
        action: "pollinate",
        effects: [
          { type: "spendResource", resource: "pollinator", amount: 1 },
          { type: "gainSunlight", amount: 1 },
        ],
      },
    ],
  },
  {
    key: "canopy-barterer",
    name: "Canopy Barterer",
    biome: "canopy",
    points: 5,
    sunlightCapacity: 3,
    cost: { trellis: 1, mineral: 1 },
    powers: [
      {
        trigger: "onActivate",
        action: "toTheSun",
        effects: [
          { type: "spendSunlight", amount: 1 },
          { type: "gainResource", resource: "trellis", amount: 1 },
        ],
      },
    ],
  },
  {
    key: "suncatch-bromeliad",
    name: "Suncatch Bromeliad",
    biome: "canopy",
    points: 4,
    sunlightCapacity: 4,
    cost: { water: 1, trellis: 1 },
    powers: [{ trigger: "onActivate", action: "toTheSun", effects: [{ type: "gainSunlight", amount: 2 }] }],
  },
  {
    key: "wind-collector",
    name: "Wind Collector",
    biome: "canopy",
    points: 4,
    sunlightCapacity: 3,
    cost: { mineral: 1 },
    powers: [{ trigger: "onPlay", effects: [{ type: "gainResource", resource: "pollinator", amount: 1 }] }],
  },
];

const COPIES_PER_BASE_CARD = 3;

export const EXPANDED_DECK: PlantDefinition[] = BASE_CARDS.flatMap((baseCard) =>
  Array.from({ length: COPIES_PER_BASE_CARD }, (_, i) => card(baseCard.biome, baseCard.key, i + 1, baseCard)),
);
