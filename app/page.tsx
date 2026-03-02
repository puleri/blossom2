"use client";

import { useMemo, useState } from "react";
import { Firestore } from "firebase/firestore";
import {
  activateWithTransaction,
  ActionError,
  growWithTransaction,
} from "@/lib/realtime";

type Props = {
  db?: Firestore;
};

export default function Page({ db }: Props) {
  const [gameId, setGameId] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [turnNumber, setTurnNumber] = useState(0);
  const [cardId, setCardId] = useState("");
  const [biome, setBiome] = useState("understory");
  const [error, setError] = useState<ActionError | null>(null);
  const [status, setStatus] = useState("");

  const disabled = useMemo(() => !db || !gameId || !playerId || !cardId, [
    db,
    gameId,
    playerId,
    cardId,
  ]);

  const handleGrow = async () => {
    if (!db) {
      setError({ code: "INVALID_STATE", message: "Firestore is not available." });
      return;
    }

    const result = await growWithTransaction(db, {
      gameId,
      playerId,
      expectedTurnNumber: turnNumber,
      cardId,
      biome,
    });

    if (!result.ok) {
      setStatus("");
      setError(result.error);
      return;
    }

    setError(null);
    setStatus("Grow action submitted.");
    setTurnNumber(result.game.turnNumber);
  };

  const handleActivate = async () => {
    if (!db) {
      setError({ code: "INVALID_STATE", message: "Firestore is not available." });
      return;
    }

    const result = await activateWithTransaction(db, {
      gameId,
      playerId,
      expectedTurnNumber: turnNumber,
      cardId,
      biome,
    });

    if (!result.ok) {
      setStatus("");
      setError(result.error);
      return;
    }

    setError(null);
    setStatus("Activate action submitted.");
    setTurnNumber(result.game.turnNumber);
  };

  return (
    <main style={{ display: "grid", gap: 12, maxWidth: 420, margin: "2rem auto" }}>
      <h1>Blossom 2</h1>

      <input value={gameId} onChange={(e) => setGameId(e.target.value)} placeholder="Game ID" />
      <input value={playerId} onChange={(e) => setPlayerId(e.target.value)} placeholder="Player ID" />
      <input
        value={turnNumber}
        type="number"
        onChange={(e) => setTurnNumber(Number(e.target.value))}
        placeholder="Expected turn"
      />
      <input value={cardId} onChange={(e) => setCardId(e.target.value)} placeholder="Card ID" />
      <input value={biome} onChange={(e) => setBiome(e.target.value)} placeholder="Biome" />

      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" onClick={handleGrow} disabled={disabled}>
          Grow
        </button>
        <button type="button" onClick={handleActivate} disabled={disabled}>
          Activate
        </button>
      </div>

      {error ? (
        <p style={{ color: "crimson" }}>
          {error.message} ({error.code})
        </p>
      ) : null}

      {status ? <p style={{ color: "green" }}>{status}</p> : null}
    </main>
  );
}
