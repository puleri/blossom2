"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { submitMoveIntent } from "../../../lib/moves-client";
import { auth, ensureSignedIn } from "../../../lib/firebase";
import type { ProjectedTurnGameState } from "../../../lib/game/projection";
import { ACTIVATION_ROW_IDS, ACTIVATION_ROW_METADATA, type ActivationRowId } from "../../../lib/types";
import { getDisplayPlayerOrder } from "./player-order";

type RoomStatus = "lobby" | "in_game" | "finished";

type RoomDoc = {
  roomId: string;
  status: RoomStatus;
  game?: {
    phase: "waiting" | "inProgress" | "finished";
    actionCounter: number;
    state?: ProjectedTurnGameState | null;
  };
};

type RoomSnapshotResponse =
  | { ok: true; room: RoomDoc }
  | { ok: false; error: { code: "NOT_AUTHENTICATED" | "INVALID_ACTION"; message: string } };

export default function OasisGamePage() {
  const params = useParams<{ gameId: string }>();
  const gameId = useMemo(() => String(params.gameId ?? ""), [params.gameId]);

  const [room, setRoom] = useState<RoomDoc | null>(null);
  const [roomMissing, setRoomMissing] = useState(false);
  const [currentUid, setCurrentUid] = useState<string | null>(null);
  const [status, setStatus] = useState("Connecting to game...");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) {
      setError("Missing game id.");
      return;
    }

    let isMounted = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const fetchProjection = async () => {
      try {
        await ensureSignedIn(auth);
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) {
          throw new Error("Unable to authenticate.");
        }

        const response = await fetch(`/api/rooms/${gameId}/state`, {
          headers: { Authorization: `Bearer ${idToken}` },
          cache: "no-store",
        });
        const payload = (await response.json()) as RoomSnapshotResponse;

        if (!isMounted) {
          return;
        }

        if (!response.ok || !payload.ok) {
          if (response.status === 404) {
            setRoom(null);
            setRoomMissing(true);
            setStatus("Game not found.");
            setError(null);
          } else {
            setError(payload.ok ? "Unable to load game state." : payload.error.message);
          }
        } else {
          setRoomMissing(false);
          setRoom(payload.room);
          setStatus("Live game connected.");
          setError(null);
        }
      } catch (snapshotError) {
        if (isMounted) {
          setError(snapshotError instanceof Error ? snapshotError.message : "Unable to load game state.");
        }
      } finally {
        if (isMounted) {
          timer = setTimeout(fetchProjection, 2000);
        }
      }
    };

    void fetchProjection();

    return () => {
      isMounted = false;
      if (timer) {
        clearTimeout(timer);
      }
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
  const currentPlayerState = currentUid && gameState ? gameState.players[currentUid] : null;
  const displayPlayerOrder = useMemo(
    () => getDisplayPlayerOrder(gameState?.playerOrder ?? [], currentUid),
    [currentUid, gameState?.playerOrder],
  );

  const handlePlayCard = async (cardId: string, rowId: ActivationRowId) => {
    if (!gameState || !room?.game || isSubmitting || currentUid !== gameState.currentPlayerId) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const result = await submitMoveIntent(gameId, {
        cardId,
        rowId,
        expectedTurn: gameState.turn,
        expectedActionCounter: room.game.actionCounter,
      });

      if (!result.ok) {
        setError(result.error.message);
        return;
      }

      setStatus("Card played. Turn ended.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit move.");
    } finally {
      setIsSubmitting(false);
      setDraggedCardId(null);
    }
  };

  return (
    <main className={isInGame ? "oasis-game-main with-hand-panel" : "oasis-game-main"}>
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
          <h2>Game Board</h2>
          <p>
            Current player: <strong>{gameState.players[gameState.currentPlayerId]?.identity.name ?? gameState.currentPlayerId}</strong>
            {currentUid && gameState.currentPlayerId === currentUid ? " (you)" : ""}
          </p>
          <p>
            Turn: <strong>{gameState.turn}</strong> · Actions processed: <strong>{room?.game?.actionCounter ?? 0}</strong>
          </p>

          <section style={{ display: "grid", gap: 12 }}>
            {displayPlayerOrder.map((playerId) => {
              const player = gameState.players[playerId];
              const canDropHere = playerId === currentUid && currentUid === gameState.currentPlayerId;

              return (
                <article
                  key={playerId}
                  style={{ border: "1px solid #ddd", borderRadius: 6, padding: 10, display: "grid", gap: 8 }}
                >
                  <header style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <strong>{player?.identity.name ?? playerId}</strong>
                    {currentUid === playerId ? (
                      <span
                        style={{
                          fontSize: 12,
                          padding: "2px 6px",
                          borderRadius: 12,
                          background: "#e8f5e9",
                          color: "#1b5e20",
                          fontWeight: 700,
                        }}
                      >
                        You
                      </span>
                    ) : null}
                  </header>

                  <div className="activation-row-grid">
                    {ACTIVATION_ROW_IDS.map((rowId) => {
                      const rowMetadata = ACTIVATION_ROW_METADATA[rowId];
                      const rowCards = player?.tableau?.[rowId] ?? [];

                      return (
                        <div key={rowId} className="activation-row-card">
                          <p className="activation-row-title">{rowMetadata.displayName}</p>
                          <p className="activation-row-hint">Drop a matching card here</p>
                          <div
                            className={`activation-row-dropzone ${canDropHere ? "is-droppable" : ""} ${draggedCardId ? "is-drag-over" : ""}`}
                            onDragOver={(event) => {
                              if (!canDropHere) {
                                return;
                              }

                              event.preventDefault();
                            }}
                            onDrop={(event) => {
                              if (!canDropHere) {
                                return;
                              }

                              event.preventDefault();
                              const cardId = event.dataTransfer.getData("text/plain");
                              if (!cardId) {
                                return;
                              }

                              void handlePlayCard(cardId, rowId);
                            }}
                          >
                            {rowCards.map((card) => (
                              <div key={`${playerId}-${rowId}-${card.id}`} className="tableau-card">
                                <strong>{card.name}</strong>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </section>

          <section className="player-hand-panel" aria-label="Your hand">
            <h3>Your hand</h3>
            <p className="player-hand-empty">Drag a card to one of your rows to play it. Playing a card ends your turn.</p>
            {currentPlayerState?.hand?.length ? (
              <div className="player-hand-scroll">
                {currentPlayerState.hand.map((card) => (
                  <article
                    key={card.id}
                    className="player-hand-card"
                    draggable={currentUid === gameState.currentPlayerId && !isSubmitting}
                    onDragStart={(event) => {
                      event.dataTransfer.setData("text/plain", card.id);
                      setDraggedCardId(card.id);
                    }}
                    onDragEnd={() => setDraggedCardId(null)}
                  >
                    <strong>{card.name}</strong>
                    <p>{card.id}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="player-hand-empty">No cards in your hand.</p>
            )}
          </section>
        </section>
      ) : null}

      {room && room.status !== "lobby" && !isInGame ? <p>Game is not yet in an active playable phase.</p> : null}

      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
    </main>
  );
}
