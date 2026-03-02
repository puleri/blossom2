"use client";

import { useEffect, useMemo, useState } from "react";
import { activate, createGame, grow } from "../lib/game/rules";
import { saveGame, subscribeGame } from "../lib/realtime";
import type { ActivateAction, GameState } from "../lib/types";

const GAME_ID = "demo-room";

export default function Home(): JSX.Element {
  const [state, setState] = useState<GameState | null>(null);

  useEffect(() => subscribeGame(GAME_ID, setState), []);

  const current = useMemo(() => state?.players.find((p) => p.id === state.currentPlayerId), [state]);

  const create = async (): Promise<void> => {
    const g = createGame(GAME_ID);
    await saveGame(g);
  };

  const doGrow = async (cardId: string): Promise<void> => {
    if (!state || !current) return;
    await saveGame(grow(state, current.id, cardId));
  };

  const doActivate = async (action: ActivateAction): Promise<void> => {
    if (!state || !current) return;
    await saveGame(activate(state, current.id, action));
  };

  if (!state) {
    return (
      <main>
        <h1>Blossom2: MycoWings (Live)</h1>
        <p>Realtime match state is stored in Firestore via onSnapshot.</p>
        <button onClick={create}>Create demo match</button>
      </main>
    );
  }

  return (
    <main className="grid">
      <h1>Blossom2: MycoWings</h1>
      <div className="card">
        <strong>Turn {state.turn}</strong> · Current: {current?.name}
      </div>

      <div className="grid cols-2">
        {state.players.map((p) => (
          <section className="card" key={p.id}>
            <h3>{p.name}</h3>
            <div className="small">Score: {p.score}</div>
            <div className="small">Resources: {Object.entries(p.resources).map(([k, v]) => `${k}:${v}`).join(" · ")}</div>
            {(["cavern", "grove", "glade", "canopy"] as const).map((biome) => (
              <div className="biome" key={biome}>
                <strong>{biome}</strong>
                <ul>
                  {p.tableau[biome].map((c) => (
                    <li key={`${c.id}-${c.ownerId}`}>{c.name} ({c.sunlight}/{c.sunlightCapacity})</li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ))}
      </div>

      <section className="card">
        <h3>Current hand</h3>
        <div>{current?.hand.map((c) => <button key={c.id} onClick={() => doGrow(c.id)}>Grow {c.name}</button>)}</div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button onClick={() => doActivate("root")}>Root</button>
          <button onClick={() => doActivate("toTheSun")}>To the Sun</button>
          <button onClick={() => doActivate("pollinate")}>Pollinate</button>
        </div>
      </section>

      <section className="card">
        <h3>Game log</h3>
        <pre>{state.log.join("\n")}</pre>
      </section>
    </main>
  );
}
