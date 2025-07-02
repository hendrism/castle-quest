import { gameState } from ‘./gameState.js’;

export function rollDice(sides = 20) {
return Math.floor(Math.random() * sides) + 1;
}

export function showDiceRoll(callback) {
const modal = document.getElementById(‘dice-modal’);
const dice = document.getElementById(‘dice’);
const diceFace = document.getElementById(‘dice-face’);
const result = document.getElementById(‘roll-result’);

```
// Show modal immediately
modal.classList.add('show');
dice.classList.add('rolling');
diceFace.textContent = '?';
result.textContent = 'Rolling…';

setTimeout(() => {
    dice.classList.remove('rolling');
    const baseRoll = rollDice();
    let roll = baseRoll;
    const notes = [];

    // Apply roll modifiers
    if (gameState.rollPenalty) {
        roll = Math.max(1, roll - gameState.rollPenalty);
        notes.push(`Food penalty: -${gameState.rollPenalty}`);
    }

    if (gameState.items.luckyCharm > 0) {
        gameState.items.luckyCharm--;
        const boosted = Math.min(20, roll + 2);
        notes.push(`Lucky Charm: +2`);
        roll = boosted;
    }

    // Update dice face display
    diceFace.textContent = roll;

    // Build the initial line
    const lines = [];
    let rollLine = `You rolled ${roll}`;
    if (baseRoll !== roll) {
        rollLine += ` (base: ${baseRoll})`;
    }
    if (notes.length > 0) {
        rollLine += ` (${notes.join(', ')})`;
    }
    lines.push(rollLine);

    // Execute callback and get results
    if (callback) {
        try {
            const callbackResult = callback(roll);
            if (Array.isArray(callbackResult)) {
                lines.push(...callbackResult);
            } else if (callbackResult) {
                lines.push(callbackResult);
            }
        } catch (error) {
            console.error('Callback error:', error);
            lines.push('Error processing results');
        }
    }

    // Update the modal with all results
    result.innerHTML = lines.join('<br>');
    
}, 1000);
```

}

export function closeModal() {
const modal = document.getElementById(‘dice-modal’);
if (modal) {
modal.classList.remove(‘show’);
}
}