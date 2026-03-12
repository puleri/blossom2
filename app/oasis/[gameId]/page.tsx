"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { submitMoveIntent } from "../../../lib/moves-client";
import { auth, db, ensureSignedIn } from "../../../lib/firebase";
import { describePlantAbility } from "../../../lib/game/ability-text";
import type { ProjectedTurnGameState } from "../../../lib/game/projection";
import {
  TABLEAU_ROW_IDS,
  type FoodToken,
  type Biome,
  type PlantDefinition,
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
const BIOME_BAR_DISPLAY_ORDER: Biome[] = ["oasisEdge", "understory", "canopy"];
const FOOD_TOKEN_BY_RESOURCE: Partial<Record<keyof PlantDefinition["cost"], FoodToken>> = {
  water: "W",
  mineral: "M",
  compost: "C",
  trellis: "T",
  pollinator: "P",
};

function getCardFoodTokens(card: Pick<PlantDefinition, "cost">): FoodToken[] {
  const tokens: FoodToken[] = [];

  for (const [resource, amount] of Object.entries(card.cost)) {
    if (!amount) {
      continue;
    }

    const token = FOOD_TOKEN_BY_RESOURCE[resource as keyof PlantDefinition["cost"]];
    if (!token) {
      continue;
    }

    for (let index = 0; index < amount; index += 1) {
      tokens.push(token);
    }
  }

  return tokens;
}

function CardFoodDots({ card }: { card: Pick<PlantDefinition, "cost"> }) {
  const foodTokens = getCardFoodTokens(card);
  if (!foodTokens.length) {
    return null;
  }

  return (
    <div className="card-food-dots" aria-hidden="true">
      {foodTokens.map((token, index) => (
        <span key={`${token}-${index}`} className={`card-food-dot is-${token.toLowerCase()}`} />
      ))}
    </div>
  );
}

function CardBiomeBars({ biomes }: { biomes: Biome[] }) {
  return (
    <div className="card-biome-bars" aria-hidden="true">
      {BIOME_BAR_DISPLAY_ORDER.map((biome) => {
        const isPlayableBiome = biomes.includes(biome);

        return (
          <span
            key={biome}
            className={`card-biome-bar ${isPlayableBiome ? `is-${biome}` : "is-disabled"}`}
          />
        );
      })}
    </div>
  );
}

function CardStats({ points, maxSunTokens }: { points: number; maxSunTokens: number }) {
  return (
    <>
      <span className="card-points" aria-label={`Points: ${points}`}>
        {points}
      </span>
      <span className="card-max-sun" aria-label={`Max sun slots: ${maxSunTokens}`}>
        <span>{maxSunTokens}</span>
        <span className="card-max-sun-dot" aria-hidden="true" />
      </span>
    </>
  );
}

type RoomStatus = "lobby" | "in_game" | "finished";

type RoomDoc = {
  roomId: string;
  status: RoomStatus;
  game?: {
    phase: "waiting" | "inProgress" | "finished";
    actionCounter: number;
    state?: ProjectedTurnGameState | null;
    animationEvent?: {
      sequenceId: number;
      actorUid: string;
      createdAtMs: number;
      activationSteps: PendingActivationAnimation[];
    } | null;
  };
};

type PendingActivationAnimation = {
  cardId: string;
  rowId: TableauRowId;
  stepIndex: number;
  hasAbility: boolean;
  trigger?: "onActivate";
  actorUid?: string;
  playerId?: string;
  rollOutcome?: {
    rolled: number;
    successIfLessThan: number;
    success: boolean;
    tuckedCards: number;
  };
};

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
  const [deckPileHoverPlayerId, setDeckPileHoverPlayerId] = useState<string | null>(null);
  const [foodCacheHoverPlayerId, setFoodCacheHoverPlayerId] = useState<string | null>(null);
  const [sunHoverPlayerId, setSunHoverPlayerId] = useState<string | null>(null);
  const [hoveredHandCardId, setHoveredHandCardId] = useState<string | null>(null);
  const [activationAnimationQueue, setActivationAnimationQueue] = useState<PendingActivationAnimation[]>([]);
  const [activationAnimationStep, setActivationAnimationStep] = useState(-1);
  const [permanentTuckCountsByCardKey, setPermanentTuckCountsByCardKey] = useState<Record<string, number>>({});
  const [diceDisplayValue, setDiceDisplayValue] = useState<number | null>(null);
  const [diceDisplayPhase, setDiceDisplayPhase] = useState<"rolling" | "settled" | "success" | null>(null);
  const processedAnimationSequenceIdsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    setPermanentTuckCountsByCardKey({});
    processedAnimationSequenceIdsRef.current.clear();
  }, [gameId]);

  useEffect(() => {
    if (!gameId) {
      setError("Missing game id.");
      return;
    }

    let unsubscribe: (() => void) | undefined;

    const subscribeToProjection = async () => {
      try {
        const uid = await ensureSignedIn(auth);
        setCurrentUid(uid);
        const projectionRef = doc(db, "rooms", gameId, "projections", uid);

        unsubscribe = onSnapshot(
          projectionRef,
          (snapshot) => {
            if (!snapshot.exists()) {
              setRoom(null);
              setRoomMissing(true);
              setStatus("Game not found.");
              setError(null);
              return;
            }

            setRoomMissing(false);
            setRoom(snapshot.data() as RoomDoc);
            setStatus("Live game connected.");
            setError(null);
          },
          (snapshotError) => {
            setError(snapshotError.message || "Unable to subscribe to game state.");
          },
        );
      } catch (authError) {
        setError(authError instanceof Error ? authError.message : "Unable to authenticate.");
      }
    };

    void subscribeToProjection();

    return () => {
      unsubscribe?.();
    };
  }, [gameId]);

  const gameState = room?.game?.state ?? null;
  const isInGame = room?.status === "in_game" && room.game?.phase === "inProgress" && Boolean(gameState);
  const currentPlayerState = currentUid && gameState ? gameState.players[currentUid] : null;
  const currentPlayerFoodCounts = useMemo(() => {
    if (!currentPlayerState?.food?.length) {
      return [] as Array<[string, number]>;
    }

    const counts = new Map<string, number>();
    for (const token of currentPlayerState.food) {
      counts.set(token, (counts.get(token) ?? 0) + 1);
    }

    return Array.from(counts.entries());
  }, [currentPlayerState?.food]);
  const displayPlayerOrder = useMemo(
    () => getDisplayPlayerOrder(gameState?.playerOrder ?? [], currentUid),
    [currentUid, gameState?.playerOrder],
  );
  const currentPlayerHand = currentPlayerState?.hand ?? [];
  const currentPlayerSunTokens = currentPlayerState?.sunlightTokens ?? 0;
  const pendingChoice = gameState?.pendingChoice ?? null;
  const projectedPendingAnimations = useMemo(() => {
    const event = room?.game?.animationEvent;
    if (!event?.activationSteps?.length) {
      return [];
    }

    return event.activationSteps
      .map((step) => ({
        ...step,
        actorUid: event.actorUid,
      }))
      .sort((left, right) => left.stepIndex - right.stepIndex);
  }, [room?.game?.animationEvent]);
  useEffect(() => {
    console.log("[choose-one] pending choice changed", {
      pendingChoice,
      isSubmitting,
      currentUid,
      currentPlayerId: gameState?.currentPlayerId,
      actionCounter: room?.game?.actionCounter,
    });
  }, [pendingChoice, isSubmitting, currentUid, gameState?.currentPlayerId, room?.game?.actionCounter]);

  const pendingAnimationSignature = useMemo(() => {
    const event = room?.game?.animationEvent;
    if (!event?.activationSteps?.length) {
      return "";
    }

    const steps = event.activationSteps
      .map((step) => `${step.rowId}:${step.cardId}:${step.stepIndex}`)
      .join("|");
    return `${event.sequenceId}:${event.actorUid}:${steps}`;
  }, [room?.game?.animationEvent]);

  useEffect(() => {
    setActivationAnimationQueue(projectedPendingAnimations);
    setActivationAnimationStep(projectedPendingAnimations.length ? 0 : -1);
  }, [pendingAnimationSignature, projectedPendingAnimations]);

  useEffect(() => {
    const event = room?.game?.animationEvent;
    if (!event?.activationSteps?.length) {
      return;
    }

    if (processedAnimationSequenceIdsRef.current.has(event.sequenceId)) {
      return;
    }

    processedAnimationSequenceIdsRef.current.add(event.sequenceId);

    setPermanentTuckCountsByCardKey((previous) => {
      let didUpdate = false;
      const next = { ...previous };

      for (const step of event.activationSteps) {
        const tuckedCards = step.rollOutcome?.tuckedCards ?? 0;
        if (tuckedCards <= 0) {
          continue;
        }

        const playerId = step.playerId ?? event.actorUid;
        const cardKey = `${playerId}:${step.rowId}:${step.cardId}`;
        next[cardKey] = (next[cardKey] ?? 0) + tuckedCards;
        didUpdate = true;
      }

      return didUpdate ? next : previous;
    });
  }, [room?.game?.animationEvent]);

  useEffect(() => {
    if (!activationAnimationQueue.length || activationAnimationStep < 0) {
      return;
    }

    if (activationAnimationStep >= activationAnimationQueue.length - 1) {
      const clearTimer = setTimeout(() => {
        setActivationAnimationStep(-1);
      }, 450);

      return () => {
        clearTimeout(clearTimer);
      };
    }

    const timer = setTimeout(() => {
      setActivationAnimationStep((step) => step + 1);
    }, 280);

    return () => {
      clearTimeout(timer);
    };
  }, [activationAnimationQueue, activationAnimationStep]);

  useEffect(() => {
    if (!activationAnimationQueue.length || activationAnimationStep < 0) {
      setDiceDisplayValue(null);
      setDiceDisplayPhase(null);
      return;
    }

    const activeStep = activationAnimationQueue[activationAnimationStep];
    const rollOutcome = activeStep?.rollOutcome;
    if (!rollOutcome) {
      setDiceDisplayValue(null);
      setDiceDisplayPhase(null);
      return;
    }

    let spinInterval: ReturnType<typeof setInterval> | null = null;
    let settleTimer: ReturnType<typeof setTimeout> | null = null;
    let successTimer: ReturnType<typeof setTimeout> | null = null;
    let hideTimer: ReturnType<typeof setTimeout> | null = null;
    let settleInterval: ReturnType<typeof setInterval> | null = null;
    let currentValue = 1;

    setDiceDisplayPhase("rolling");
    setDiceDisplayValue(currentValue);

    spinInterval = setInterval(() => {
      currentValue = currentValue % 6 + 1;
      setDiceDisplayValue(currentValue);
    }, 75);

    settleTimer = setTimeout(() => {
      if (spinInterval) {
        clearInterval(spinInterval);
      }

      let settleValue = currentValue;
      settleInterval = setInterval(() => {
        if (settleValue === rollOutcome.rolled) {
          if (settleInterval) {
            clearInterval(settleInterval);
          }
          setDiceDisplayValue(rollOutcome.rolled);
          setDiceDisplayPhase(rollOutcome.success ? "success" : "settled");

          successTimer = setTimeout(() => {
            setDiceDisplayPhase("settled");
          }, rollOutcome.success ? 420 : 0);

          hideTimer = setTimeout(() => {
            setDiceDisplayValue(null);
            setDiceDisplayPhase(null);
          }, rollOutcome.success ? 1050 : 700);
          return;
        }

        settleValue = settleValue % 6 + 1;
        setDiceDisplayValue(settleValue);
      }, 180);
    }, 650);

    return () => {
      if (spinInterval) {
        clearInterval(spinInterval);
      }
      if (settleTimer) {
        clearTimeout(settleTimer);
      }
      if (successTimer) {
        clearTimeout(successTimer);
      }
      if (hideTimer) {
        clearTimeout(hideTimer);
      }
      if (settleInterval) {
        clearInterval(settleInterval);
      }
    };
  }, [activationAnimationQueue, activationAnimationStep]);

  const handleResolveChoice = async (optionIndex: number) => {
    console.log("[choose-one] resolve requested", {
      optionIndex,
      hasGameState: Boolean(gameState),
      hasRoomGame: Boolean(room?.game),
      isSubmitting,
      hasPendingChoice: Boolean(pendingChoice),
      currentUid,
      currentPlayerId: gameState?.currentPlayerId,
    });

    if (!gameState || !room?.game || isSubmitting || !pendingChoice || !currentUid || currentUid !== gameState.currentPlayerId) {
      console.log("[choose-one] resolve blocked by guard", {
        hasGameState: Boolean(gameState),
        hasRoomGame: Boolean(room?.game),
        isSubmitting,
        hasPendingChoice: Boolean(pendingChoice),
        hasCurrentUid: Boolean(currentUid),
        currentUid,
        currentPlayerId: gameState?.currentPlayerId,
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const result = await submitMoveIntent(gameId, {
        type: "resolveChoice",
        optionIndex,
        expectedTurn: gameState.turn,
        expectedActionCounter: room.game.actionCounter,
      });

      console.log("[choose-one] resolve response", {
        ok: result.ok,
        error: result.ok ? null : result.error,
      });

      if (!result.ok) {
        setError(result.error.message);
        return;
      }

      setStatus("Choice resolved.");
    } catch (submitError) {
      console.log("[choose-one] resolve threw", submitError);
      setError(submitError instanceof Error ? submitError.message : "Unable to resolve choice.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePlayCard = async (cardId: string, rowId: TableauRowId) => {
    if (!gameState || !room?.game || isSubmitting || pendingChoice || currentUid !== gameState.currentPlayerId) {
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
        type: "playCard",
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

  const handleDrawCard = async () => {
    if (!gameState || !room?.game || isSubmitting || pendingChoice || !currentUid || currentUid !== gameState.currentPlayerId) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const result = await submitMoveIntent(gameId, {
        type: "drawCard",
        expectedTurn: gameState.turn,
        expectedActionCounter: room.game.actionCounter,
      });

      if (!result.ok) {
        setError(result.error.message);
        return;
      }

      setStatus("Card drawn.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to draw card.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTakeFoodToken = async (cacheIndex: number) => {
    if (!gameState || !room?.game || isSubmitting || pendingChoice || !currentUid || currentUid !== gameState.currentPlayerId) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const result = await submitMoveIntent(gameId, {
        type: "takeFoodToken",
        cacheIndex,
        expectedTurn: gameState.turn,
        expectedActionCounter: room.game.actionCounter,
      });

      if (!result.ok) {
        setError(result.error.message);
        return;
      }

      setStatus("Food token taken.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to take food token.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGainSunToken = async () => {
    if (!gameState || !room?.game || isSubmitting || pendingChoice || !currentUid || currentUid !== gameState.currentPlayerId) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const result = await submitMoveIntent(gameId, {
        type: "gainSunToken",
        expectedTurn: gameState.turn,
        expectedActionCounter: room.game.actionCounter,
      });

      if (!result.ok) {
        setError(result.error.message);
        return;
      }

      setStatus("Sun token gained.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to gain sun token.");
    } finally {
      setIsSubmitting(false);
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
          <aside
            className={`food-cache-panel ${foodCacheHoverPlayerId === currentUid ? "is-glowing" : ""}`}
            aria-label="Food cache"
            onMouseEnter={() => setFoodCacheHoverPlayerId(currentUid)}
            onMouseLeave={() => setFoodCacheHoverPlayerId((value) => (value === currentUid ? null : value))}
          >
            <p className="food-cache-title">Food cache</p>
            <div className="food-cache-tokens">
              {gameState.foodCache.map((value, index) => (
                <button
                  key={`food-token-${index}-${value}`}
                  type="button"
                  className="food-cache-token"
                  onClick={() => {
                    void handleTakeFoodToken(index);
                  }}
                  disabled={!currentUid || currentUid !== gameState.currentPlayerId || isSubmitting}
                  aria-label={`Take ${value} food token`}
                >
                  {value}
                </button>
              ))}
            </div>
          </aside>

          <button
            type="button"
            className="deck-pile-button deck-pile-panel"
            onMouseEnter={() => setDeckPileHoverPlayerId(currentUid)}
            onMouseLeave={() => setDeckPileHoverPlayerId((value) => (value === currentUid ? null : value))}
            onClick={() => {
              if (!currentUid) {
                return;
              }

              void handleDrawCard();
            }}
            disabled={!currentUid || currentUid !== gameState.currentPlayerId || isSubmitting}
            aria-label="Draw a card from the deck"
          >
            Deck pile
          </button>

          <button
            type="button"
            className="sun-icon-button"
            aria-label="Gain 1 sun token"
            onMouseEnter={() => setSunHoverPlayerId(currentUid)}
            onMouseLeave={() => setSunHoverPlayerId((value) => (value === currentUid ? null : value))}
            onClick={() => {
              void handleGainSunToken();
            }}
            disabled={!currentUid || currentUid !== gameState.currentPlayerId || isSubmitting}
          >
            ☀
          </button>

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

                      const isDeckHoverRow = rowId === "oasisEdgeRow" && deckPileHoverPlayerId === playerId;
                      const isFoodCacheGlowRow = rowId === "understoryRow" && foodCacheHoverPlayerId === playerId;
                      const isSunGlowRow = rowId === "canopyRow" && sunHoverPlayerId === playerId;

                      return (
                        <div
                          key={rowId}
                          className={`activation-row-card ${isDeckHoverRow ? "is-deck-hover-glowing" : ""} ${isFoodCacheGlowRow ? "is-food-cache-glowing" : ""} ${isSunGlowRow ? "is-sun-glowing" : ""}`}
                        >
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
                            {rowCards.map((card) => {
                              const abilityText = describePlantAbility(card);
                              const animationStep = activationAnimationQueue.find(
                                (step) =>
                                  step.cardId === card.id &&
                                  step.rowId === rowId &&
                                  (step.actorUid === playerId || step.playerId === playerId),
                              );
                              const isActiveAnimationStep =
                                animationStep && activationAnimationStep === animationStep.stepIndex;
                              const activationGlowClassName = animationStep
                                ? animationStep.hasAbility
                                  ? "is-activation-glow-blue"
                                  : "is-activation-glow-orange"
                                : "";
                              const animationTuckCards = activationAnimationQueue
                                .filter(
                                  (step) =>
                                    step.stepIndex <= activationAnimationStep &&
                                    step.cardId === card.id &&
                                    step.rowId === rowId &&
                                    (step.actorUid === playerId || step.playerId === playerId),
                                )
                                .reduce((sum, step) => sum + (step.rollOutcome?.tuckedCards ?? 0), 0);
                              const permanentTuckCards =
                                permanentTuckCountsByCardKey[`${playerId}:${rowId}:${card.id}`] ?? 0;
                              const tuckCards = Math.max(permanentTuckCards, animationTuckCards);
                              const tuckScale = 1 + tuckCards * 0.005;
                              const tuckUnderCardTilt =
                                card.id
                                  .split("")
                                  .reduce((sum, character) => sum + character.charCodeAt(0), 0) %
                                  9 -
                                4;

                              return (
                                <div
                                  key={`${playerId}-${rowId}-${card.id}`}
                                  className={`tableau-card ${activationGlowClassName} ${isActiveAnimationStep ? "is-activation-glow-active" : ""} ${tuckCards > 0 ? "is-tuck-boosted" : ""}`}
                                  style={
                                    tuckCards > 0
                                      ? ({
                                          transform: `scale(${tuckScale})`,
                                          ["--tuck-under-tilt" as string]: `${tuckUnderCardTilt}deg`,
                                        } as CSSProperties)
                                      : undefined
                                  }
                                >
                                  <CardFoodDots card={card} />
                                  <CardBiomeBars biomes={card.biomes} />
                                  <strong>{card.name}</strong>
                                  {abilityText ? <p className="card-ability-text">{abilityText}</p> : null}
                                  <CardStats points={card.points} maxSunTokens={card.maxSunTokens} />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </section>

          <aside className="player-sun-panel" aria-label="Your sun tokens">
            <p className="player-sun-title">Sun inventory</p>
            <p className="player-sun-count" aria-live="polite">☀ x{currentPlayerSunTokens}</p>
          </aside>

          {currentPlayerFoodCounts.length ? (
            <aside className="player-food-panel" aria-label="Your food tokens">
              {currentPlayerFoodCounts.map(([token, count]) => (
                <p key={token} className="player-food-item">
                  <span className="player-food-token">{token}</span>
                  <span>x{count}</span>
                </p>
              ))}
            </aside>
          ) : null}

          <section className="player-hand-panel" aria-label="Your hand">
            <h3>Your hand</h3>
            <p className="player-hand-empty">Drag a card to one of your rows to play it. Playing a card ends your turn.</p>
            {currentPlayerHand.length ? (
              <div className="player-hand-scroll">
                {currentPlayerHand.map((card, index) => {
                  const abilityText = describePlantAbility(card);
                  const totalCards = currentPlayerHand.length;
                  const handWidthPercent = 100;
                  const cardWidthPercent = 22;
                  const maxOffsetPercent = Math.max(0, handWidthPercent - cardWidthPercent);
                  const leftPercent =
                    totalCards > 1 ? (index / (totalCards - 1)) * maxOffsetPercent : maxOffsetPercent / 2;

                  return (
                    <article
                      key={card.id}
                      className="player-hand-card"
                      style={{
                        left: `${leftPercent}%`,
                        zIndex:
                          hoveredHandCardId === card.id
                            ? currentPlayerHand.length + 1
                            : currentPlayerHand.length - index,
                      }}
                      draggable={currentUid === gameState.currentPlayerId && !isSubmitting}
                      onMouseEnter={() => setHoveredHandCardId(card.id)}
                      onMouseLeave={() => setHoveredHandCardId((value) => (value === card.id ? null : value))}
                      onFocus={() => setHoveredHandCardId(card.id)}
                      onBlur={() => setHoveredHandCardId((value) => (value === card.id ? null : value))}
                      onDragStart={(event) => {
                        event.dataTransfer.setData("text/plain", card.id);
                        setDraggedCardId(card.id);
                      }}
                      onDragEnd={() => setDraggedCardId(null)}
                    >
                      <CardFoodDots card={card} />
                      <CardBiomeBars biomes={card.biomes} />
                      <strong>{card.name}</strong>
                      <p>{card.id}</p>
                      {abilityText ? <p className="card-ability-text">{abilityText}</p> : null}
                      <CardStats points={card.points} maxSunTokens={card.maxSunTokens} />
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="player-hand-empty">No cards in your hand.</p>
            )}
          </section>
        </section>
      ) : null}

      {room && room.status !== "lobby" && !isInGame ? <p>Game is not yet in an active playable phase.</p> : null}

      {diceDisplayValue ? (
        <div className={`dice-roll-overlay ${diceDisplayPhase === "success" ? "is-success" : ""}`} aria-hidden="true">
          {diceDisplayValue}
        </div>
      ) : null}

      {pendingChoice ? (
        <div className="choice-modal-overlay" role="presentation">
          <div className="choice-modal" role="dialog" aria-label="Resolve card choice" aria-modal="true">
            <p className="biome-modal-heading">Resolve On Play ability</p>
            <p className="biome-modal-description">Choose one option for {pendingChoice.cardId}.</p>
            <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
              {pendingChoice.options.map((option, index) => (
                <button
                  key={`${option.label}-${index}`}
                  type="button"
                  onClick={() => void handleResolveChoice(index)}
                  disabled={isSubmitting}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
    </main>
  );
}
