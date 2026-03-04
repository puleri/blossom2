import type { PlantDefinition } from "../types";

export const starterDeck: PlantDefinition[] = [
  {
    id: "lichen-archivist",
    name: "Lichen Archivist",
    biome: "understory",
    points: 3,
    sunlightCapacity: 2,
    cost: { water: 1 },
    powers: [{ trigger: "onActivate", action: "root", effects: [{ type: "gainResource", resource: "mineral", amount: 1 }] }]
  },
  {
    id: "sunspore-spiral",
    name: "Sunspore Spiral",
    biome: "oasisEdge",
    points: 4,
    sunlightCapacity: 3,
    cost: { compost: 1, water: 1 },
    powers: [{ trigger: "onMature", effects: [{ type: "scorePoints", amount: 2 }] }]
  },
  {
    id: "hollow-petal",
    name: "Hollow Petal Lantern",
    biome: "meadow",
    points: 2,
    sunlightCapacity: 1,
    cost: { pollinator: 1 },
    powers: [{ trigger: "onPlay", effects: [{ type: "drawCards", amount: 1 }] }]
  }
];
