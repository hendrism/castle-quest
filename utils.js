import { gameState } from './gameState.js';

export function canAfford(cost) {
  return Object.keys(cost).every(r => gameState.resources[r] >= cost[r]);
}

export function spendResources(cost) {
  Object.keys(cost).forEach(r => {
    gameState.resources[r] -= cost[r];
  });
}
