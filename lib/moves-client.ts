import { auth, ensureSignedIn } from "./firebase";
import type { MoveIntent } from "./game/intents";

export type SubmitMoveResult =
  | { ok: true; game: unknown }
  | { ok: false; error: { code: "NOT_YOUR_TURN" | "INVALID_ACTION" | "STALE_STATE" | "NOT_AUTHENTICATED"; message: string } };

export async function submitMoveIntent(roomId: string, intent: MoveIntent): Promise<SubmitMoveResult> {
  await ensureSignedIn(auth);
  const idToken = await auth.currentUser?.getIdToken();

  if (!idToken) {
    return {
      ok: false,
      error: { code: "NOT_AUTHENTICATED", message: "Unable to authenticate player." },
    };
  }

  const response = await fetch(`/api/rooms/${roomId}/moves`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(intent),
  });

  const payload = (await response.json()) as SubmitMoveResult;
  return payload;
}
