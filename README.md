# blossom2 — MycoWings

A Next.js + Firestore live prototype for a **Wingspan-style reskin** using the engine principles in this repository.

## Reskin concept (v0)
- **Theme:** Bioluminescent fungal ecosystems ("MycoWings")
- **Canonical lane names:**
  - **Understory** → Root activation row
  - **Oasis Edge** → To the Sun activation row
  - **Meadow** → Pollinate activation row
  - **Canopy** → Placement biome
- **Resources:** water, compost, pollinator, mineral
- **Growth:** sunlight tokens and maturity triggers

### Naming conventions
- Treat the lane names and mapped mechanics above as canonical terms for docs, code comments, issues, and PRs.
- **Migration note:** Older wording may still appear in historical discussion (e.g., "Root action row," "To the Sun action row," "Pollinate action row," or "placement row"); when encountered, map them to the canonical terms above.

## Tech stack
- Next.js (App Router, TypeScript)
- Firebase Firestore
- `onSnapshot` realtime synchronization for shared game state

## Implemented in this scaffold
- Turn skeleton with actions: Grow, Root, To the Sun, Pollinate
- Right-to-left row activation for action powers
- Maturity trigger support (`onMature` fire-once flag)
- Starter card set as data (`lib/game/cards.ts`)
- Power DSL schema draft (`docs/power-dsl.schema.json`)
- Vitest rules tests

## Run locally
1. Install dependencies:
   ```bash
   npm install
   ```
2. Add environment variables in `.env.local`:
   ```bash
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   ```
3. In Firebase console, enable:
   - **Authentication → Sign-in method → Anonymous**
   - **Firestore Database** (start in test mode for local prototyping)
4. Add temporary Firestore rules for rooms during prototyping:
   ```text
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /rooms/{roomId} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```
5. Start dev server:
   ```bash
   npm run dev
   ```
6. Open `http://localhost:3000` and create or join a room.

## Firestore data model
- Collection: `games`
- Document ID: room ID (currently `demo-room`)
- Document payload: serialized `GameState`

## Next suggested milestones
- Expand card library to 80+ cards with strict DSL validation
- Add setup/endgame/scoring breakdown screens
- Add multiplayer identity/auth and room joining
- Add deterministic shuffling + seed support

## Move submission flow
- Clients submit turn intents to `POST /api/rooms/{roomId}/moves` instead of writing gameplay state directly.
- Server validates auth token, room membership, active player, phase, and action legality.
- Move application runs through shared rules logic (`lib/game/intents.ts` + `lib/game/rules.ts`).
- Firestore transaction enforces optimistic concurrency using `expectedTurn` + `expectedActionCounter`.
- Error codes returned for UI handling: `NOT_YOUR_TURN`, `INVALID_ACTION`, `STALE_STATE`.
- Realtime updates continue over `onSnapshot` as a read-only channel for game state.

## Firebase room flow
- `Create Room` signs the user in anonymously and creates/updates `rooms/{roomId}` with the current user as a member.
- `Join Room` signs the user in anonymously, verifies the room exists, and adds the user to `members`.
- Room page subscribes with `onSnapshot` to show current connected member count.
