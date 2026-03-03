import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { projectTurnGameState } from "../../../../../lib/game/projection";
import type { TurnGameState } from "../../../../../lib/types";
import { getServerFirestore, verifyIdToken } from "../../../../../lib/server-firestore";

type RoomStatus = "lobby" | "in_game" | "finished";

type RoomDoc = {
  members?: string[];
  status?: RoomStatus;
  game?: {
    phase: "waiting" | "inProgress" | "finished";
    actionCounter: number;
    state?: TurnGameState | null;
  };
};

function authTokenFromRequest(request: NextRequest): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length).trim();
}

export async function GET(
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

  const db = getServerFirestore();
  const roomRef = doc(db, "rooms", params.roomId);
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_ACTION", message: "Room not found." } },
      { status: 404 },
    );
  }

  const room = roomSnap.data() as RoomDoc;
  if (!(room.members ?? []).includes(uid)) {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_ACTION", message: "You are not a member of this room." } },
      { status: 403 },
    );
  }

  const projectedState = room.game?.state ? projectTurnGameState(room.game.state, uid) : null;
  return NextResponse.json({
    ok: true,
    room: {
      roomId: params.roomId,
      status: room.status ?? "lobby",
      game: room.game
        ? {
            phase: room.game.phase,
            actionCounter: room.game.actionCounter,
            state: projectedState,
          }
        : undefined,
    },
  });
}
