"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { submitMoveIntent } from "../../../lib/moves-client";
import { auth, ensureSignedIn } from "../../../lib/firebase";
import type { ProjectedTurnGameState } from "../../../lib/game/projection";
import {
  TABLEAU_ROW_IDS,
  type TableauRowId,
} from "../../../lib/types";
import { getDisplayPlayerOrder } from "./player-order";

const TABLEAU_ROW_LABELS: Record<TableauRowId, string> = {
  oasisEdgeRow: "Oasis Edge",
  understoryRow: "Understory",
  canopyRow: "Canopy",
};

const BIOME_MODAL_CONTENT: Record<TableauRowId, { heading: string; description: string }> = {
  canopyRow: {
    heading: "To the Sun",
    description: "Gain 1 Sun Token",
  },
  understoryRow: {
    heading: "Root",
    description: "Gain 1 food from the cache",
  },
  oasisEdgeRow: {
    heading: "Pollinate",
    description: "Draw 1 plant card",
  },
};

const TABLEAU_ROW_DISPLAY_ORDER: TableauRowId[] = ["oasisEdgeRow", "understoryRow", "canopyRow"];

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

function buildOptimisticRoom(
  room: RoomDoc,
  playerId: string,
  cardId: string,
  rowId: TableauRowId,
): RoomDoc {
  const gameState = room.game?.state;
  const player = gameState?.players[playerId];
  const cardInHand = player?.hand?.find((card) => card.id === cardId);

  if (!room.game || !gameState || !player || !cardInHand) {
    return room;
  }

  return {
    ...room,
    game: {
      ...room.game,
      state: {
        ...gameState,
        players: {
          ...gameState.players,
          [playerId]: {
            ...player,
            handCount: Math.max(0, player.handCount - 1),
            hand: (player.hand ?? []).filter((card) => card.id !== cardId),
            tableau: {
              ...player.tableau,
              [rowId]: [...(player.tableau[rowId] ?? []), cardInHand],
            },
          },
        },
      },
    },
  };
}

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
  const [hoveredBiome, setHoveredBiome] = useState<TableauRowId | null>(null);
  const [clickedBiome, setClickedBiome] = useState<TableauRowId | null>(null);

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

  const handlePlayCard = async (cardId: string, rowId: TableauRowId) => {
    if (!gameState || !room?.game || isSubmitting || currentUid !== gameState.currentPlayerId) {
      return;
    }

    const optimisticRoom = buildOptimisticRoom(room, currentUid, cardId, rowId);
    const shouldApplyOptimisticUpdate = optimisticRoom !== room;

    try {
      setIsSubmitting(true);
      setError(null);
      if (shouldApplyOptimisticUpdate) {
        setRoom(optimisticRoom);
      }
      const result = await submitMoveIntent(gameId, {
        cardId,
        rowId,
        expectedTurn: gameState.turn,
        expectedActionCounter: room.game.actionCounter,
      });

      if (!result.ok) {
        if (shouldApplyOptimisticUpdate) {
          setRoom(room);
        }
        setError(result.error.message);
        return;
      }

      setStatus("Card played. Turn ended.");
    } catch (submitError) {
      if (shouldApplyOptimisticUpdate) {
        setRoom(room);
      }
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
          <aside className="food-cache-panel" aria-label="Food cache">
            <p className="food-cache-title">Food cache</p>
            <div className="food-cache-tokens">
              {gameState.foodCache.map((value, index) => (
                <span key={`food-token-${index}-${value}`} className="food-cache-token">
                  {value}
                </span>
              ))}
            </div>
          </aside>

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
                    {TABLEAU_ROW_DISPLAY_ORDER.map((rowId) => {
                      const isPlayableRow = TABLEAU_ROW_IDS.includes(rowId);
                      const rowCards = player?.tableau?.[rowId] ?? [];
                      const dropzoneClassName = `activation-row-dropzone ${
                        canDropHere && isPlayableRow ? "is-droppable" : ""
                      } ${draggedCardId && isPlayableRow ? "is-drag-over" : ""}`;

                      return (
                        <div key={rowId} className="activation-row-card">
                          <div className="activation-row-title-wrap">
                            <p className="activation-row-title">{TABLEAU_ROW_LABELS[rowId]}</p>
                            <button
                              type="button"
                              className="biome-modal-trigger"
                              onMouseEnter={() => setHoveredBiome(rowId)}
                              onMouseLeave={() => setHoveredBiome((value) => (value === rowId ? null : value))}
                              onClick={() => setClickedBiome((value) => (value === rowId ? null : rowId))}
                              aria-label={`Show ${TABLEAU_ROW_LABELS[rowId]} biome details`}
                            >
                              ℹ
                            </button>
                          </div>
                          {hoveredBiome === rowId || clickedBiome === rowId ? (
                            <div
                              className="biome-modal"
                              role="dialog"
                              aria-label={`${TABLEAU_ROW_LABELS[rowId]} biome effect`}
                              onMouseEnter={() => setHoveredBiome(rowId)}
                              onMouseLeave={() => setHoveredBiome((value) => (value === rowId ? null : value))}
                            >
                              <p className="biome-modal-heading">{BIOME_MODAL_CONTENT[rowId].heading}</p>
                              <p className="biome-modal-description">{BIOME_MODAL_CONTENT[rowId].description}</p>
                            </div>
                          ) : null}
                          <p className="activation-row-hint">
                            Drop a matching card here
                          </p>
                          <div
                            className={dropzoneClassName}
                            onDragOver={(event) => {
                              if (!canDropHere || !isPlayableRow) {
                                return;
                              }

                              event.preventDefault();
                            }}
                            onDrop={(event) => {
                              if (!canDropHere || !isPlayableRow) {
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
