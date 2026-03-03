import schema from "../../../docs/power-dsl.schema.json";
import type { Effect } from "../types";

const resourceTypeEnum =
  schema.properties.effects.items.properties.resource.enum satisfies readonly string[];
const resourceTypes = new Set<string>(resourceTypeEnum);

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

  const op = (effect as { op?: unknown }).op;
  if (typeof op !== "string") {
    throw new PowerDslValidationError(`${path}.op must be a string.`);
  }

  switch (op) {
    case "gainResource":
    case "spendResource":
      validateResourceEffect(effect as Record<string, unknown>, path);
      return;
    case "gainSunlight":
    case "scorePoints":
      validatePositiveInt((effect as { amount?: unknown }).amount, `${path}.amount`);
      return;
    case "drawCards":
    case "tuckCard":
      validatePositiveInt((effect as { count?: unknown }).count, `${path}.count`);
      return;
    case "if": {
      const ifEffect = effect as { condition?: unknown; then?: unknown; else?: unknown };
      validateCondition(ifEffect.condition, `${path}.condition`);
      validateEffectArray(ifEffect.then, `${path}.then`);
      if (ifEffect.else !== undefined) validateEffectArray(ifEffect.else, `${path}.else`);
      return;
    }
    case "choice": {
      const options = (effect as { options?: unknown }).options;
      if (!Array.isArray(options) || options.length < 2) {
        throw new PowerDslValidationError(`${path}.options must contain at least 2 options.`);
      }
      options.forEach((opt, i) => {
        const option = opt as { label?: unknown; effects?: unknown };
        if (typeof option.label !== "string" || option.label.length === 0) {
          throw new PowerDslValidationError(`${path}.options[${i}].label must be a non-empty string.`);
        }
        validateEffectArray(option.effects, `${path}.options[${i}].effects`);
      });
      return;
    }
    default:
      throw new PowerDslValidationError(`${path}.op '${op}' is not supported by schema.`);
  }
}

function validateResourceEffect(effect: Record<string, unknown>, path: string): void {
  if (!resourceTypes.has(String(effect.resource))) {
    throw new PowerDslValidationError(`${path}.resource must be one of ${Array.from(resourceTypes).join(", ")}.`);
  }
  validatePositiveInt(effect.amount, `${path}.amount`);
}

function validateCondition(condition: unknown, path: string): void {
  const c = condition as { left?: unknown; operator?: unknown; right?: unknown };
  const operators = new Set(["==", "!=", ">", ">=", "<", "<="]);
  if (!condition || typeof condition !== "object") throw new PowerDslValidationError(`${path} must be an object.`);
  if (typeof c.left !== "string") throw new PowerDslValidationError(`${path}.left must be a string.`);
  if (!operators.has(String(c.operator))) throw new PowerDslValidationError(`${path}.operator is invalid.`);
  if (!("right" in c)) throw new PowerDslValidationError(`${path}.right is required.`);
}

function validateEffectArray(value: unknown, path: string): void {
  if (!Array.isArray(value) || value.length === 0) {
    throw new PowerDslValidationError(`${path} must be a non-empty effects array.`);
  }
  value.forEach((effect, i) => validateEffect(effect, `${path}/${i}`));
}

function validatePositiveInt(value: unknown, path: string): void {
  if (!Number.isInteger(value) || Number(value) < 1) {
    throw new PowerDslValidationError(`${path} must be an integer >= 1.`);
  }
}
