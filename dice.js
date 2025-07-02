import { gameState } from ‘./gameState.js’;

export function rollDice(sides = 20) {
return Math.floor(Math.random() * sides) + 1;
}

export function showDiceRoll(callback) {
const modal = document.getElementById(‘dice-modal’);
const dice = document.getElementById(‘dice’);
const diceFace = document.getElementById(‘dice-face’);
const result = document.getElementById(‘roll-result’);

modal.classList.add(‘show’);
dice.classList.add(‘rolling’);
diceFace.textContent = ‘?’;
result.textContent = ‘Rolling…’;

setTimeout(() => {
dice.classList.remove(‘rolling’);
const baseRoll = rollDice();
let roll = baseRoll;
const notes = [];

```
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

// Execute the callback and get details
let detail = '';
if (callback) {
  try {
    detail = callback(roll);
    console.log('Callback returned:', detail); // Debug log
  } catch (err) {
    console.error('Dice roll callback error:', err);
    detail = ['An error occurred'];
  }
}

// Process the callback results
if (Array.isArray(detail) && detail.length > 0) {
  lines.push(...detail);
} else if (detail && typeof detail === 'string') {
  lines.push(detail);
} else {
  // Only add "No effect" if we truly got nothing back
  lines.push('No additional effects');
}

console.log('Final lines for modal:', lines); // Debug log
result.innerHTML = lines.join('<br>');
```

}, 1000);
}

export function closeModal() {
document.getElementById(‘dice-modal’).classList.remove(‘show’);
}