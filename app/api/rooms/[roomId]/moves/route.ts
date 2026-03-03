import { NextRequest, NextResponse } from "next/server";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { applyMoveIntent, type MoveIntent } from "../../../../../lib/game/intents";
import type { TurnGameState } from "../../../../../lib/types";
import { getServerFirestore, verifyIdToken } from "../../../../../lib/server-firestore";

type RoomDoc = {
  members?: string[];
  game?: {
    state: TurnGameState;
    actionCounter: number;
    phase: "waiting" | "inProgress" | "finished";
  };
  updatedAt?: unknown;
};

function authTokenFromRequest(request: NextRequest): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length).trim();
}

export async function POST(
  request: NextRequest,
  { params }: { params: { roomId: string } },
): Promise<NextResponse> {
  const idToken = authTokenFromRequest(request);
  if (!idToken) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_AUTHENTICATED", message: "Missing auth token." } },
      { status: 401 },
    );
  }

  const uid = await verifyIdToken(idToken);
  if (!uid) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_AUTHENTICATED", message: "Invalid auth token." } },
      { status: 401 },
    );
  }

  const moveIntent = (await request.json()) as MoveIntent;
  const db = getServerFirestore();
  const roomRef = doc(db, "rooms", params.roomId);

  try {
    const result = await runTransaction(db, async (tx) => {
      const roomSnap = await tx.get(roomRef);
      if (!roomSnap.exists()) {
        return { ok: false as const, error: { code: "INVALID_ACTION", message: "Room not found." } };
      }

      const room = roomSnap.data() as RoomDoc;
      const members = room.members ?? [];
      if (!members.includes(uid)) {
        return {
          ok: false as const,
          error: { code: "INVALID_ACTION", message: "You are not a member of this room." },
        };
      }

      if (!room.game || room.game.phase !== "inProgress") {
        return {
          ok: false as const,
          error: { code: "INVALID_ACTION", message: "Game is not in an actionable phase." },
        };
      }

      const applied = applyMoveIntent(
        room.game.state,
        moveIntent,
        uid,
        room.game.actionCounter,
      );

      if (!applied.ok) {
        return { ok: false as const, error: applied.error };
      }

      tx.update(roomRef, {
        game: {
          ...room.game,
          state: applied.state,
          actionCounter: applied.actionCounter,
        },
        updatedAt: serverTimestamp(),
      });

      return {
        ok: true as const,
        game: {
          ...room.game,
          state: applied.state,
          actionCounter: applied.actionCounter,
        },
      };
    });

    const status = result.ok ? 200 : result.error.code === "STALE_STATE" ? 409 : 400;
    return NextResponse.json(result, { status });
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "STALE_STATE", message: "Transaction conflict. Retry." } },
      { status: 409 },
    );
  }
}
