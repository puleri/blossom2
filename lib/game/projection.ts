import { CARD_BY_ID } from "./cards";
import type {
  ActivationRowId,
  Card,
  CardId,
  FoodToken,
  PlayerIdentity,
  TurnGameState,
} from "../types";

export type ProjectedPlayerState = {
  identity: PlayerIdentity;
  handCount: number;
  hand?: Card[];
  tableau: Record<ActivationRowId, Card[]>;
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
};

const EMPTY_TABLEAU: Record<ActivationRowId, CardId[]> = {
  understoryRow: [],
  oasisEdgeRow: [],
  meadowRow: [],
};

function hydrateCardIds(cardIds: CardId[]): Card[] {
  const hydratedCards: Card[] = [];

  for (const cardId of cardIds) {
    const card = CARD_BY_ID.get(cardId);

    if (!card) {
      console.warn(`[projectTurnGameState] Missing card definition for cardId: ${cardId}`);
      continue;
    }

    hydratedCards.push(card);
  }

  return hydratedCards;
}

function hydrateTableau(tableau: Record<ActivationRowId, CardId[]>): Record<ActivationRowId, Card[]> {
  return {
    understoryRow: hydrateCardIds(tableau.understoryRow ?? []),
    oasisEdgeRow: hydrateCardIds(tableau.oasisEdgeRow ?? []),
    meadowRow: hydrateCardIds(tableau.meadowRow ?? []),
  };
}

export function projectTurnGameState(state: TurnGameState, viewerUid: string): ProjectedTurnGameState {
  const players = Object.fromEntries(
    Object.entries(state.players).map(([playerId, identity]) => {
      const hand = state.handsByPlayerId[playerId] ?? [];
      const projected: ProjectedPlayerState = {
        identity,
        handCount: hand.length,
        tableau: hydrateTableau(state.tableauByPlayerId[playerId] ?? EMPTY_TABLEAU),
        ...(playerId === viewerUid ? { hand: hydrateCardIds(hand) } : {}),
      };

      return [playerId, projected];
    }),
  );

  return {
    gameId: state.gameId,
    createdAt: state.createdAt,
    seed: state.seed,
    turn: state.turn,
    currentPlayerId: state.currentPlayerId,
    playerOrder: state.playerOrder,
    lastAction: state.lastAction,
    deckCount: state.deck.length,
    tray: hydrateCardIds(state.tray),
    foodCache: state.foodCache,
    players,
  };
}
