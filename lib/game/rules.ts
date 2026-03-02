import { starterDeck } from "./cards";
import type { ActivateAction, Biome, Effect, GameState, PlantCard, PlayerState, TableauCard } from "../types";

const rowForAction: Record<ActivateAction, Biome> = {
  root: "cavern",
  toTheSun: "grove",
  pollinate: "glade"
};

const baseResources = { dew: 1, spores: 1, nectar: 1, humus: 1 };

export function createGame(gameId: string): GameState {
  const p1 = makePlayer("p1", "Player 1");
  const p2 = makePlayer("p2", "Player 2");
  return {
    id: gameId,
    turn: 1,
    currentPlayerId: p1.id,
    players: [p1, p2],
    deck: [...starterDeck, ...starterDeck],
    log: ["Match created"]
  };
}

function makePlayer(id: string, name: string): PlayerState {
  return {
    id,
    name,
    hand: starterDeck.slice(0, 2),
    tableau: { cavern: [], grove: [], glade: [], canopy: [] },
    resources: { ...baseResources },
    score: 0
  };
}

export function grow(state: GameState, playerId: string, cardId: string): GameState {
  const next = structuredClone(state);
  const p = next.players.find((x) => x.id === playerId);
  if (!p || next.currentPlayerId !== playerId) return state;
  const idx = p.hand.findIndex((c) => c.id === cardId);
  if (idx < 0) return state;
  const card = p.hand[idx];
  if (!canAfford(p, card)) return state;

  spendCost(p, card);
  p.hand.splice(idx, 1);
  const placed: TableauCard = { ...card, ownerId: playerId, sunlight: 0, matureTriggered: false };
  p.tableau[card.biome].push(placed);
  applyEffects(next, p, card.powers.filter((x) => x.trigger === "onPlay").flatMap((x) => x.effects));

  endTurn(next);
  next.log.push(`${p.name} grew ${card.name}`);
  return next;
}

export function activate(state: GameState, playerId: string, action: ActivateAction): GameState {
  const next = structuredClone(state);
  const p = next.players.find((x) => x.id === playerId);
  if (!p || next.currentPlayerId !== playerId) return state;

  if (action === "root") p.resources.humus += 1;
  if (action === "pollinate") draw(p, next.deck, 1);
  if (action === "toTheSun") distributeSunlight(p);

  const row = p.tableau[rowForAction[action]];
  [...row].reverse().forEach((card) => {
    const powers = card.powers.filter((pw) => pw.trigger === "onActivate" && pw.action === action);
    applyEffects(next, p, powers.flatMap((pw) => pw.effects));
  });

  endTurn(next);
  next.log.push(`${p.name} used ${action}`);
  return next;
}

function distributeSunlight(player: PlayerState): void {
  Object.values(player.tableau).flat().forEach((card) => {
    if (card.sunlight < card.sunlightCapacity) {
      card.sunlight += 1;
      if (card.sunlight === card.sunlightCapacity && !card.matureTriggered) {
        player.score += card.powers
          .filter((pw) => pw.trigger === "onMature")
          .flatMap((pw) => pw.effects)
          .filter((fx): fx is Extract<Effect, { type: "scorePoints" }> => fx.type === "scorePoints")
          .reduce((acc, fx) => acc + fx.amount, 0);
        card.matureTriggered = true;
      }
    }
  });
}

function draw(player: PlayerState, deck: PlantCard[], amount: number): void {
  for (let i = 0; i < amount; i += 1) {
    const c = deck.shift();
    if (c) player.hand.push(c);
  }
}

function canAfford(player: PlayerState, card: PlantCard): boolean {
  return Object.entries(card.cost).every(([k, v]) => player.resources[k as keyof typeof player.resources] >= (v ?? 0));
}

function spendCost(player: PlayerState, card: PlantCard): void {
  Object.entries(card.cost).forEach(([k, v]) => {
    player.resources[k as keyof typeof player.resources] -= v ?? 0;
  });
}

function applyEffects(state: GameState, player: PlayerState, effects: Effect[]): void {
  effects.forEach((fx) => {
    if (fx.type === "gainResource") player.resources[fx.resource] += fx.amount;
    if (fx.type === "drawCards") draw(player, state.deck, fx.amount);
    if (fx.type === "scorePoints") player.score += fx.amount;
  });
}

function endTurn(state: GameState): void {
  state.turn += 1;
  state.currentPlayerId = state.players.find((p) => p.id !== state.currentPlayerId)?.id ?? state.currentPlayerId;
}
