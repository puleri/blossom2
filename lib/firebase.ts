import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, type Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

const app = getApps().length > 0 ? getApp() : initializeApp(config);

export const db = getFirestore(app);
export const auth = getAuth(app);

export async function ensureSignedIn(authClient: Auth = auth): Promise<string> {
  if (authClient.currentUser) {
    return authClient.currentUser.uid;
  }

  const credential = await signInAnonymously(authClient);
  return credential.user.uid;
}
