import type {
  ActivationAbility,
  Biome,
  PlantDefinition,
  Power,
  Resource,
} from "../types";

export type HiddenRole =
  | "vanilla"
  | "engine"
  | "ramp"
  | "support"
  | "payoff"
  | "scorer"
  | "enabler"
  | "control"
  | "swing";

export type RarityBand = "common" | "uncommon" | "rare" | "legendary";
export type ReliabilityBand = "guaranteed" | "high" | "medium" | "low" | "chaotic";
export type FlexibilityScore = 1 | 2 | 3 | 4;
export type CeilingBand = "low" | "medium" | "high" | "explosive";
export type ComplexityScore = 1 | 2 | 3 | 4 | 5;
export type AbilityKind = "onPlay" | "onActivate" | "none";

export type SynergyTag =
  | "tuck"
  | "draw"
  | "sun"
  | "growth"
  | "pollination"
  | "water"
  | "compost"
  | "mineral"
  | "trellis"
  | "wild"
  | "understory"
  | "oasisEdge"
  | "canopy"
  | "engine"
  | "conversion"
  | "defense"
  | "groupBenefit";

export type HiddenCardAttributes = {
  role: HiddenRole;
  rarityBand: RarityBand;
  reliability: ReliabilityBand;
  flexibility: FlexibilityScore;
  ceiling: CeilingBand;
  synergyTags: SynergyTag[];
  powerScore: number;
  complexity: ComplexityScore;
  abilityKind: AbilityKind;
};

export type PlantAbilitySlot =
  | {
      abilityKind: "onPlay";
      onPlay: Power;
      onActivate?: never;
    }
  | {
      abilityKind: "onActivate";
      onActivate: ActivationAbility;
      onPlay?: never;
    }
  | {
      abilityKind: "none";
      onPlay?: never;
      onActivate?: never;
    };

export type GeneratedPlantCard = Omit<PlantDefinition, "onPlay" | "onActivate"> &
  PlantAbilitySlot & {
    hidden: HiddenCardAttributes;
  };

export type SeededRng = {
  next(): number;
  int(min: number, max: number): number;
  pick<T>(values: readonly T[]): T;
  weightedPick<T>(values: Array<{ value: T; weight: number }>): T;
  chance(probability: number): boolean;
  shuffle<T>(values: T[]): T[];
};

export type GeneratorConfig = {
  deckSize: number;
  includeOnPlayPowers?: boolean;
  rarityWeights?: Record<RarityBand, number>;
  roleWeights?: Partial<Record<HiddenRole, number>>;
};

type RoleTemplate = {
  role: HiddenRole;
  allowedRarities: RarityBand[];
  reliabilityWeights: Record<ReliabilityBand, number>;
  flexibilityWeights: Record<FlexibilityScore, number>;
  ceilingWeights: Record<CeilingBand, number>;
  complexityWeights: Record<ComplexityScore, number>;
  biomeCountWeights: Record<1 | 2 | 3, number>;
  activationWeights: Partial<Record<ActivationAbility["type"], number>>;
  synergyPool: SynergyTag[];
  resourceBias: Array<{ resource: Resource; weight: number }>;
  basePointRange: [number, number];
  baseSunRange: [number, number];
};

const BIOMES: readonly Biome[] = ["understory", "oasisEdge", "canopy"] as const;
const NON_WILD_RESOURCES: readonly Exclude<Resource, "wild">[] = [
  "water",
  "compost",
  "pollinator",
  "mineral",
  "trellis",
] as const;

const NAME_PARTS = {
  prefix: [
    "Sword",
    "Moon",
    "Dust",
    "Golden",
    "Ghost",
    "Spiral",
    "River",
    "Velvet",
    "Amber",
    "Silver",
    "Thorn",
    "Sun",
    "Shade",
    "Cinder",
    "Star",
  ],
  suffix: [
    "Fern",
    "Moss",
    "Bloom",
    "Vine",
    "Root",
    "Thistle",
    "Ivy",
    "Cactus",
    "Orchid",
    "Briar",
    "Lily",
    "Reed",
    "Aster",
    "Clover",
    "Willow",
  ],
} as const;

const ROLE_TEMPLATES: Record<HiddenRole, RoleTemplate> = {
  vanilla: {
    role: "vanilla",
    allowedRarities: ["common", "uncommon"],
    reliabilityWeights: { guaranteed: 6, high: 3, medium: 1, low: 0, chaotic: 0 },
    flexibilityWeights: { 1: 1, 2: 5, 3: 3, 4: 1 },
    ceilingWeights: { low: 7, medium: 3, high: 0, explosive: 0 },
    complexityWeights: { 1: 6, 2: 3, 3: 1, 4: 0, 5: 0 },
    biomeCountWeights: { 1: 2, 2: 6, 3: 2 },
    activationWeights: { gainSun: 7, drawCards: 2, groupBenefit: 1 },
    synergyPool: ["sun", "water", "compost", "understory", "oasisEdge"],
    resourceBias: [
      { resource: "water", weight: 4 },
      { resource: "compost", weight: 4 },
      { resource: "mineral", weight: 2 },
      { resource: "pollinator", weight: 1 },
      { resource: "trellis", weight: 1 },
    ],
    basePointRange: [3, 6],
    baseSunRange: [4, 7],
  },
  engine: {
    role: "engine",
    allowedRarities: ["common", "uncommon", "rare"],
    reliabilityWeights: { guaranteed: 1, high: 3, medium: 5, low: 1, chaotic: 0 },
    flexibilityWeights: { 1: 1, 2: 6, 3: 2, 4: 1 },
    ceilingWeights: { low: 1, medium: 6, high: 3, explosive: 0 },
    complexityWeights: { 1: 0, 2: 5, 3: 4, 4: 1, 5: 0 },
    biomeCountWeights: { 1: 2, 2: 7, 3: 1 },
    activationWeights: { rollDieTuck: 5, drawCards: 3, gainSun: 2 },
    synergyPool: ["tuck", "draw", "sun", "engine", "understory", "oasisEdge"],
    resourceBias: [
      { resource: "water", weight: 3 },
      { resource: "compost", weight: 3 },
      { resource: "mineral", weight: 2 },
      { resource: "pollinator", weight: 1 },
      { resource: "trellis", weight: 1 },
    ],
    basePointRange: [2, 5],
    baseSunRange: [5, 8],
  },
  ramp: {
    role: "ramp",
    allowedRarities: ["common", "uncommon", "rare"],
    reliabilityWeights: { guaranteed: 3, high: 4, medium: 3, low: 0, chaotic: 0 },
    flexibilityWeights: { 1: 1, 2: 5, 3: 3, 4: 1 },
    ceilingWeights: { low: 2, medium: 6, high: 2, explosive: 0 },
    complexityWeights: { 1: 2, 2: 5, 3: 3, 4: 0, 5: 0 },
    biomeCountWeights: { 1: 1, 2: 6, 3: 3 },
    activationWeights: { gainSun: 7, drawCards: 1, groupBenefit: 2 },
    synergyPool: ["sun", "water", "compost", "mineral", "growth"],
    resourceBias: [
      { resource: "water", weight: 3 },
      { resource: "compost", weight: 2 },
      { resource: "mineral", weight: 3 },
      { resource: "pollinator", weight: 1 },
      { resource: "trellis", weight: 1 },
    ],
    basePointRange: [2, 4],
    baseSunRange: [6, 9],
  },
  support: {
    role: "support",
    allowedRarities: ["common", "uncommon", "rare"],
    reliabilityWeights: { guaranteed: 2, high: 3, medium: 4, low: 1, chaotic: 0 },
    flexibilityWeights: { 1: 1, 2: 4, 3: 4, 4: 1 },
    ceilingWeights: { low: 2, medium: 6, high: 2, explosive: 0 },
    complexityWeights: { 1: 1, 2: 4, 3: 4, 4: 1, 5: 0 },
    biomeCountWeights: { 1: 1, 2: 5, 3: 4 },
    activationWeights: { groupBenefit: 6, gainSun: 2, drawCards: 2 },
    synergyPool: ["groupBenefit", "pollination", "growth", "conversion", "oasisEdge", "canopy"],
    resourceBias: [
      { resource: "water", weight: 2 },
      { resource: "compost", weight: 2 },
      { resource: "mineral", weight: 2 },
      { resource: "pollinator", weight: 3 },
      { resource: "trellis", weight: 1 },
    ],
    basePointRange: [2, 4],
    baseSunRange: [4, 7],
  },
  payoff: {
    role: "payoff",
    allowedRarities: ["uncommon", "rare", "legendary"],
    reliabilityWeights: { guaranteed: 0, high: 1, medium: 4, low: 4, chaotic: 1 },
    flexibilityWeights: { 1: 4, 2: 5, 3: 1, 4: 0 },
    ceilingWeights: { low: 0, medium: 2, high: 6, explosive: 2 },
    complexityWeights: { 1: 0, 2: 1, 3: 4, 4: 4, 5: 1 },
    biomeCountWeights: { 1: 4, 2: 5, 3: 1 },
    activationWeights: { drawCards: 4, rollDieTuck: 3, gainSun: 3 },
    synergyPool: ["tuck", "draw", "sun", "growth", "canopy"],
    resourceBias: [
      { resource: "water", weight: 2 },
      { resource: "compost", weight: 2 },
      { resource: "mineral", weight: 2 },
      { resource: "pollinator", weight: 2 },
      { resource: "trellis", weight: 3 },
    ],
    basePointRange: [4, 8],
    baseSunRange: [5, 9],
  },
  scorer: {
    role: "scorer",
    allowedRarities: ["common", "uncommon", "rare"],
    reliabilityWeights: { guaranteed: 5, high: 3, medium: 2, low: 0, chaotic: 0 },
    flexibilityWeights: { 1: 2, 2: 5, 3: 2, 4: 1 },
    ceilingWeights: { low: 4, medium: 4, high: 2, explosive: 0 },
    complexityWeights: { 1: 3, 2: 4, 3: 2, 4: 1, 5: 0 },
    biomeCountWeights: { 1: 2, 2: 6, 3: 2 },
    activationWeights: { gainSun: 5, drawCards: 4, groupBenefit: 1 },
    synergyPool: ["sun", "draw", "understory", "canopy"],
    resourceBias: [
      { resource: "water", weight: 2 },
      { resource: "compost", weight: 2 },
      { resource: "mineral", weight: 2 },
      { resource: "pollinator", weight: 2 },
      { resource: "trellis", weight: 2 },
    ],
    basePointRange: [4, 7],
    baseSunRange: [4, 7],
  },
  enabler: {
    role: "enabler",
    allowedRarities: ["common", "uncommon", "rare"],
    reliabilityWeights: { guaranteed: 2, high: 3, medium: 4, low: 1, chaotic: 0 },
    flexibilityWeights: { 1: 1, 2: 4, 3: 4, 4: 1 },
    ceilingWeights: { low: 1, medium: 4, high: 4, explosive: 1 },
    complexityWeights: { 1: 0, 2: 3, 3: 5, 4: 2, 5: 0 },
    biomeCountWeights: { 1: 1, 2: 5, 3: 4 },
    activationWeights: { groupBenefit: 4, drawCards: 3, gainSun: 3 },
    synergyPool: ["pollination", "growth", "conversion", "trellis", "engine", "canopy"],
    resourceBias: [
      { resource: "water", weight: 1 },
      { resource: "compost", weight: 2 },
      { resource: "mineral", weight: 2 },
      { resource: "pollinator", weight: 3 },
      { resource: "trellis", weight: 2 },
    ],
    basePointRange: [2, 5],
    baseSunRange: [5, 8],
  },
  control: {
    role: "control",
    allowedRarities: ["uncommon", "rare"],
    reliabilityWeights: { guaranteed: 0, high: 2, medium: 5, low: 3, chaotic: 0 },
    flexibilityWeights: { 1: 3, 2: 5, 3: 2, 4: 0 },
    ceilingWeights: { low: 1, medium: 4, high: 4, explosive: 1 },
    complexityWeights: { 1: 0, 2: 2, 3: 4, 4: 3, 5: 1 },
    biomeCountWeights: { 1: 3, 2: 6, 3: 1 },
    activationWeights: { groupBenefit: 5, rollDieTuck: 3, gainSun: 2 },
    synergyPool: ["defense", "groupBenefit", "oasisEdge", "canopy", "pollination"],
    resourceBias: [
      { resource: "water", weight: 1 },
      { resource: "compost", weight: 2 },
      { resource: "mineral", weight: 2 },
      { resource: "pollinator", weight: 2 },
      { resource: "trellis", weight: 3 },
    ],
    basePointRange: [3, 6],
    baseSunRange: [5, 8],
  },
  swing: {
    role: "swing",
    allowedRarities: ["rare", "legendary"],
    reliabilityWeights: { guaranteed: 0, high: 0, medium: 3, low: 4, chaotic: 3 },
    flexibilityWeights: { 1: 4, 2: 4, 3: 2, 4: 0 },
    ceilingWeights: { low: 0, medium: 1, high: 5, explosive: 4 },
    complexityWeights: { 1: 0, 2: 0, 3: 3, 4: 4, 5: 3 },
    biomeCountWeights: { 1: 4, 2: 5, 3: 1 },
    activationWeights: { rollDieTuck: 5, drawCards: 2, gainSun: 3 },
    synergyPool: ["tuck", "sun", "draw", "wild", "canopy"],
    resourceBias: [
      { resource: "water", weight: 1 },
      { resource: "compost", weight: 1 },
      { resource: "mineral", weight: 2 },
      { resource: "pollinator", weight: 2 },
      { resource: "trellis", weight: 4 },
    ],
    basePointRange: [4, 9],
    baseSunRange: [6, 10],
  },
};

const DEFAULT_GENERATOR_CONFIG: GeneratorConfig = {
  deckSize: 60,
  includeOnPlayPowers: true,
  rarityWeights: {
    common: 56,
    uncommon: 27,
    rare: 13,
    legendary: 4,
  },
  roleWeights: {
    engine: 30,
    support: 20,
    enabler: 15,
    payoff: 15,
    vanilla: 10,
    swing: 5,
    control: 5,
    ramp: 10,
    scorer: 10,
  },
};

export class Mulberry32Rng implements SeededRng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick<T>(values: readonly T[]): T {
    if (values.length === 0) {
      throw new Error("Cannot pick from an empty array.");
    }
    return values[this.int(0, values.length - 1)];
  }

  weightedPick<T>(values: Array<{ value: T; weight: number }>): T {
    const filtered = values.filter((entry) => entry.weight > 0);
    if (filtered.length === 0) {
      throw new Error("weightedPick requires at least one positive weight.");
    }

    const total = filtered.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = this.next() * total;

    for (const entry of filtered) {
      roll -= entry.weight;
      if (roll <= 0) {
        return entry.value;
      }
    }

    return filtered[filtered.length - 1].value;
  }

  chance(probability: number): boolean {
    return this.next() < probability;
  }

  shuffle<T>(values: T[]): T[] {
    const clone = [...values];
    for (let i = clone.length - 1; i > 0; i -= 1) {
      const j = this.int(0, i);
      [clone[i], clone[j]] = [clone[j], clone[i]];
    }
    return clone;
  }
}

export class PlantCardGenerator {
  private readonly rng: SeededRng;
  private readonly config: GeneratorConfig;
  private idCounter = 0;
  private usedKeys = new Set<string>();

  constructor(seed = 1, config: Partial<GeneratorConfig> = {}) {
    this.rng = new Mulberry32Rng(seed);
    this.config = {
      ...DEFAULT_GENERATOR_CONFIG,
      ...config,
      rarityWeights: {
        ...DEFAULT_GENERATOR_CONFIG.rarityWeights,
        ...config.rarityWeights,
      },
      roleWeights: {
        ...DEFAULT_GENERATOR_CONFIG.roleWeights,
        ...config.roleWeights,
      },
    };
  }

  generateDeck(overrides: Partial<GeneratorConfig> = {}): GeneratedPlantCard[] {
    const deckSize = overrides.deckSize ?? this.config.deckSize;
    const cards: GeneratedPlantCard[] = [];

    for (let i = 0; i < deckSize; i += 1) {
      cards.push(this.generateCard());
    }

    return this.rng.shuffle(cards).map((card, index) => ({
      ...card,
      id: `${card.key}-${index + 1}`,
    }));
  }

  generateCard(): GeneratedPlantCard {
    const role = this.pickRole();
    const template = ROLE_TEMPLATES[role];
    const rarityBand = this.pickRarityForRole(template);
    const reliability = this.pickFromWeightRecord(template.reliabilityWeights);
    const flexibility = this.pickFromWeightRecord(template.flexibilityWeights);
    const ceiling = this.pickFromWeightRecord(template.ceilingWeights);
    const complexity = this.pickFromWeightRecord(template.complexityWeights);
    const biomeCount = this.pickFromWeightRecord(template.biomeCountWeights);
    const biomes = this.generateBiomes(biomeCount, template.synergyPool);
    const synergyTags = this.generateSynergyTags(template.synergyPool, biomes, role);

    const provisionalWithoutAbility: Omit<HiddenCardAttributes, "powerScore" | "abilityKind"> = {
      role,
      rarityBand,
      reliability,
      flexibility,
      ceiling,
      synergyTags,
      complexity,
    };

    const abilityKind = this.pickAbilityKind(provisionalWithoutAbility);

    const provisionalHidden: Omit<HiddenCardAttributes, "powerScore"> = {
      ...provisionalWithoutAbility,
      abilityKind,
    };

    const onActivate =
      abilityKind === "onActivate" ? this.generateActivationAbility(provisionalHidden) : undefined;

    const onPlay =
      abilityKind === "onPlay" && this.config.includeOnPlayPowers !== false
        ? this.generateOnPlayPower(provisionalHidden)
        : undefined;

    const points = this.generatePoints(template, provisionalHidden, onActivate, onPlay);
    const maxSunTokens = this.generateMaxSunTokens(template, provisionalHidden, onActivate);
    const cost = this.generateCost(template, provisionalHidden, points, maxSunTokens, onActivate, biomes);
    const powerScore = this.calculatePowerScore({
      role,
      rarityBand,
      reliability,
      flexibility,
      ceiling,
      complexity,
      synergyTags,
      abilityKind,
      points,
      maxSunTokens,
      biomes,
      cost,
      onActivate,
      onPlay,
    });

    const hidden: HiddenCardAttributes = {
      ...provisionalHidden,
      powerScore,
    };

    const { key, name } = this.generateName(hidden, biomes);

    const baseCard = {
      id: `${key}-${++this.idCounter}`,
      key,
      name,
      cost,
      points,
      maxSunTokens,
      biomes,
      biome: biomes[0],
      sunlightCapacity: maxSunTokens,
      powers: onPlay ? [onPlay] : undefined,
      hidden,
    };

    if (abilityKind === "onPlay" && onPlay) {
      return {
        ...baseCard,
        abilityKind: "onPlay",
        onPlay,
      };
    }

    if (abilityKind === "onActivate" && onActivate) {
      return {
        ...baseCard,
        abilityKind: "onActivate",
        onActivate,
      };
    }

    return {
      ...baseCard,
      abilityKind: "none",
    };
  }

  calculatePowerScore(input: {
    role: HiddenRole;
    rarityBand: RarityBand;
    reliability: ReliabilityBand;
    flexibility: FlexibilityScore;
    ceiling: CeilingBand;
    complexity: ComplexityScore;
    synergyTags: SynergyTag[];
    abilityKind: AbilityKind;
    points: number;
    maxSunTokens: number;
    biomes: Biome[];
    cost: Partial<Record<Resource, number>>;
    onActivate?: ActivationAbility;
    onPlay?: Power;
  }): number {
    let score = 0;

    score += rarityBaseValue(input.rarityBand);
    score += reliabilityValue(input.reliability);
    score += flexibilityValue(input.flexibility);
    score += ceilingValue(input.ceiling);
    score += complexityValue(input.complexity) * 0.3;
    score += abilityKindValue(input.abilityKind);
    score += abilityValue(input.onActivate);
    score += onPlayValue(input.onPlay);
    score += biomeValue(input.biomes);
    score += input.points * 0.45;
    score += Math.max(0, input.maxSunTokens - 4) * 0.22;
    score += Math.min(1.2, input.synergyTags.length * 0.2);
    score -= costBurden(input.cost);

    return clamp(roundTo(score, 1), 2, 10);
  }

  private pickRole(): HiddenRole {
    const weights = this.config.roleWeights ?? {};
    return this.rng.weightedPick(
      (Object.keys(ROLE_TEMPLATES) as HiddenRole[]).map((role) => ({
        value: role,
        weight: weights[role] ?? 1,
      })),
    );
  }

  private pickRarityForRole(template: RoleTemplate): RarityBand {
    const rarityWeights = this.config.rarityWeights ?? DEFAULT_GENERATOR_CONFIG.rarityWeights!;
    return this.rng.weightedPick(
      template.allowedRarities.map((rarity) => ({
        value: rarity,
        weight: rarityWeights[rarity],
      })),
    );
  }

  private pickFromWeightRecord<T extends string | number>(weights: Record<T, number>): T {
    const entries = Object.entries(weights).map(([value, weight]) => ({
      value: normalizeKey(value) as T,
      weight,
    }));
    return this.rng.weightedPick(entries);
  }

  private pickAbilityKind(
    hidden: Omit<HiddenCardAttributes, "powerScore" | "abilityKind">,
  ): AbilityKind {
    if (this.config.includeOnPlayPowers === false) {
      return this.rng.weightedPick([
        { value: "onActivate" as const, weight: 8 },
        { value: "none" as const, weight: 2 },
      ]);
    }

    switch (hidden.role) {
      case "engine":
      case "ramp":
      case "payoff":
      case "scorer":
        return this.rng.weightedPick([
          { value: "onActivate" as const, weight: 8 },
          { value: "onPlay" as const, weight: 1 },
          { value: "none" as const, weight: 1 },
        ]);
      case "support":
      case "enabler":
        return this.rng.weightedPick([
          { value: "onActivate" as const, weight: 4 },
          { value: "onPlay" as const, weight: 4 },
          { value: "none" as const, weight: 2 },
        ]);
      case "vanilla":
        return this.rng.weightedPick([
          { value: "onActivate" as const, weight: 2 },
          { value: "onPlay" as const, weight: 1 },
          { value: "none" as const, weight: 7 },
        ]);
      case "control":
      case "swing":
        return this.rng.weightedPick([
          { value: "onActivate" as const, weight: 5 },
          { value: "onPlay" as const, weight: 3 },
          { value: "none" as const, weight: 2 },
        ]);
      default:
        return "onActivate";
    }
  }

  private generateBiomes(count: 1 | 2 | 3, synergyPool: SynergyTag[]): Biome[] {
    const preferred = synergyPool.filter(isBiomeTag) as Biome[];
    const biomePool = this.rng.shuffle([...new Set([...preferred, ...BIOMES])]);
    return biomePool.slice(0, count).sort();
  }

  private generateSynergyTags(pool: SynergyTag[], biomes: Biome[], role: HiddenRole): SynergyTag[] {
    const tags = new Set<SynergyTag>();
    const desiredCount = role === "vanilla" ? 2 : this.rng.int(2, 4);

    biomes.forEach((biome) => tags.add(biome));
    if (role === "engine") tags.add("engine");

    while (tags.size < desiredCount) {
      tags.add(this.rng.pick(pool));
    }

    return [...tags];
  }

  private generateActivationAbility(hidden: Omit<HiddenCardAttributes, "powerScore">): ActivationAbility {
    const template = ROLE_TEMPLATES[hidden.role];
    const abilityType = this.rng.weightedPick(
      (Object.entries(template.activationWeights) as Array<[ActivationAbility["type"], number]>).map(
        ([value, weight]) => ({ value, weight }),
      ),
    );

    switch (abilityType) {
      case "rollDieTuck": {
        const threshold = thresholdFromReliability(hidden.reliability, this.rng);
        const tuckCards = hidden.ceiling === "explosive" ? 2 : hidden.ceiling === "high" ? 2 : 1;
        return {
          type: "rollDieTuck",
          effect: {
            die: "d6",
            successIfLessThan: threshold,
            onSuccess: {
              tuckCards,
            },
          },
        };
      }
      case "groupBenefit": {
        const resource = this.pickResourceForRole(hidden.role);
        const allPlayersGainAmount = 1;
        const youGainAmount = hidden.ceiling === "explosive" ? 3 : hidden.ceiling === "high" ? 2 : 1;
        return {
          type: "groupBenefit",
          effect: {
            allPlayersGain: {
              resource,
              amount: allPlayersGainAmount,
            },
            youGain: {
              resource,
              amount: Math.max(1, youGainAmount),
            },
          },
        };
      }
      case "drawCards": {
        const draw = hidden.ceiling === "explosive" ? 3 : hidden.ceiling === "high" ? 2 : 1;
        return {
          type: "drawCards",
          effect: {
            draw,
          },
        };
      }
      case "gainSun":
      default: {
        const amount =
          hidden.ceiling === "explosive"
            ? 4
            : hidden.ceiling === "high"
              ? 3
              : hidden.ceiling === "medium"
                ? 2
                : 1;
        return {
          type: "gainSun",
          effect: {
            amount,
          },
        };
      }
    }
  }

  private generateOnPlayPower(hidden: Omit<HiddenCardAttributes, "powerScore">): Power {
    const resource = this.pickResourceForRole(hidden.role);
    const amount = hidden.rarityBand === "legendary" ? 2 : 1;

    if (hidden.role === "support" || hidden.role === "enabler") {
      return {
        trigger: "onPlay",
        effects: [
          {
            type: "choice",
            options: [
              {
                label: `Gain ${amount} ${resource}`,
                effects: [{ type: "gainResource", resource, amount }],
              },
              {
                label: `Gain ${Math.max(1, amount)} sunlight`,
                effects: [{ type: "gainSunlight", amount: Math.max(1, amount) }],
              },
            ],
          },
        ],
      };
    }

    return {
      trigger: "onPlay",
      effects: [{ type: "gainResource", resource, amount }],
    };
  }

  private generatePoints(
    template: RoleTemplate,
    hidden: Omit<HiddenCardAttributes, "powerScore">,
    onActivate?: ActivationAbility,
    onPlay?: Power,
  ): number {
    let points = this.rng.int(template.basePointRange[0], template.basePointRange[1]);

    points += hidden.flexibility >= 3 ? -1 : 0;
    points += hidden.ceiling === "low" ? 1 : 0;
    points += hidden.ceiling === "explosive" ? -1 : 0;
    points += hidden.reliability === "guaranteed" ? -1 : 0;
    points += hidden.reliability === "low" || hidden.reliability === "chaotic" ? 1 : 0;
    points += hidden.rarityBand === "legendary" ? 1 : 0;
    points += onActivate?.type === "groupBenefit" ? -1 : 0;
    points += onPlay ? -1 : 0;
    points += hidden.abilityKind === "none" ? 1 : 0;

    return clamp(Math.round(points), 1, 9);
  }

  private generateMaxSunTokens(
    template: RoleTemplate,
    hidden: Omit<HiddenCardAttributes, "powerScore">,
    onActivate?: ActivationAbility,
  ): number {
    let maxSun = this.rng.int(template.baseSunRange[0], template.baseSunRange[1]);

    maxSun += hidden.ceiling === "high" ? 1 : 0;
    maxSun += hidden.ceiling === "explosive" ? 2 : 0;
    maxSun += hidden.role === "ramp" ? 1 : 0;
    maxSun += hidden.role === "vanilla" ? -1 : 0;
    maxSun += onActivate?.type === "gainSun" ? 1 : 0;
    maxSun += hidden.abilityKind === "none" ? 1 : 0;

    return clamp(maxSun, 3, 10);
  }

  private generateCost(
    template: RoleTemplate,
    hidden: Omit<HiddenCardAttributes, "powerScore">,
    points: number,
    maxSunTokens: number,
    onActivate: ActivationAbility | undefined,
    biomes: Biome[],
  ): Partial<Record<Resource, number>> {
    const cost: Partial<Record<Resource, number>> = {};
    const weightedResources = template.resourceBias;
    const basePips = baseCostPips(
      hidden.rarityBand,
      hidden.ceiling,
      hidden.flexibility,
      points,
      maxSunTokens,
      hidden.abilityKind,
      onActivate,
    );

    for (let i = 0; i < basePips; i += 1) {
      const resource = this.rng.weightedPick(weightedResources.map((entry) => ({ value: entry.resource, weight: entry.weight })));
      cost[resource] = (cost[resource] ?? 0) + 1;
    }

    if (hidden.role === "swing" && this.rng.chance(0.4)) {
      cost.wild = Math.min(2, (cost.wild ?? 0) + 1);
    }

    if (biomes.includes("canopy") && this.rng.chance(0.45)) {
      cost.trellis = Math.max(1, cost.trellis ?? 0);
    }

    return normalizeCost(cost);
  }

  private generateName(hidden: HiddenCardAttributes, biomes: Biome[]): { key: string; name: string } {
    let prefix = this.rng.pick(NAME_PARTS.prefix);
    let suffix = this.rng.pick(NAME_PARTS.suffix);

    if (hidden.synergyTags.includes("canopy") || biomes.includes("canopy")) {
      suffix = this.rng.pick(["Vine", "Bloom", "Willow", "Orchid"]);
    }

    if (hidden.synergyTags.includes("tuck")) {
      prefix = this.rng.pick(["Ghost", "Shade", "Velvet", "Sword", "Moon"]);
    }

    if (hidden.synergyTags.includes("sun")) {
      prefix = this.rng.pick(["Sun", "Amber", "Golden", "Star", "Cinder"]);
    }

    const name = `${prefix} ${suffix}`;
    const keyBase = slugify(name);
    let key = keyBase;
    let index = 2;

    while (this.usedKeys.has(key)) {
      key = `${keyBase}-${index}`;
      index += 1;
    }

    this.usedKeys.add(key);
    return { key, name };
  }

  private pickResourceForRole(role: HiddenRole): Resource {
    const template = ROLE_TEMPLATES[role];
    return this.rng.weightedPick(template.resourceBias.map((entry) => ({ value: entry.resource, weight: entry.weight })));
  }
}

function rarityBaseValue(rarity: RarityBand): number {
  switch (rarity) {
    case "common":
      return 1.2;
    case "uncommon":
      return 1.8;
    case "rare":
      return 2.4;
    case "legendary":
      return 3.2;
  }
}

function reliabilityValue(reliability: ReliabilityBand): number {
  switch (reliability) {
    case "guaranteed":
      return 1.2;
    case "high":
      return 1;
    case "medium":
      return 0.8;
    case "low":
      return 0.6;
    case "chaotic":
      return 0.7;
  }
}

function flexibilityValue(flexibility: FlexibilityScore): number {
  return [0, 0.5, 1, 1.5, 2][flexibility];
}

function ceilingValue(ceiling: CeilingBand): number {
  switch (ceiling) {
    case "low":
      return 0.3;
    case "medium":
      return 0.8;
    case "high":
      return 1.5;
    case "explosive":
      return 2.4;
  }
}

function complexityValue(complexity: ComplexityScore): number {
  return complexity * 0.4;
}

function abilityKindValue(kind: AbilityKind): number {
  switch (kind) {
    case "onPlay":
      return 0.35;
    case "onActivate":
      return 0.6;
    case "none":
      return -0.2;
  }
}

function abilityValue(ability?: ActivationAbility): number {
  if (!ability) return 0;

  switch (ability.type) {
    case "gainSun":
      return 0.5 + ability.effect.amount * 0.45;
    case "drawCards":
      return 0.6 + ability.effect.draw * 0.65;
    case "rollDieTuck": {
      const successRate = (ability.effect.successIfLessThan - 1) / 6;
      return 0.4 + successRate * ability.effect.onSuccess.tuckCards * 1.2;
    }
    case "groupBenefit":
      return 0.6 + ability.effect.youGain.amount * 0.55 + ability.effect.allPlayersGain.amount * 0.15;
  }
}

function onPlayValue(power?: Power): number {
  if (!power) return 0;

  return power.effects.reduce((sum, effect) => {
    switch (effect.type) {
      case "gainResource":
        return sum + effect.amount * 0.35;
      case "gainSunlight":
        return sum + effect.amount * 0.3;
      case "choice":
        return sum + 0.4;
      default:
        return sum + 0.2;
    }
  }, 0);
}

function biomeValue(biomes: Biome[]): number {
  return biomes.length * 0.25;
}

function costBurden(cost: Partial<Record<Resource, number>>): number {
  return Object.entries(cost).reduce((sum, [resource, amount]) => {
    const value = amount ?? 0;
    if (resource === "wild") {
      return sum + value * 0.9;
    }
    return sum + value * 0.65;
  }, 0);
}

function thresholdFromReliability(reliability: ReliabilityBand, rng: SeededRng): number {
  switch (reliability) {
    case "guaranteed":
      return 7;
    case "high":
      return rng.pick([5, 6]);
    case "medium":
      return rng.pick([4, 5]);
    case "low":
      return rng.pick([3, 4]);
    case "chaotic":
      return rng.pick([2, 3, 5]);
  }
}

function baseCostPips(
  rarity: RarityBand,
  ceiling: CeilingBand,
  flexibility: FlexibilityScore,
  points: number,
  maxSunTokens: number,
  abilityKind: AbilityKind,
  onActivate?: ActivationAbility,
): number {
  let pips = 1;

  pips += rarity === "common" ? 0 : rarity === "uncommon" ? 1 : 2;
  pips += ceiling === "high" ? 1 : ceiling === "explosive" ? 2 : 0;
  pips += flexibility >= 3 ? 1 : 0;
  pips += points >= 6 ? 1 : 0;
  pips += maxSunTokens >= 8 ? 1 : 0;
  pips += abilityKind === "onPlay" ? 0 : 1;
  pips += onActivate?.type === "drawCards" && onActivate.effect.draw >= 2 ? 1 : 0;
  pips += onActivate?.type === "gainSun" && onActivate.effect.amount >= 3 ? 1 : 0;

  return clamp(pips, 1, 5);
}

function normalizeCost(cost: Partial<Record<Resource, number>>): Partial<Record<Resource, number>> {
  const normalized: Partial<Record<Resource, number>> = {};
  for (const resource of [...NON_WILD_RESOURCES, "wild"] as Resource[]) {
    const amount = cost[resource] ?? 0;
    if (amount > 0) {
      normalized[resource] = amount;
    }
  }
  return normalized;
}

function normalizeKey(value: string): string | number {
  const asNumber = Number(value);
  return Number.isNaN(asNumber) ? value : asNumber;
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isBiomeTag(tag: SynergyTag): tag is Biome {
  return tag === "understory" || tag === "oasisEdge" || tag === "canopy";
}

export function createGeneratedDeck(seed = 1, deckSize = 60): GeneratedPlantCard[] {
  const generator = new PlantCardGenerator(seed, { deckSize });
  return generator.generateDeck();
}

export function exampleGeneratedCards(seed = 7): GeneratedPlantCard[] {
  const generator = new PlantCardGenerator(seed, { deckSize: 5 });
  return generator.generateDeck();
}
