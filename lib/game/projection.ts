import { CARD_BY_ID } from "./cards";
import type {
  ActivationRowId,
  Card,
  CardId,
  FoodToken,
  PlayerIdentity,
  TurnGameState,
  TableauRowId,
} from "../types";

export type ProjectedPlayerState = {
  identity: PlayerIdentity;
  handCount: number;
  hand?: Card[];
  tableau: Record<TableauRowId, Card[]>;
  food: FoodToken[];
  sunlightTokens: number;
};

export type ProjectedTurnGameState = {
  gameId: string;
  createdAt: string;
  seed: number;
  turn: number;
  currentPlayerId: string;
  playerOrder: string[];
  lastAction?: TurnGameState["lastAction"];
  deckCount: number;
  tray: Card[];
  foodCache: FoodToken[];
  players: Record<string, ProjectedPlayerState>;
  diagnostics: ProjectionDiagnostic[];
};

export type ProjectionDiagnostic = {
  code: "UNKNOWN_CARD_ID";
  cardId: CardId;
  source: "hand" | "tray" | "tableau";
  playerId?: string;
  rowId?: ActivationRowId;
};

const EMPTY_TABLEAU: Record<TableauRowId, CardId[]> = {
  understoryRow: [],
  oasisEdgeRow: [],
  canopyRow: [],
};

function hydrateCardIds(
  cardIds: CardId[],
  context: Omit<ProjectionDiagnostic, "code" | "cardId">,
): { cards: Card[]; diagnostics: ProjectionDiagnostic[] } {
  const hydratedCards: Card[] = [];
  const diagnostics: ProjectionDiagnostic[] = [];

  for (const cardId of cardIds) {
    const card = CARD_BY_ID.get(cardId);

    if (!card) {
      diagnostics.push({
        code: "UNKNOWN_CARD_ID",
        cardId,
        ...context,
      });
      continue;
    }

    hydratedCards.push(card);
  }

  return { cards: hydratedCards, diagnostics };
}

function hydrateTableau(
  tableau: Record<TableauRowId, CardId[]>,
  playerId: string,
): { tableau: Record<TableauRowId, Card[]>; diagnostics: ProjectionDiagnostic[] } {
  const understory = hydrateCardIds(tableau.understoryRow ?? [], {
    source: "tableau",
    playerId,
    rowId: "understoryRow",
  });
  const oasisEdge = hydrateCardIds(tableau.oasisEdgeRow ?? [], {
    source: "tableau",
    playerId,
    rowId: "oasisEdgeRow",
  });
  const canopy = hydrateCardIds(tableau.canopyRow ?? [], {
    source: "tableau",
    playerId,
  });
  return {
    tableau: {
      understoryRow: understory.cards,
      oasisEdgeRow: oasisEdge.cards,
      canopyRow: canopy.cards,
    },
    diagnostics: [...understory.diagnostics, ...oasisEdge.diagnostics, ...canopy.diagnostics],
  };
}

export function projectTurnGameState(state: TurnGameState, viewerUid: string): ProjectedTurnGameState {
  const diagnostics: ProjectionDiagnostic[] = [];
  const players = Object.fromEntries(
    Object.entries(state.players).map(([playerId, identity]) => {
      const hand = state.handsByPlayerId[playerId] ?? [];
      const hydratedTableau = hydrateTableau(state.tableauByPlayerId[playerId] ?? EMPTY_TABLEAU, playerId);
      diagnostics.push(...hydratedTableau.diagnostics);
      const hydratedHand = playerId === viewerUid
        ? hydrateCardIds(hand, {
            source: "hand",
            playerId,
          })
        : null;
      if (hydratedHand) {
        diagnostics.push(...hydratedHand.diagnostics);
      }

      const projected: ProjectedPlayerState = {
        identity,
        handCount: hand.length,
        tableau: hydratedTableau.tableau,
        food: state.foodByPlayerId?.[playerId] ?? [],
        sunlightTokens: state.sunlightByPlayerId?.[playerId] ?? 0,
        ...(hydratedHand ? { hand: hydratedHand.cards } : {}),
      };

      return [playerId, projected];
    }),
  );

  const hydratedTray = hydrateCardIds(state.tray, { source: "tray" });
  diagnostics.push(...hydratedTray.diagnostics);

  return {
    gameId: state.gameId,
    createdAt: state.createdAt,
    seed: state.seed,
    turn: state.turn,
    currentPlayerId: state.currentPlayerId,
    playerOrder: state.playerOrder,
    ...(state.lastAction ? { lastAction: state.lastAction } : {}),
    deckCount: state.deck.length,
    tray: hydratedTray.cards,
    foodCache: state.foodCache,
    players,
    diagnostics,
  };
}
