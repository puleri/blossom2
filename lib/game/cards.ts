import type { PlantCard } from "../types";

export const starterDeck: PlantCard[] = [
  {
    id: "lichen-archivist",
    name: "Lichen Archivist",
    biome: "cavern",
    points: 3,
    sunlightCapacity: 2,
    cost: { dew: 1 },
    powers: [{ trigger: "onActivate", action: "root", effects: [{ type: "gainResource", resource: "humus", amount: 1 }] }]
  },
  {
    id: "sunspore-spiral",
    name: "Sunspore Spiral",
    biome: "grove",
    points: 4,
    sunlightCapacity: 3,
    cost: { spores: 1, dew: 1 },
    powers: [{ trigger: "onMature", effects: [{ type: "scorePoints", amount: 2 }] }]
  },
  {
    id: "hollow-petal",
    name: "Hollow Petal Lantern",
    biome: "glade",
    points: 2,
    sunlightCapacity: 1,
    cost: { nectar: 1 },
    powers: [{ trigger: "onPlay", effects: [{ type: "drawCards", amount: 1 }] }]
  }
];
