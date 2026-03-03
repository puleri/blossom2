export function getDisplayPlayerOrder(playerOrder: string[], currentUid: string | null): string[] {
  const orderedPlayers = [...playerOrder];

  if (!currentUid) {
    return orderedPlayers;
  }

  const currentIndex = orderedPlayers.indexOf(currentUid);
  if (currentIndex <= 0) {
    return orderedPlayers;
  }

  orderedPlayers.splice(currentIndex, 1);
  orderedPlayers.unshift(currentUid);
  return orderedPlayers;
}
