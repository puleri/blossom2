"use client";

import type { Route } from "next";
import { useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  arrayUnion,
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { createGame } from "../../../lib/game/rules";
import { auth, db, ensureSignedIn } from "../../../lib/firebase";

type RoomStatus = "lobby" | "in_game" | "finished";

type RoomDoc = {
  roomId: string;
  createdBy: string;
  hostUid: string;
  createdAt: unknown;
  updatedAt: unknown;
  startedAt?: unknown;
  status: RoomStatus;
  seats: number;
  seed?: number;
  members: string[];
  readyByUid: Record<string, boolean>;
  game?: {
    phase: "waiting" | "inProgress" | "finished";
    actionCounter: number;
    state?: unknown;
  };
};

const MIN_PLAYERS_TO_START = 1;
const DEFAULT_SEATS = 4;

function displayNameForMember(memberUid: string, currentUid: string | null): string {
  if (memberUid === currentUid) {
    return "You";
  }

  return `${memberUid.slice(0, 6)}…${memberUid.slice(-4)}`;
}

export default function RoomPage() {
  const params = useParams<{ roomId: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const mode = searchParams.get("mode") === "create" ? "create" : "join";
  const roomId = useMemo(() => String(params.roomId ?? ""), [params.roomId]);

  const [status, setStatus] = useState("Preparing room...");
  const [error, setError] = useState<string | null>(null);
  const [currentUid, setCurrentUid] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomDoc | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const shouldRedirectToOasis =
      room?.status === "in_game" &&
      room.game?.phase === "inProgress" &&
      pathname.startsWith("/room/") &&
      roomId;

    if (!shouldRedirectToOasis) {
      return;
    }

    router.replace(`/oasis/${roomId}` as Route);
  }, [pathname, room, roomId, router]);

  useEffect(() => {
    if (!roomId) {
      setError("Room ID is missing.");
      return;
    }

    const roomRef = doc(db, "rooms", roomId);
    let unsubscribe: (() => void) | undefined;

    const setupRoom = async () => {
      try {
        setError(null);
        const uid = await ensureSignedIn(auth);
        setCurrentUid(uid);

        if (mode === "create") {
          await setDoc(
            roomRef,
            {
              roomId,
              createdBy: uid,
              hostUid: uid,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              startedAt: null,
              status: "lobby",
              seats: DEFAULT_SEATS,
              members: [uid],
              readyByUid: {
                [uid]: false,
              },
              game: {
                phase: "waiting",
                actionCounter: 0,
                state: null,
              },
            } satisfies RoomDoc,
            { merge: true },
          );

          setStatus("Room created. Waiting in lobby.");
        } else {
          const existing = await getDoc(roomRef);
          if (!existing.exists()) {
            throw new Error("Room does not exist. Ask host to create it first.");
          }

          const existingData = existing.data() as Partial<RoomDoc>;
          const members = existingData.members ?? [];
          const roomStatus = existingData.status ?? "lobby";
          const isExistingMember = members.includes(uid);
          const seats = existingData.seats ?? DEFAULT_SEATS;
          if (roomStatus === "in_game") {
            if (!isExistingMember) {
              throw new Error("Game already started. Only existing room members can enter this room.");
            }

            setStatus("Game is in progress. Redirecting to Oasis...");
            router.replace(`/oasis/${roomId}` as Route);
          } else {
            if (!isExistingMember && members.length >= seats) {
              throw new Error("Room is full.");
            }

            await updateDoc(roomRef, {
              members: arrayUnion(uid),
              [`readyByUid.${uid}`]: false,
              hostUid: existingData.hostUid ?? existingData.createdBy,
              status: roomStatus,
              seats,
              updatedAt: serverTimestamp(),
            });

            setStatus("Joined room lobby.");
          }
        }

        unsubscribe = onSnapshot(roomRef, (snapshot) => {
          if (!snapshot.exists()) {
            setRoom(null);
            return;
          }

          setRoom(snapshot.data() as RoomDoc);
        });
      } catch (setupError) {
        const message =
          setupError instanceof Error ? setupError.message : "Unable to open room.";
        setError(message);
      }
    };

    setupRoom();

    return () => {
      unsubscribe?.();
    };
  }, [mode, roomId, router]);

  const canToggleReady = Boolean(
    currentUid && room?.status === "lobby" && room.members.includes(currentUid),
  );

  const readyCount = useMemo(() => {
    if (!room?.members?.length) {
      return 0;
    }

    return room.members.filter((uid) => room.readyByUid?.[uid]).length;
  }, [room]);

  const isHost = Boolean(currentUid && room?.hostUid === currentUid);
  const allReady = Boolean(room?.members.length && readyCount === room.members.length);
  const hasEnoughPlayers = (room?.members.length ?? 0) >= MIN_PLAYERS_TO_START;
  const canStartGame = Boolean(
    room &&
      room.status === "lobby" &&
      isHost &&
      hasEnoughPlayers &&
      allReady &&
      !isSubmitting,
  );

  const startDisabledReason = !room
    ? "Room not loaded."
    : room.status !== "lobby"
      ? "Game has already started."
      : !isHost
        ? "Only host can start."
        : !hasEnoughPlayers
          ? `Need at least ${MIN_PLAYERS_TO_START} players.`
          : !allReady
            ? "All players must be ready."
            : null;

  const handleToggleReady = async () => {
    if (!currentUid || !room || !canToggleReady || isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const roomRef = doc(db, "rooms", roomId);
      const isReady = Boolean(room.readyByUid?.[currentUid]);
      await updateDoc(roomRef, {
        [`readyByUid.${currentUid}`]: !isReady,
        updatedAt: serverTimestamp(),
      });
      setStatus(!isReady ? "You are ready." : "You are not ready.");
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Unable to update ready state.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartGame = async () => {
    if (!currentUid || !canStartGame) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const roomRef = doc(db, "rooms", roomId);

      await runTransaction(db, async (tx) => {
        const snapshot = await tx.get(roomRef);
        if (!snapshot.exists()) {
          throw new Error("Room not found.");
        }

        const latest = snapshot.data() as RoomDoc;
        const members = latest.members ?? [];
        const readyByUid = latest.readyByUid ?? {};
        const everyoneReady = members.length > 0 && members.every((uid) => readyByUid[uid]);

        if (latest.hostUid !== currentUid) {
          throw new Error("Only the host can start the game.");
        }

        if (latest.status !== "lobby") {
          throw new Error("Game already started.");
        }

        if (members.length < MIN_PLAYERS_TO_START) {
          throw new Error(`Need at least ${MIN_PLAYERS_TO_START} players to start.`);
        }

        if (!everyoneReady) {
          throw new Error("All players must be ready before starting.");
        }

        const seed = latest.seed ?? Date.now();
        const players = members.map((memberId, idx) => ({
          id: memberId,
          name: `Player ${idx + 1}`,
        }));

        tx.update(roomRef, {
          seed,
          status: "in_game",
          startedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          game: {
            state: createGame(roomId, players, seed),
            actionCounter: 0,
            phase: "inProgress",
          },
        });
      });

      setStatus("Game started.");
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "Unable to start game.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main style={{ display: "grid", gap: 12, maxWidth: 620, margin: "48px auto" }}>
      <h1>Room: {roomId}</h1>
      <p>Mode: {mode}</p>
      <p>{status}</p>

      {room ? (
        <>
          <p>
            Lobby status: <strong>{room.status}</strong>
          </p>
          <p>
            Seats: {room.members.length}/{room.seats} · Ready: {readyCount}/{room.members.length}
          </p>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {room.members.map((memberUid) => {
              const memberReady = Boolean(room.readyByUid?.[memberUid]);
              const isMemberHost = room.hostUid === memberUid;
              return (
                <li key={memberUid}>
                  {displayNameForMember(memberUid, currentUid)}
                  {isMemberHost ? " · 👑 Host" : ""}
                  {memberReady ? " · ✅ Ready" : " · ⏳ Not ready"}
                </li>
              );
            })}
          </ul>

          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={handleToggleReady} disabled={!canToggleReady || isSubmitting}>
              {currentUid && room.readyByUid?.[currentUid] ? "Unready" : "Ready"}
            </button>
            <button type="button" onClick={handleStartGame} disabled={!canStartGame}>
              Start Game
            </button>
          </div>

          {startDisabledReason ? <p>Start gate: {startDisabledReason}</p> : <p>Start gate: Ready.</p>}
        </>
      ) : (
        <p>Connecting to room…</p>
      )}

      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
    </main>
  );
}
