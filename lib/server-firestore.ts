import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { Firestore, getFirestore } from "firebase/firestore";

let app: FirebaseApp | undefined;
let firestore: Firestore | undefined;

function getServerFirebaseApp(): FirebaseApp {
  if (app) {
    return app;
  }

  app = getApps().length > 0
    ? getApp()
    : initializeApp({
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });

  return app;
}

export function getServerFirestore(): Firestore {
  if (!firestore) {
    firestore = getFirestore(getServerFirebaseApp());
  }

  return firestore;
}

export async function verifyIdToken(idToken: string): Promise<string | null> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    return null;
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { users?: Array<{ localId?: string }> };
  const uid = payload.users?.[0]?.localId;
  return typeof uid === "string" && uid.length > 0 ? uid : null;
}
