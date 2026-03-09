# Blossom Card Generation Rules

## Purpose

This document defines the **hidden balancing attributes and rules used to generate plant cards** for the Blossom game.

These attributes are **not shown to players**.
They exist to ensure the generated deck maintains:

* balanced power distribution
* clear archetypes
* healthy strategic diversity
* predictable complexity levels

Every generated card **must include these hidden attributes** before its visible attributes are determined.

---

# Hidden Attributes

Each card must include the following hidden attributes.

```text
role
rarityBand
reliability
flexibility
ceiling
synergyTags
powerScore
complexity
```

These attributes influence how the rest of the card is generated.

---

# role

## Definition

Defines the **strategic function** of the card in a player's engine.

The role determines:

* the type of effect
* the expected strength of the ability
* the point value range
* synergy expectations

## Allowed Values

```text
vanilla
engine
ramp
support
payoff
scorer
enabler
control
swing
```

## Role Meanings

### vanilla

* Minimal ability
* Higher printed points
* Reliable baseline cards

### engine

* Repeatable value generation
* Usually activates most turns
* Moderate printed points

### ramp

* Generates resources
* Accelerates plant deployment

### support

* Improves other plants
* Enhances biome or token interactions
* ex. Repeat a power in this row.

### payoff

* Weak alone
* Strong when combined with supporting cards

### enabler

* Unlocks archetypes
* Enables specific strategies
* ex. Gain 2 water from the suppoy

### swing

* High variance
* Unpredictable but potentially powerful
* ex. Discard 1 water and tuck two cards

### control

* Group benefi
* ex. Everyone gains 1 water, you gain 2

---

# rarityBand

## Definition

Controls **how frequently the card appears in the deck** and the **maximum complexity or strength allowed**.

## Allowed Values

```text
common
uncommon
rare
legendary
```

## Rarity Meaning

### common

* simple abilities
* stable effects
* low complexity

### uncommon

* moderate effects
* mild synergy

### rare

* stronger synergy cards
* more complex abilities

### legendary

* extremely impactful
* unique build-around mechanics

---

# reliability

## Definition

Measures **how consistently the ability produces value**.

Reliable cards must usually be weaker in other dimensions.

## Allowed Values

```text
guaranteed
high
medium
low
chaotic
```

## Reliability Meaning

### guaranteed

* always produces effect

### high

* very consistent triggers

### medium

* probabilistic or conditional

### low

* rare triggers but stronger outcomes

### chaotic

* unpredictable outcomes

---

# flexibility

## Definition

Represents **how easily the card can be placed or used**.

Flexibility usually corresponds to **biome compatibility**.

Higher flexibility increases power and must be balanced elsewhere.

## Allowed Values

```text
1
2
3
4
```

## Meaning

### 1 — specialist

Single biome, narrow usage

### 2 — semi-flexible

Two biomes (most common)

### 3 — flexible

Multiple placement options

### 4 — universal

Extremely flexible, rare

---

# ceiling

## Definition

Represents the **maximum potential value output** if the card is used optimally.

## Allowed Values

```text
low
medium
high
explosive
```

## Meaning

### low

Limited scaling

### medium

Moderate growth

### high

Strong synergy potential

### explosive

Game-defining potential

---

# synergyTags

## Definition

Tags used to organize cards into **strategic archetypes**.

Multiple tags may be used.

## Allowed Values

```text
tuck
draw
sun
growth
pollination
water
compost
mineral
trellis
desert
understory
oasis
spread
engine
conversion
defense
storm
```

Example:

```ts
synergyTags: ["tuck", "understory"]
```

---

# powerScore

## Definition

Internal numeric score estimating the **total strength of the card**.

This is used by the generator to ensure balance.

Players never see this value.

## Allowed Range

```text
2.0 – 10.0
```

## Typical Scale

```text
2.0  very weak filler
3.5  low power
5.0  average card
6.5  strong card
8.0  build-around
9.5  legendary power
```

The generator should adjust:

* cost
* ability strength
* flexibility
* points

to maintain the target `powerScore`.

---

# complexity

## Definition

Measures **how cognitively difficult the card is to understand or execute**.

## Allowed Values

```text
1
2
3
4
5
```

## Meaning

### 1

Extremely simple

### 2

Simple effect

### 3

Moderate conditional logic

### 4

Complex interactions

### 5

Expert-level mechanics

---

# Deck Composition Guidelines

A healthy deck should roughly follow this distribution.

## Rarity Distribution

```text
Common:     50–60%
Uncommon:   25–30%
Rare:       10–15%
Legendary:   2–5%
```

---

## Role Distribution

```text
Engine      30%
Support     20%
Enabler     15%
Payoff      15%
Vanilla     10%
Swing        5%
Control      5%
```

---

# Card Generation Procedure

When generating a card, follow this order:

## Step 1 — Assign Rarity

Select a rarity according to deck distribution.

---

## Step 2 — Assign Role

Choose a role compatible with the rarity.

Example:

* common → vanilla, engine, support
* rare → payoff, enabler
* legendary → swing, explosive payoff

---

## Step 3 — Assign Hidden Attributes

Assign:

```text
reliability
flexibility
ceiling
synergyTags
powerScore
complexity
```

Ensure these attributes form a **balanced package**.

Example:

High ceiling → lower reliability
High flexibility → lower points or higher cost

---

## Step 4 — Generate Visible Attributes

Using the hidden attributes, generate:

```text
points
cost
biomes
maxSunTokens
ability
```

---

## Step 5 — Apply Compensation Rules

Every strong feature must pay a cost somewhere.

Examples:

High flexibility → reduce points
Guaranteed effect → reduce ceiling
Explosive ceiling → narrow biome options
High powerScore → higher cost

---

# Example Card

```ts
{
  key: "sword-fern",
  name: "Sword Fern",

  role: "engine",
  rarityBand: "common",
  reliability: "medium",
  flexibility: 2,
  ceiling: "medium",
  synergyTags: ["tuck", "understory"],
  powerScore: 5.5,
  complexity: 2,

  points: 3,

  cost: {
    water: 1,
    compost: 1
  },

  onActivate: {
    type: "rollDieTuck",
    effect: {
      die: "d6",
      successIfLessThan: 5,
      onSuccess: {
        tuckCards: 1
      }
    }
  },

  maxSunTokens: 6,

  biomes: ["understory", "oasisEdge"]
}
```

---

# Core Balancing Principle

Each card must represent a **tradeoff package**.

If a card gains strength in one dimension, it must lose strength in another.

Possible balancing knobs:

```text
cost
points
biome flexibility
ability reliability
ability ceiling
activation timing
sun token capacity
```

A well-balanced deck emerges from **many small tradeoffs rather than random values**.
