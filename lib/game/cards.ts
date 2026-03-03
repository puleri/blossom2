import type { PlantDefinition } from "../types";

export const starterDeck: PlantDefinition[] = [
  {
    id: "lichen-archivist",
    name: "Lichen Archivist",
    biome: "understory",
    points: 3,
    sunlightCapacity: 2,
    cost: { dew: 1 },
    powers: [{ trigger: "onActivate", action: "root", effects: [{ type: "gainResource", resource: "humus", amount: 1 }] }]
  },
  {
    id: "sunspore-spiral",
    name: "Sunspore Spiral",
    biome: "oasisEdge",
    points: 4,
    sunlightCapacity: 3,
    cost: { spores: 1, dew: 1 },
    powers: [{ trigger: "onMature", effects: [{ type: "scorePoints", amount: 2 }] }]
  },
  {
    id: "hollow-petal",
    name: "Hollow Petal Lantern",
    biome: "meadow",
    points: 2,
    sunlightCapacity: 1,
    cost: { nectar: 1 },
    powers: [{ trigger: "onPlay", effects: [{ type: "drawCards", amount: 1 }] }]
  }
];
