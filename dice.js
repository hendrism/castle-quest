import { gameState } from './gameState.js';

export function rollDice(sides = 20) {
  return Math.floor(Math.random() * sides) + 1;
}

export function showDiceRoll(callback) {
  const modal = document.getElementById('dice-modal');
  const dice = document.getElementById('dice');
   document.getElementById('dice-face');
  const result = document.getElementById('roll-result');

  modal.classList.add('show');
  dice.classList.add('rolling');
  diceFace.textContent = '?';
  result.textContent = 'Rolling...';

  setTimeout(() => {
    dice.classList.remove('rolling');
    const baseRoll = rollDice();
    let roll = baseRoll;
    const notes = [];

    if (gameState.rollPenalty) {
      roll = Math.max(1, roll - gameState.rollPenalty);
      notes.push(`Food penalty: -${gameState.rollPenalty} = ${roll}`);
    }

    if (gameState.items.luckyCharm > 0) {
      gameState.items.luckyCharm--;
      const boosted = Math.min(20, roll + 2);
      notes.push(`Lucky Charm: +2 = ${boosted}`);
      roll = boosted;
    }

    diceFace.textContent = roll;

    const lines = [];
    let rollLine = `You rolled a ${roll}.`;
    if (notes.length) {
      rollLine += ` (${notes.join(', ')})`;
    }
    lines.push(import { gameState } from './gameState.js';

export function rollDice(sides = 20) {
  return Math.floor(Math.random() * sides) + 1;
}

export function showDiceRoll(callback) {
  const modal = document.getElementById('dice-modal');
  const dice = document.getElementById('dice');
  const diceFace = document.getElementById('dice-face'); // Fixed: Added const diceFace =
  const result = document.getElementById('roll-result');

  modal.classList.add('show');
  dice.classList.add('rolling');
  diceFace.textContent = '?';
  result.textContent = 'Rolling...';

  setTimeout(() => {
    dice.classList.remove('rolling');
    const baseRoll = rollDice();
    let roll = baseRoll;
    const notes = [];

    if (gameState.rollPenalty) {
      roll = Math.max(1, roll - gameState.rollPenalty);
      notes.push(`Food penalty: -${gameState.rollPenalty} = ${roll}`);
    }

    if (gameState.items.luckyCharm > 0) {
      gameState.items.luckyCharm--;
      const boosted = Math.min(20, roll + 2);
      notes.push(`Lucky Charm: +2 = ${boosted}`);
      roll = boosted;
    }

    diceFace.textContent = roll;

    const lines = [];
    let rollLine = `You rolled a ${roll}.`;
    if (notes.length) {
      rollLine += ` (${notes.join(', ')})`;
    }
    lines.push(rollLine);

    let detail = '';
    if (callback) {
      try {
        detail = callback(roll) || '';
      } catch (err) {
        console.error('Dice roll callback error:', err);
        detail = 'An error occurred';
      }
    }

    if (Array.isArray(detail)) {
      lines.push(...detail);
    } else if (detail) {
      lines.push(detail);
    }
    if (lines.length === 1) {
      lines.push('No effect');
    }

    result.innerHTML = lines.join('<br>');
  }, 1000);
}

export function closeModal() {
  document.getElementById('dice-modal').classList.remove('show');
}