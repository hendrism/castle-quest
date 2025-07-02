import { gameState } from './gameState.js';
import { RESOURCE_TYPES } from './constants.js';

export function canAfford(cost) {
  return Object.keys(cost).every(r => gameState.resources[r] >= cost[r]);
}

export function spendResources(cost) {
  Object.keys(cost).forEach(r => {
    const current = gameState.resources[r] || 0;
    gameState.resources[r] = Math.max(0, current - cost[r]);
  });
}

export function ensureResourceKeys(state = gameState) {
  if (!state.resources) state.resources = {};
  RESOURCE_TYPES.forEach(r => {
    if (typeof state.resources[r] !== 'number') {
      state.resources[r] = 0;
    }
  });
}
