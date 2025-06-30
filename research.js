import { gameState } from './gameState.js';
import { TECHNOLOGIES } from './data/technologies.js';

export function getAvailableTechnologies() {
  return Object.keys(TECHNOLOGIES).filter(key => {
    const tech = TECHNOLOGIES[key];
    if (gameState.technologies.includes(key)) return false;
    if (tech.cultures && !tech.cultures.includes(gameState.culture)) return false;
    return tech.prerequisites.every(p => gameState.technologies.includes(p));
  });
}

export function startResearch(key) {
  if (gameState.research.current) return false;
  if (!TECHNOLOGIES[key]) return false;
  if (!getAvailableTechnologies().includes(key)) return false;
  gameState.research.current = key;
  gameState.research.progress = 0;
  return true;
}

export function progressResearch(points) {
  if (!gameState.research.current) return;
  const key = gameState.research.current;
  const tech = TECHNOLOGIES[key];
  gameState.research.progress += points;
  if (gameState.research.progress >= tech.cost) {
    gameState.research.current = null;
    gameState.research.progress = 0;
    if (!gameState.technologies.includes(key)) {
      gameState.technologies.push(key);
    }
    return key;
  }
  return null;
}

export function getResearchProgress() {
  if (!gameState.research.current) return null;
  const key = gameState.research.current;
  const tech = TECHNOLOGIES[key];
  return { key, progress: gameState.research.progress, cost: tech.cost };
}
