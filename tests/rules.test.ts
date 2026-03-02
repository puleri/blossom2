import { describe, it } from 'vitest';

describe('rules: right-to-left activation order', () => {
  it.todo('activates root row right-to-left (right-most plant first)');
  it.todo('activates toTheSun row right-to-left (right-most plant first)');
  it.todo('activates pollinate row right-to-left (right-most plant first)');
});

describe('rules: onMature trigger de-duplication', () => {
  it.todo('fires onMature exactly once when sunlight first reaches capacity');
  it.todo('does not fire onMature again across repeated toTheSun actions after maturity');
});

describe('rules: invalid turns/actions', () => {
  it.todo('rejects action from a non-current player');
  it.todo('rejects grow when resources are insufficient');
  it.todo('rejects grow when card is missing from player hand');
});

describe('rules: draw/deck exhaustion behavior', () => {
  it.todo('draws only available cards when deck has fewer cards than requested');
  it.todo('handles empty deck/tray without throwing and without negative counts');
});
