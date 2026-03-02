# blossom2 — MycoWings

A Next.js + Firestore live prototype for a **Wingspan-style reskin** using the engine principles in this repository.

## Reskin concept (v0)
- **Theme:** Bioluminescent fungal ecosystems ("MycoWings")
- **Equivalent lanes:**
  - Understory → **Cavern** (Root action row)
  - Oasis Edge → **Grove** (To the Sun action row)
  - Meadow → **Glade** (Pollinate action row)
  - Canopy → **Canopy** (placement row)
- **Resources:** dew, spores, nectar, humus
- **Growth:** sunlight tokens and maturity triggers

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
3. Start dev server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:3000` and create a demo match.

## Firestore data model
- Collection: `games`
- Document ID: room ID (currently `demo-room`)
- Document payload: serialized `GameState`

## Next suggested milestones
- Expand card library to 80+ cards with strict DSL validation
- Add setup/endgame/scoring breakdown screens
- Add multiplayer identity/auth and room joining
- Add deterministic shuffling + seed support
