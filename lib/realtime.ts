import {
  doc,
  Firestore,
  runTransaction,
  serverTimestamp,
  Transaction,
} from "firebase/firestore";
import { biomeLabel, normalizeBiomeName } from "./game/biome-naming";

export type ActionErrorCode =
  | "NOT_YOUR_TURN"
  | "STALE_ACTION"
  | "CARD_NOT_IN_HAND"
  | "CARD_NOT_FOUND"
  | "INVALID_STATE"
  | "UNKNOWN";

export type ActionError = {
  code: ActionErrorCode;
  message: string;
};

export type ActionResult<TGame = GameDoc> =
  | { ok: true; game: TGame }
  | { ok: false; error: ActionError };

type PlayerState = {
  hand: string[];
  tableau: Record<string, string[]>;
};

type GameDoc = {
  currentPlayerId: string;
  playerOrder: string[];
  turnNumber: number;
  players: Record<string, PlayerState>;
  history?: Array<Record<string, unknown>>;
  updatedAt?: unknown;
};

export type GrowInput = {
  gameId: string;
  playerId: string;
  expectedTurnNumber: number;
  cardId: string;
  biome: string;
};

export type ActivateInput = {
  gameId: string;
  playerId: string;
  expectedTurnNumber: number;
  biome: string;
  cardId: string;
};

const actionError = (code: ActionErrorCode, message: string): ActionResult => ({
  ok: false,
  error: { code, message },
});

const nextPlayerId = (game: GameDoc): string => {
  const currentIndex = game.playerOrder.indexOf(game.currentPlayerId);
  if (currentIndex < 0 || game.playerOrder.length === 0) {
    return game.currentPlayerId;
  }

  return game.playerOrder[(currentIndex + 1) % game.playerOrder.length];
};

const validateTurn = (
  game: GameDoc,
  playerId: string,
  expectedTurnNumber: number,
): ActionResult | null => {
  if (game.turnNumber !== expectedTurnNumber) {
    return actionError(
      "STALE_ACTION",
      "Action rejected because the turn has already advanced.",
    );
  }

  if (game.currentPlayerId !== playerId) {
    return actionError("NOT_YOUR_TURN", "Not your turn.");
  }

  return null;
};

const commitGameUpdate = (
  tx: Transaction,
  gameRef: ReturnType<typeof doc>,
  game: GameDoc,
  historyEvent: Record<string, unknown>,
): GameDoc => {
  const updatedGame: GameDoc = {
    ...game,
    turnNumber: game.turnNumber + 1,
    currentPlayerId: nextPlayerId(game),
    updatedAt: serverTimestamp(),
    history: [...(game.history ?? []), historyEvent],
  };

  tx.update(gameRef, updatedGame as Record<string, unknown>);
  return updatedGame;
};

export async function growWithTransaction(
  db: Firestore,
  input: GrowInput,
): Promise<ActionResult> {
  const gameRef = doc(db, "games", input.gameId);

  return runTransaction(db, async (tx) => {
    const gameSnap = await tx.get(gameRef);

    if (!gameSnap.exists()) {
      return actionError("INVALID_STATE", "Game not found.");
    }

    const game = gameSnap.data() as GameDoc;
    const turnError = validateTurn(game, input.playerId, input.expectedTurnNumber);
    if (turnError) {
      return turnError;
    }

    const player = game.players[input.playerId];
    if (!player) {
      return actionError("INVALID_STATE", "Player not found.");
    }

    if (!player.hand.includes(input.cardId)) {
      return actionError("CARD_NOT_IN_HAND", "Card no longer in hand.");
    }

    const normalizedBiome = normalizeBiomeName(input.biome);
    if (!normalizedBiome) {
      return actionError("INVALID_STATE", "Unknown biome.");
    }

    const hand = player.hand.filter((cardId) => cardId !== input.cardId);
    const biomeCards = [...(player.tableau[normalizedBiome] ?? []), input.cardId];

    const updatedGame = {
      ...game,
      players: {
        ...game.players,
        [input.playerId]: {
          ...player,
          hand,
          tableau: {
            ...player.tableau,
            [normalizedBiome]: biomeCards,
          },
        },
      },
    };

    const committed = commitGameUpdate(tx, gameRef, updatedGame, {
      type: "grow",
      playerId: input.playerId,
      cardId: input.cardId,
      biome: normalizedBiome,
      biomeLabel: biomeLabel(normalizedBiome),
      turnNumber: game.turnNumber,
    });

    return { ok: true, game: committed };
  }).catch(() => actionError("UNKNOWN", "Unable to complete Grow action."));
}

export async function activateWithTransaction(
  db: Firestore,
  input: ActivateInput,
): Promise<ActionResult> {
  const gameRef = doc(db, "games", input.gameId);

  return runTransaction(db, async (tx) => {
    const gameSnap = await tx.get(gameRef);

    if (!gameSnap.exists()) {
      return actionError("INVALID_STATE", "Game not found.");
    }

    const game = gameSnap.data() as GameDoc;
    const turnError = validateTurn(game, input.playerId, input.expectedTurnNumber);
    if (turnError) {
      return turnError;
    }

    const player = game.players[input.playerId];
    if (!player) {
      return actionError("INVALID_STATE", "Player not found.");
    }

    const normalizedBiome = normalizeBiomeName(input.biome);
    if (!normalizedBiome) {
      return actionError("INVALID_STATE", "Unknown biome.");
    }

    const biomeCards = player.tableau[normalizedBiome] ?? [];
    if (!biomeCards.includes(input.cardId)) {
      return actionError("CARD_NOT_FOUND", "Card is no longer available to activate.");
    }

    const committed = commitGameUpdate(tx, gameRef, game, {
      type: "activate",
      playerId: input.playerId,
      cardId: input.cardId,
      biome: normalizedBiome,
      biomeLabel: biomeLabel(normalizedBiome),
      turnNumber: game.turnNumber,
    });

    return { ok: true, game: committed };
  }).catch(() => actionError("UNKNOWN", "Unable to complete Activate action."));
}
