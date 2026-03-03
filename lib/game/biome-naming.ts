import type { ActivateAction, Biome } from "../types";

export const BIOME_NAMES = {
  placementBiome: "Canopy",
  activationRows: {
    root: "Understory",
    toTheSun: "Oasis Edge",
    pollinate: "Meadow",
  },
} as const;

const BIOME_ALIASES: Record<string, Biome> = {
  cavern: "understory",
  grove: "oasisEdge",
  glade: "meadow",
  understory: "understory",
  "oasis edge": "oasisEdge",
  oasisedge: "oasisEdge",
  meadow: "meadow",
  canopy: "canopy",
};

const BIOME_LABELS: Record<Biome, string> = {
  canopy: BIOME_NAMES.placementBiome,
  understory: BIOME_NAMES.activationRows.root,
  oasisEdge: BIOME_NAMES.activationRows.toTheSun,
  meadow: BIOME_NAMES.activationRows.pollinate,
};

export function normalizeBiomeName(value: string): Biome | null {
  const normalized = value.trim().toLowerCase();
  return BIOME_ALIASES[normalized] ?? null;
}

export function biomeLabel(biome: Biome): string {
  return BIOME_LABELS[biome];
}

export function actionRowLabel(action: ActivateAction): string {
  return BIOME_NAMES.activationRows[action];
}
