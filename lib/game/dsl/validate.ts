import type { Condition, Effect, Resource } from "../../types";

const RESOURCE_TYPES = new Set<Resource>(["water", "compost", "pollinator", "mineral", "trellis"]);
const CONDITION_OPERATORS = new Set<Condition["operator"]>(["==", "!=", ">", ">=", "<", "<="]);

export class PowerDslValidationError extends Error {}

export function validatePowerDsl(effects: unknown): effects is Effect[] {
  if (!Array.isArray(effects)) {
    throw new PowerDslValidationError("Power DSL must be an array of effects.");
  }

  effects.forEach((effect, index) => validateEffect(effect, `/${index}`));
  return true;
}

function validateEffect(effect: unknown, path: string): void {
  if (!effect || typeof effect !== "object") {
    throw new PowerDslValidationError(`${path} must be an object.`);
  }

  const type = (effect as { type?: unknown }).type;
  if (typeof type !== "string") {
    throw new PowerDslValidationError(`${path}.type must be a string.`);
  }

  switch (type) {
    case "gainResource":
    case "spendResource":
      validateResourceEffect(effect as Record<string, unknown>, path);
      return;
    case "gainSunlight":
    case "spendSunlight":
    case "drawCards":
    case "tuckCards":
    case "discardCards":
    case "if": {
      const ifEffect = effect as { condition?: unknown; then?: unknown; else?: unknown };
      validateCondition(ifEffect.condition, `${path}.condition`);
      validateEffectArray(ifEffect.then, `${path}.then`);
      if (ifEffect.else !== undefined) {
        validateEffectArray(ifEffect.else, `${path}.else`);
      }
      return;
    }
    case "choice": {
      const options = (effect as { options?: unknown }).options;
      if (!Array.isArray(options) || options.length < 2) {
        throw new PowerDslValidationError(`${path}.options must contain at least 2 options.`);
      }

      options.forEach((option, index) => {
        const entry = option as { label?: unknown; effects?: unknown };
        if (typeof entry.label !== "string" || entry.label.length === 0) {
          throw new PowerDslValidationError(`${path}.options[${index}].label must be a non-empty string.`);
        }
        validateEffectArray(entry.effects, `${path}.options[${index}].effects`);
      });
      return;
    }
    default:
      throw new PowerDslValidationError(`${path}.type '${type}' is not supported.`);
  }
}

function validateResourceEffect(effect: Record<string, unknown>, path: string): void {
  if (!RESOURCE_TYPES.has(effect.resource as Resource)) {
    throw new PowerDslValidationError(`${path}.resource must be a valid resource type.`);
  }
  validatePositiveInt(effect.amount, `${path}.amount`);
}

function validateCondition(condition: unknown, path: string): void {
  const c = condition as Condition;
  if (!condition || typeof condition !== "object") {
    throw new PowerDslValidationError(`${path} must be an object.`);
  }

  if (typeof c.left !== "string") {
    throw new PowerDslValidationError(`${path}.left must be a string.`);
  }

  if (!CONDITION_OPERATORS.has(c.operator)) {
    throw new PowerDslValidationError(`${path}.operator is invalid.`);
  }

  if (!("right" in c)) {
    throw new PowerDslValidationError(`${path}.right is required.`);
  }
}

function validateEffectArray(value: unknown, path: string): void {
  if (!Array.isArray(value) || value.length === 0) {
    throw new PowerDslValidationError(`${path} must be a non-empty effects array.`);
  }
  value.forEach((effect, index) => validateEffect(effect, `${path}/${index}`));
}

function validatePositiveInt(value: unknown, path: string): void {
  if (!Number.isInteger(value) || Number(value) < 1) {
    throw new PowerDslValidationError(`${path} must be an integer >= 1.`);
  }
}
