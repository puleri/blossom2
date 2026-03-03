"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { submitMoveIntent } from "../../../lib/moves-client";
import { auth, db, ensureSignedIn } from "../../../lib/firebase";
import { ACTION_TYPES, type ActionType, type TurnGameState } from "../../../lib/types";

type RoomStatus = "lobby" | "in_game" | "finished";

type RoomDoc = {
  roomId: string;
  status: RoomStatus;
  game?: {
    phase: "waiting" | "inProgress" | "finished";
    actionCounter: number;
    state?: TurnGameState | null;
  };
};

export default function OasisGamePage() {
  const params = useParams<{ gameId: string }>();
  const gameId = useMemo(() => String(params.gameId ?? ""), [params.gameId]);

  const [room, setRoom] = useState<RoomDoc | null>(null);
  const [roomMissing, setRoomMissing] = useState(false);
  const [currentUid, setCurrentUid] = useState<string | null>(null);
  const [status, setStatus] = useState("Connecting to game...");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!gameId) {
      setError("Missing game id.");
      return;
    }

    const roomRef = doc(db, "rooms", gameId);
    const unsubscribe = onSnapshot(
      roomRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setRoom(null);
          setRoomMissing(true);
          setStatus("Game not found.");
          return;
        }

        setRoomMissing(false);
        setRoom(snapshot.data() as RoomDoc);
        setStatus("Live game connected.");
      },
      (snapshotError) => {
        setError(snapshotError.message);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [gameId]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const uid = await ensureSignedIn(auth);
        setCurrentUid(uid);
      } catch (authError) {
        setError(authError instanceof Error ? authError.message : "Unable to authenticate.");
      }
    };

    initAuth();
  }, []);

  const gameState = room?.game?.state ?? null;
  const isInGame = room?.status === "in_game" && room.game?.phase === "inProgress" && Boolean(gameState);

  const handleAction = async (actionType: ActionType) => {
    if (!gameState || !room?.game || isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const result = await submitMoveIntent(gameId, {
        actionType,
        expectedTurn: gameState.turn,
        expectedActionCounter: room.game.actionCounter,
      });

      if (!result.ok) {
        setError(result.error.message);
        return;
      }

      setStatus(`Submitted ${actionType}.`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit action.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main style={{ display: "grid", gap: 12, maxWidth: 720, margin: "48px auto" }}>
      <h1>Oasis Game: {gameId}</h1>
      <p>{status}</p>

      {roomMissing ? <p>game not found</p> : null}

      {room && room.status === "lobby" ? (
        <section style={{ display: "grid", gap: 8 }}>
          <h2>Waiting Room</h2>
          <p>This game is still in the lobby. Wait for the host to start.</p>
          <Link href={`/room/${gameId}`}>Back to room lobby</Link>
        </section>
      ) : null}

      {isInGame && gameState ? (
        <section style={{ display: "grid", gap: 10 }}>
          <h2>Game Board (Scaffold)</h2>
          <p>
            Current player: <strong>{gameState.currentPlayerId}</strong>
            {currentUid && gameState.currentPlayerId === currentUid ? " (you)" : ""}
          </p>
          <p>
            Turn: <strong>{gameState.turn}</strong> · Actions processed: <strong>{room?.game?.actionCounter ?? 0}</strong>
          </p>
          <p>Last action: {gameState.lastAction ?? "none"}</p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {ACTION_TYPES.map((actionType) => (
              <button
                key={actionType}
                type="button"
                onClick={() => handleAction(actionType)}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : `Do ${actionType}`}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {room && room.status !== "lobby" && !isInGame ? (
        <p>Game is not yet in an active playable phase.</p>
      ) : null}

      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
    </main>
  );
}
