import type { ActivationRowId, Card, PlayerIdentity, TurnGameState } from "../types";

export type ProjectedPlayerState = {
  identity: PlayerIdentity;
  handCount: number;
  hand?: Card[];
  tableauByRow: Record<ActivationRowId, Card[]>;
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
  players: Record<string, ProjectedPlayerState>;
};

export function projectTurnGameState(state: TurnGameState, viewerUid: string): ProjectedTurnGameState {
  const players = Object.fromEntries(
    Object.entries(state.players).map(([playerId, identity]) => {
      const hand = state.handsByPlayerId[playerId] ?? [];
      const projected: ProjectedPlayerState = {
        identity,
        handCount: hand.length,
        tableauByRow: state.tableauByPlayerId[playerId] ?? {
          understoryRow: [],
          oasisEdgeRow: [],
          meadowRow: [],
        },
        ...(playerId === viewerUid ? { hand } : {}),
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
    tray: state.tray,
    players,
  };
}
