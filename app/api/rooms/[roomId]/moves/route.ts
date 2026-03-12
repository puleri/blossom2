import { NextRequest, NextResponse } from "next/server";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { applyMoveIntent, type MoveIntent } from "../../../../../lib/game/intents";
import { projectTurnGameState } from "../../../../../lib/game/projection";
import type { TableauRowId, TurnGameState } from "../../../../../lib/types";
import { getServerFirestore, verifyIdToken } from "../../../../../lib/server-firestore";

type RoomDoc = {
  members?: string[];
  status?: "lobby" | "in_game" | "finished";
  game?: {
    state: TurnGameState;
    actionCounter: number;
    phase: "waiting" | "inProgress" | "finished";
    animationEvent?: {
      sequenceId: number;
      actorUid: string;
      createdAtMs: number;
      activationSteps: Array<{
        stepIndex: number;
        cardId: string;
        rowId: TableauRowId;
        trigger: "onActivate";
        hasAbility: boolean;
        rollOutcome?: {
          rolled: number;
          successIfLessThan: number;
          success: boolean;
          tuckedCards: number;
        };
      }>;
    } | null;
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
  console.log("[moves] received move intent", {
    roomId: params.roomId,
    uid,
    intentType: moveIntent.type,
    expectedTurn: moveIntent.expectedTurn,
    expectedActionCounter: moveIntent.expectedActionCounter,
    ...(moveIntent.type === "resolveChoice" ? { optionIndex: moveIntent.optionIndex } : {}),
  });

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

      const applied = applyMoveIntent(room.game.state, moveIntent, uid, room.game.actionCounter);

      if (!applied.ok) {
        console.log("[moves] move intent rejected", {
          roomId: params.roomId,
          uid,
          intentType: moveIntent.type,
          error: applied.error,
        });
        return { ok: false as const, error: applied.error };
      }

      const animationEvent = applied.animation
        ? {
            sequenceId: applied.actionCounter,
            actorUid: applied.animation.actorUid,
            createdAtMs: Date.now(),
            activationSteps: applied.animation.activationSteps,
          }
        : null;

      console.log("[moves] move intent applied", {
        roomId: params.roomId,
        uid,
        intentType: moveIntent.type,
        nextTurn: applied.state.turn,
        nextCurrentPlayerId: applied.state.currentPlayerId,
        actionCounter: applied.actionCounter,
        hasPendingChoice: Boolean(applied.state.pendingChoice),
      });

      tx.update(roomRef, {
        game: {
          ...room.game,
          state: applied.state,
          actionCounter: applied.actionCounter,
          animationEvent,
        },
        updatedAt: serverTimestamp(),
      });

      for (const memberUid of members) {
        const projectionRef = doc(db, "rooms", params.roomId, "projections", memberUid);
        tx.set(
          projectionRef,
          {
            roomId: params.roomId,
            uid: memberUid,
            status: room.status ?? "lobby",
            game: {
              phase: room.game.phase,
              actionCounter: applied.actionCounter,
              state: projectTurnGameState(applied.state, memberUid),
              animationEvent,
            },
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
      }

      return {
        ok: true as const,
        game: {
          ...room.game,
          state: applied.state,
          actionCounter: applied.actionCounter,
          animationEvent,
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
