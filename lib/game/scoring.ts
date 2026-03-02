import type { GameState, PlayerScoreBreakdown, PlayerState } from "../types";

export function scorePlayer(player: PlayerState): PlayerScoreBreakdown {
  const basePoints = player.plants.reduce((sum, plant) => sum + plant.points, 0);
  const tuckedCards = player.plants.reduce((sum, plant) => sum + plant.tuckedCards, 0);
  const sunlightPoints = player.plants.reduce(
    (sum, plant) => sum + Math.floor(plant.sunlightTokens / 2),
    0,
  );
  const bonusPoints = player.plants.reduce((sum, plant) => sum + (plant.bonusPoints ?? 0), 0);
  const total = basePoints + tuckedCards + sunlightPoints + bonusPoints;

  return {
    playerId: player.id,
    basePoints,
    tuckedCards,
    sunlightPoints,
    bonusPoints,
    total,
  };
}

export function aggregateFinalScoring(state: GameState): PlayerScoreBreakdown[] {
  return state.players
    .map(scorePlayer)
    .sort((a, b) => b.total - a.total || b.sunlightPoints - a.sunlightPoints || a.playerId.localeCompare(b.playerId));
}

export function determineWinnerId(scoringBreakdown: PlayerScoreBreakdown[]): string | null {
  if (!scoringBreakdown.length) {
    return null;
  }

  const top = scoringBreakdown[0];
  const tie = scoringBreakdown.filter(
    (entry) => entry.total === top.total && entry.sunlightPoints === top.sunlightPoints,
  );

  if (tie.length > 1) {
    return tie.map((entry) => entry.playerId).sort()[0];
  }

  return top.playerId;
}
