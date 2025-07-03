export let debugMode = false;
export const eventLog = [];

import { gameState } from './gameState.js';
import { rollDice } from './dice.js';
import { BUILDING_TYPES } from './data/buildings.js';

export function setDebugMode(value) {
  debugMode = value;
  const panel = document.getElementById('debug-panel');
  const toggle = document.getElementById('debug-toggle');
  if (panel) panel.style.display = debugMode ? 'block' : 'none';
  if (toggle) toggle.style.display = debugMode ? 'block' : 'none';
}

export function logEvent(description, data = null) {
  if (!debugMode) return;
  const entry = {
    timestamp: new Date().toLocaleTimeString(),
    description,
    data
  };
  console.log(`[${entry.timestamp}]`, description, data || '');
  eventLog.push(entry);
  if (eventLog.length > 200) eventLog.shift();
  updateLogDisplay();
}

function updateLogDisplay() {
  const logArea = document.getElementById('debug-log');
  if (!logArea) return;
  const entries = eventLog.slice(-50);
  logArea.textContent = entries
    .map(e => `[${e.timestamp}] ${e.description}` + (e.data ? ` ${JSON.stringify(e.data)}` : ''))
    .join('\n');
  logArea.scrollTop = logArea.scrollHeight;
}

export function printGameState() {
  console.log('Current game state:', JSON.parse(JSON.stringify(gameState)));
}

export function copyLog() {
  navigator.clipboard.writeText(JSON.stringify(eventLog, null, 2))
    .then(() => logEvent('Log copied to clipboard'))
    .catch(err => console.error('Copy failed', err));
}

export function runTestScenario() {
  logEvent('Test scenario started');
  const roll = rollDice();
  logEvent(`Rolled a ${roll}`);

  const farm = { id: Date.now(), level: 'basic' };
  gameState.settlement.farms.push(farm);
  logEvent('Built Farm', { id: farm.id });

  const nextLevel = BUILDING_TYPES.farm.levels[farm.level].upgradeTo;
  if (nextLevel) {
    farm.level = nextLevel;
    logEvent('Upgraded Farm', { id: farm.id, level: farm.level });
  } else {
    logEvent('Farm already at max level');
  }

  updateLogDisplay();
}

function setupDebugPanel() {
  const toggle = document.getElementById('debug-toggle');
  const panel = document.getElementById('debug-panel');
  if (toggle) {
    toggle.addEventListener('click', () => panel.classList.toggle('collapsed'));
  }

  const testBtn = document.getElementById('debug-test-btn');
  const copyBtn = document.getElementById('debug-copy-btn');
  const printBtn = document.getElementById('debug-print-btn');

  if (testBtn) testBtn.addEventListener('click', runTestScenario);
  if (copyBtn) copyBtn.addEventListener('click', copyLog);
  if (printBtn) printBtn.addEventListener('click', printGameState);

  setDebugMode(debugMode);
  updateLogDisplay();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupDebugPanel);
} else {
  setupDebugPanel();
}

