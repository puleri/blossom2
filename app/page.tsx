import type { GameState } from "../lib/types";

function EndgameSummary({ state }: { state: GameState }) {
  if (!state.isFinished) {
    return <p>Game in progress…</p>;
  }

  return (
    <section>
      <h2>Endgame Summary</h2>
      <p>Winner: {state.winnerId ?? "No winner"}</p>
      <table>
        <thead>
          <tr>
            <th>Player</th>
            <th>Base</th>
            <th>Tucked</th>
            <th>Sunlight</th>
            <th>Bonus</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {state.scoringBreakdown.map((score) => (
            <tr key={score.playerId}>
              <td>{score.playerId}</td>
              <td>{score.basePoints}</td>
              <td>{score.tuckedCards}</td>
              <td>{score.sunlightPoints}</td>
              <td>{score.bonusPoints}</td>
              <td>{score.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default function Page() {
  const sampleState: GameState = {
    players: [],
    deckCount: 0,
    discardCount: 0,
    currentTurn: 8,
    maxTurns: 8,
    isFinished: true,
    winnerId: "player-1",
    scoringBreakdown: [
      {
        playerId: "player-1",
        basePoints: 16,
        tuckedCards: 3,
        sunlightPoints: 4,
        bonusPoints: 2,
        total: 25,
      },
    ],
  };

  return (
    <main>
      <h1>Plant Biomes</h1>
      <EndgameSummary state={sampleState} />
    </main>
  );
}
