import {
  ACTIVATION_ROW_METADATA,
  BIOME_METADATA,
  type ActivateAction,
  type ActivationOrder,
  type ActivationRowId,
  type Biome,
  type TableauRowId,
} from "../types";

const BIOME_ALIASES: Record<string, Biome> = {
  cavern: "understory",
  grove: "oasisEdge",
  understory: "understory",
  "oasis edge": "oasisEdge",
  oasisedge: "oasisEdge",
  canopy: "canopy",
};

export function normalizeBiomeName(value: string): Biome | null {
  const normalized = value.trim().toLowerCase();
  return BIOME_ALIASES[normalized] ?? null;
}

export function biomeLabel(biome: Biome): string {
  return BIOME_METADATA[biome].displayName;
}

export function rowDisplayName(rowId: ActivationRowId): string {
  return ACTIVATION_ROW_METADATA[rowId].displayName;
}

export function rowActionType(rowId: ActivationRowId): ActivateAction {
  return ACTIVATION_ROW_METADATA[rowId].actionType;
}

export function rowActivationOrder(rowId: ActivationRowId): ActivationOrder {
  return ACTIVATION_ROW_METADATA[rowId].activationOrder;
}

export function biomeForRow(rowId: ActivationRowId): Biome {
  return ACTIVATION_ROW_METADATA[rowId].biome;
}

export function rowIdForBiome(biome: Biome): TableauRowId {
  return BIOME_METADATA[biome].rowId;
}

export function rowIdForAction(actionType: ActivateAction): ActivationRowId {
  const rowEntry = Object.entries(ACTIVATION_ROW_METADATA).find(
    ([, metadata]) => metadata.actionType === actionType,
  );

  if (!rowEntry) {
    throw new Error(`No activation row found for action '${actionType}'`);
  }

  return rowEntry[0] as ActivationRowId;
}
