"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { createGame } from "../../../lib/game/rules";
import { auth, db, ensureSignedIn } from "../../../lib/firebase";

type RoomDoc = {
  roomId: string;
  createdBy: string;
  createdAt: unknown;
  updatedAt: unknown;
  members: string[];
  game?: {
    phase: "waiting" | "inProgress" | "finished";
    actionCounter: number;
    state?: unknown;
  };
};

export default function RoomPage() {
  const params = useParams<{ roomId: string }>();
  const searchParams = useSearchParams();

  const mode = searchParams.get("mode") === "create" ? "create" : "join";
  const roomId = useMemo(() => String(params.roomId ?? ""), [params.roomId]);

  const [status, setStatus] = useState("Preparing room...");
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) {
      setError("Room ID is missing.");
      return;
    }

    let unsubscribe: (() => void) | undefined;

    const setupRoom = async () => {
      try {
        setError(null);
        const uid = await ensureSignedIn(auth);
        const roomRef = doc(db, "rooms", roomId);

        if (mode === "create") {
          await setDoc(
            roomRef,
            {
              roomId,
              createdBy: uid,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              members: [uid],
              game: {
                phase: "waiting",
                actionCounter: 0,
                state: null,
              },
            } satisfies RoomDoc,
            { merge: true },
          );

          setStatus("Room created. Share this room ID with your friend.");
        } else {
          const existing = await getDoc(roomRef);
          if (!existing.exists()) {
            throw new Error("Room does not exist. Ask host to create it first.");
          }

          const existingData = existing.data() as Partial<RoomDoc>;
          const nextMembers = Array.from(new Set([...(existingData.members ?? []), uid]));
          const shouldStartGame = !existingData.game?.state && nextMembers.length >= 2;

          await updateDoc(roomRef, {
            members: arrayUnion(uid),
            updatedAt: serverTimestamp(),
            ...(shouldStartGame
              ? {
                  game: {
                    phase: "inProgress",
                    actionCounter: 0,
                    state: createGame(
                      roomId,
                      nextMembers.slice(0, 2).map((memberId, idx) => ({
                        id: memberId,
                        name: `Player ${idx + 1}`,
                      })),
                      Date.now(),
                    ),
                  },
                }
              : {}),
          });

          setStatus("Joined room successfully.");
        }

        unsubscribe = onSnapshot(roomRef, (snapshot) => {
          if (!snapshot.exists()) {
            setMemberCount(0);
            return;
          }

          const data = snapshot.data() as Partial<RoomDoc>;
          setMemberCount(Array.isArray(data.members) ? data.members.length : 0);
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
  }, [mode, roomId]);

  return (
    <main style={{ display: "grid", gap: 12, maxWidth: 520, margin: "48px auto" }}>
      <h1>Room: {roomId}</h1>
      <p>Mode: {mode}</p>
      <p>{status}</p>
      {memberCount !== null ? <p>Connected members: {memberCount}</p> : null}
      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
    </main>
  );
}
