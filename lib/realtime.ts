import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { GameState } from "./types";

export function subscribeGame(gameId: string, onData: (state: GameState | null) => void): () => void {
  return onSnapshot(doc(db, "games", gameId), (snap) => {
    if (!snap.exists()) onData(null);
    else onData(snap.data() as GameState);
  });
}

export async function saveGame(state: GameState): Promise<void> {
  await setDoc(doc(db, "games", state.id), state, { merge: true });
}
