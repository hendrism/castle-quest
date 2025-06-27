// Game state
let gameState = {
day: 1,
level: 1,
xp: 0,
xpToNext: 100,
season: ‘spring’,
explorationsLeft: 5,
resources: {
wood: 0,
stone: 0,
metal: 0,
food: 0
},
settlement: {
home: ‘camp’,
walls: ‘none’,
farms: [],
quarries: []
},
items: {
luckyCharm: 0
},
dailyChallenge: {
explored: new Set(),
completed: false
},
eventLog: []
};

// Game data
const locations = {
forest: {
name: ‘Deep Forest’,
icon: ‘🌲’,
description: ‘Rich in wood and wildlife’,
rewards: { wood: [1, 4], food: [0, 2] }
},
quarry: {
name: ‘Stone Quarry’,
icon: ‘⛰️’,
description: ‘Source of stone and metal’,
rewards: { stone: [1, 3], metal: [0, 1] }
},
ruins: {
name: ‘Ancient Ruins’,
icon: ‘🏛️’,
description: ‘Mysterious treasures await’,
rewards: { wood: [0, 2], stone: [0, 2], metal: [0, 2], food: [0, 1] }
},
plains: {
name: ‘Fertile Plains’,
icon: ‘🌾’,
description: ‘Food and farming supplies’,
rewards: { food: [1, 3], wood: [0, 1] }
}
};

const seasons = {
spring: { name: ‘Spring’, icon: ‘🌸’, farmMultiplier: 1.2 },
summer: { name: ‘Summer’, icon: ‘☀️’, farmMultiplier: 1.5 },
autumn: { name: ‘Autumn’, icon: ‘🍂’, farmMultiplier: 1.0 },
winter: { name: ‘Winter’, icon: ‘❄️’, farmMultiplier: 0.8 }
};

const homeTypes = {
camp: { name: ‘Camp’, upgradeTo: ‘house’, cost: { wood: 5 }, maxBuildings: 2 },
house: { name: ‘House’, upgradeTo: ‘hall’, cost: { wood: 10, stone: 5 }, maxBuildings: 3 },
hall: { name: ‘Hall’, upgradeTo: ‘fortress’, cost: { stone: 20, metal: 5 }, maxBuildings: 4 },
fortress: { name: ‘Fortress’, upgradeTo: null, cost: null, maxBuildings: 5 }
};

const wallTypes = {
none: { name: ‘None’, upgradeTo: ‘earthen’, cost: { wood: 5 } },
earthen: { name: ‘Earthen’, upgradeTo: ‘wood’, cost: { wood: 10 } },
wood: { name: ‘Wood’, upgradeTo: ‘stone’, cost: { stone: 20 } },
stone: { name: ‘Stone’, upgradeTo: null, cost: null }
};

const buildingTypes = {
farm: {
name: ‘Farm’,
icon: ‘🌾’,
buildCost: { wood: 1, stone: 1 },
levels: {
basic: { name: ‘Basic’, upgradeTo: ‘improved’, cost: { wood: 2 }, production: 1 },
improved: { name: ‘Improved’, upgradeTo: ‘advanced’, cost: { wood: 5, stone: 2 }, production: 2 },
advanced: { name: ‘Advanced’, upgradeTo: ‘master’, cost: { wood: 10, stone: 5, metal: 2 }, production: 3 },
master: { name: ‘Master’, upgradeTo: null, cost: null, production: 5 }
}
},
quarry: {
name: ‘Quarry’,
icon: ‘⛏️’,
buildCost: { wood: 1, stone: 2 },
levels: {
basic: { name: ‘Basic’, upgradeTo: ‘improved’, cost: { wood: 2 }, production: 1 },
improved: { name: ‘Improved’, upgradeTo: ‘advanced’, cost: { wood: 5, stone: 2 }, production: 2 },
advanced: { name: ‘Advanced’, upgradeTo: ‘master’, cost: { wood: 10, stone: 5, metal: 2 }, production: 3 },
master: { name: ‘Master’, upgradeTo: null, cost: null, production: 5 }
}
}
};

// Initialize game
function initGame() {
loadGame();
updateUI();
setupEventListeners();

```
// Register service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
        .then(registration => console.log('SW registered'))
        .catch(error => console.log('SW registration failed'));
}
```

}

// Event listeners
function setupEventListeners() {
// Location exploration
document.querySelectorAll(’.location-btn’).forEach(btn => {
btn.addEventListener(‘click’, () => {
const location = btn.dataset.location;
exploreLocation(location);
});
});

```
// Sleep button
document.getElementById('sleep-btn').addEventListener('click', sleep);

// Settlement upgrades
document.getElementById('home-upgrade-btn').addEventListener('click', upgradeHome);
document.getElementById('walls-upgrade-btn').addEventListener('click', upgradeWalls);

// Building construction
document.getElementById('build-farm-btn').addEventListener('click', () => buildBuilding('farm'));
document.getElementById('build-quarry-btn').addEventListener('click', () => buildBuilding('quarry'));

// Crafting
document.getElementById('craft-lucky-charm').addEventListener('click', craftLuckyCharm);

// Event log controls
document.getElementById('clear-log-btn').addEventListener('click', clearEventLog);
document.getElementById('text-size-select').addEventListener('change', changeTextSize);

// Modal controls
document.getElementById('close-modal-btn').addEventListener('click', closeModal);
```

}

// Exploration
function exploreLocation(locationKey) {
if (gameState.explorationsLeft <= 0) return;

```
const location = locations[locationKey];
gameState.explorationsLeft--;
gameState.dailyChallenge.explored.add(locationKey);

// Check daily challenge completion
if (gameState.dailyChallenge.explored.size === 4 && !gameState.dailyChallenge.completed) {
    gameState.dailyChallenge.completed = true;
    addEventLog('🎯 Daily Challenge completed! Bonus XP gained.', 'success');
    gainXP(50);
}

// Roll dice and show modal
showDiceRoll(() => {
    const roll = rollDice();
    const result = calculateExplorationResult(locationKey, roll);
    
    // Apply rewards
    Object.keys(result.rewards).forEach(resource => {
        gameState.resources[resource] += result.rewards[resource];
    });

    // Gain XP
    gainXP(result.xp);

    // Log event
    addEventLog(result.message, result.type);

    updateUI();
    saveGame();
});
```

}

function calculateExplorationResult(locationKey, roll) {
const location = locations[locationKey];
const luckyCharmBonus = gameState.items.luckyCharm > 0 ? 2 : 0;
const effectiveRoll = Math.min(20, roll + luckyCharmBonus);

```
let multiplier = 1;
let type = 'neutral';
let message = '';

if (effectiveRoll === 1) {
    multiplier = 0;
    type = 'failure';
    message = `💀 Critical failure at ${location.name}! You gained nothing and lost 1 food.`;
    return {
        rewards: { food: -1 },
        xp: 5,
        message,
        type
    };
} else if (effectiveRoll >= 18) {
    multiplier = 2;
    type = 'success';
    message = `✨ Amazing success at ${location.name}! Double rewards!`;
} else if (effectiveRoll >= 12) {
    multiplier = 1.5;
    type = 'success';
    message = `⭐ Good results at ${location.name}!`;
} else if (effectiveRoll >= 6) {
    multiplier = 1;
    type = 'neutral';
    message = `📦 Decent exploration at ${location.name}.`;
} else {
    multiplier = 0.5;
    type = 'failure';
    message = `😞 Poor exploration at ${location.name}.`;
}

const rewards = {};
Object.keys(location.rewards).forEach(resource => {
    const [min, max] = location.rewards[resource];
    const base = min + Math.floor(Math.random() * (max - min + 1));
    rewards[resource] = Math.floor(base * multiplier);
});

const xp = 10 + (effectiveRoll >= 15 ? 10 : 0);

return { rewards, xp, message, type };
```

}

// Sleep and day progression
function sleep() {
// Overnight event
const eventRoll = rollDice();
let eventMessage = ‘’;
let eventType = ‘neutral’;

```
if (eventRoll <= 5) {
    // Bad event
    const badEvents = [
        { message: '🌧️ Heavy rain damaged your supplies!', effect: () => { gameState.resources.wood = Math.max(0, gameState.resources.wood - 2); } },
        { message: '🐺 Wolves attacked your settlement!', effect: () => { gameState.resources.food = Math.max(0, gameState.resources.food - 3); } },
        { message: '⛈️ A storm scattered your materials!', effect: () => { gameState.resources.stone = Math.max(0, gameState.resources.stone - 1); } }
    ];
    const event = badEvents[Math.floor(Math.random() * badEvents.length)];
    event.effect();
    eventMessage = event.message;
    eventType = 'failure';
} else if (eventRoll >= 16) {
    // Good event
    const goodEvents = [
        { message: '🌟 Friendly travelers shared supplies!', effect: () => { gameState.resources.food += 2; gameState.resources.wood += 1; } },
        { message: '💎 You found precious materials!', effect: () => { gameState.resources.metal += 1; gameState.resources.stone += 2; } },
        { message: '🎁 A merchant gave you gifts!', effect: () => { gameState.resources.wood += 3; gainXP(25); } }
    ];
    const event = goodEvents[Math.floor(Math.random() * goodEvents.length)];
    event.effect();
    eventMessage = event.message;
    eventType = 'success';
} else {
    // Neutral event
    eventMessage = '🌙 You had a peaceful night\'s rest.';
    eventType = 'neutral';
}

// Daily production from buildings
let totalFoodProduction = 0;
let totalStoneProduction = 0;

gameState.settlement.farms.forEach(farm => {
    const production = buildingTypes.farm.levels[farm.level].production;
    const seasonMultiplier = seasons[gameState.season].farmMultiplier;
    totalFoodProduction += Math.floor(production * seasonMultiplier);
});

gameState.settlement.quarries.forEach(quarry => {
    const production = buildingTypes.quarry.levels[quarry.level].production;
    totalStoneProduction += production;
});

gameState.resources.food += totalFoodProduction;
gameState.resources.stone += totalStoneProduction;

if (totalFoodProduction > 0 || totalStoneProduction > 0) {
    addEventLog(`🏭 Daily production: +${totalFoodProduction} food, +${totalStoneProduction} stone`, 'success');
}

// Progress day
gameState.day++;
gameState.explorationsLeft = 5;
gameState.dailyChallenge.explored.clear();
gameState.dailyChallenge.completed = false;

// Change season every 4 days
const seasonKeys = Object.keys(seasons);
const seasonIndex = Math.floor((gameState.day - 1) / 4) % seasonKeys.length;
gameState.season = seasonKeys[seasonIndex];

// Add event log
addEventLog(eventMessage, eventType);
addEventLog(`🌅 Day ${gameState.day} begins. Season: ${seasons[gameState.season].icon} ${seasons[gameState.season].name}`, 'neutral');

updateUI();
saveGame();
```

}

// Settlement management
function upgradeHome() {
const currentHome = homeTypes[gameState.settlement.home];
if (!currentHome.upgradeTo) return;

```
const upgradeCost = currentHome.cost;
if (!canAfford(upgradeCost)) return;

spendResources(upgradeCost);
gameState.settlement.home = currentHome.upgradeTo;

const newHome = homeTypes[gameState.settlement.home];
addEventLog(`🏠 Upgraded home to ${newHome.name}!`, 'success');
gainXP(100);

updateUI();
saveGame();
```

}

function upgradeWalls() {
const currentWalls = wallTypes[gameState.settlement.walls];
if (!currentWalls.upgradeTo) return;

```
const upgradeCost = currentWalls.cost;
if (!canAfford(upgradeCost)) return;

spendResources(upgradeCost);
gameState.settlement.walls = currentWalls.upgradeTo;

const newWalls = wallTypes[gameState.settlement.walls];
addEventLog(`🛡️ Built ${newWalls.name} walls!`, 'success');
gainXP(75);

updateUI();
saveGame();
```

}

function buildBuilding(type) {
const buildingType = buildingTypes[type];
const maxBuildings = homeTypes[gameState.settlement.home].maxBuildings;
const currentCount = gameState.settlement[type + ‘s’].length;

```
if (currentCount >= maxBuildings) return;
if (!canAfford(buildingType.buildCost)) return;

spendResources(buildingType.buildCost);

const newBuilding = {
    id: Date.now(),
    level: 'basic'
};

gameState.settlement[type + 's'].push(newBuilding);
addEventLog(`${buildingType.icon} Built new ${buildingType.name}!`, 'success');
gainXP(50);

updateUI();
saveGame();
```

}

function upgradeBuilding(type, buildingId) {
const buildings = gameState.settlement[type + ‘s’];
const building = buildings.find(b => b.id === buildingId);
if (!building) return;

```
const currentLevel = buildingTypes[type].levels[building.level];
if (!currentLevel.upgradeTo) return;
if (!canAfford(currentLevel.cost)) return;

spendResources(currentLevel.cost);
building.level = currentLevel.upgradeTo;

const newLevel = buildingTypes[type].levels[building.level];
addEventLog(`⬆️ Upgraded ${buildingTypes[type].name} to ${newLevel.name}!`, 'success');
gainXP(25);

updateUI();
saveGame();
```

}

// Crafting
function craftLuckyCharm() {
const cost = { wood: 3, stone: 2 };
if (!canAfford(cost)) return;

```
spendResources(cost);
gameState.items.luckyCharm++;
addEventLog('🍀 Crafted a Lucky Charm! (+2 to exploration rolls)', 'success');
gainXP(30);

updateUI();
saveGame();
```

}

// Helper functions
function rollDice() {
return Math.floor(Math.random() * 20) + 1;
}

function canAfford(cost) {
return Object.keys(cost).every(resource =>
gameState.resources[resource] >= cost[resource]
);
}

function spendResources(cost) {
Object.keys(cost).forEach(resource => {
gameState.resources[resource] -= cost[resource];
});
}

function gainXP(amount) {
gameState.xp += amount;

```
while (gameState.xp >= gameState.xpToNext) {
    gameState.xp -= gameState.xpToNext;
    gameState.level++;
    gameState.xpToNext = Math.floor(gameState.xpToNext * 1.2);
    addEventLog(`🎉 Level up! You are now level ${gameState.level}!`, 'success');
}
```

}

function addEventLog(message, type = ‘neutral’) {
const timestamp = new Date().toLocaleTimeString();
gameState.eventLog.unshift({
message,
type,
timestamp,
day: gameState.day
});

```
// Keep only last 50 entries
if (gameState.eventLog.length > 50) {
    gameState.eventLog = gameState.eventLog.slice(0, 50);
}
```

}

function clearEventLog() {
gameState.eventLog = [];
updateUI();
saveGame();
}

function changeTextSize() {
const size = document.getElementById(‘text-size-select’).value;
const logContent = document.getElementById(‘event-log-content’);
logContent.className = `log-content ${size}`;
}

// Modal functions
function showDiceRoll(callback) {
const modal = document.getElementById(‘dice-modal’);
const dice = document.getElementById(‘dice’);
const diceFace = dice.querySelector(’.dice-face’);
const result = document.getElementById(‘roll-result’);

```
modal.classList.add('show');
dice.classList.add('rolling');
diceFace.textContent = '?';
result.textContent = 'Rolling...';

setTimeout(() => {
    dice.classList.remove('rolling');
    const roll = rollDice();
    diceFace.textContent = roll;
    
    let resultText = `You rolled a ${roll}!`;
    if (roll === 1) resultText += ' Critical failure!';
    else if (roll === 20) resultText += ' Critical success!';
    else if (roll >= 18) resultText += ' Amazing!';
    else if (roll >= 12) resultText += ' Good roll!';
    else if (roll <= 5) resultText += ' Poor roll...';
    
    if (gameState.items.luckyCharm > 0) {
        resultText += ` (Lucky Charm: +2 = ${Math.min(20, roll + 2)})`;
    }
    
    result.textContent = resultText;
    
    if (callback) callback();
}, 1000);
```

}

function closeModal() {
document.getElementById(‘dice-modal’).classList.remove(‘show’);
}

// UI Updates
function updateUI() {
// Update header
document.getElementById(‘day’).textContent = gameState.day;
document.getElementById(‘level’).textContent = gameState.level;
document.getElementById(‘xp’).textContent = gameState.xp;
document.getElementById(‘xp-next’).textContent = gameState.xpToNext;
document.getElementById(‘season’).textContent = `${seasons[gameState.season].icon} ${seasons[gameState.season].name}`;

```
// Update resources
Object.keys(gameState.resources).forEach(resource => {
    document.getElementById(resource).textContent = gameState.resources[resource];
});

// Update exploration
document.getElementById('explorations-left').textContent = gameState.explorationsLeft;

// Enable/disable location buttons
document.querySelectorAll('.location-btn').forEach(btn => {
    btn.disabled = gameState.explorationsLeft <= 0;
});

// Enable/disable sleep button
document.getElementById('sleep-btn').disabled = gameState.explorationsLeft > 0;

// Update settlement
updateSettlementUI();

// Update event log
updateEventLogUI();
```

}

function updateSettlementUI() {
// Home upgrade
const currentHome = homeTypes[gameState.settlement.home];
const homeUpgradeBtn = document.getElementById(‘home-upgrade-btn’);
document.getElementById(‘home-level’).textContent = currentHome.name;

```
if (currentHome.upgradeTo) {
    const nextHome = homeTypes[currentHome.upgradeTo];
    const costText = Object.keys(currentHome.cost).map(r => 
        `${currentHome.cost[r]} ${getResourceIcon(r)}`
    ).join(' ');
    
    homeUpgradeBtn.querySelector('.upgrade-text').textContent = `Upgrade to ${nextHome.name}`;
    homeUpgradeBtn.querySelector('.upgrade-cost').textContent = costText;
    homeUpgradeBtn.disabled = !canAfford(currentHome.cost);
    homeUpgradeBtn.style.display = 'flex';
} else {
    homeUpgradeBtn.style.display = 'none';
}

// Walls upgrade
const currentWalls = wallTypes[gameState.settlement.walls];
const wallsUpgradeBtn = document.getElementById('walls-upgrade-btn');
document.getElementById('walls-level').textContent = currentWalls.name;

if (currentWalls.upgradeTo) {
    const nextWalls = wallTypes[currentWalls.upgradeTo];
    const costText = Object.keys(currentWalls.cost).map(r => 
        `${currentWalls.cost[r]} ${getResourceIcon(r)}`
    ).join(' ');
    
    wallsUpgradeBtn.querySelector('.upgrade-text').textContent = `Build ${nextWalls.name} Walls`;
    wallsUpgradeBtn.querySelector('.upgrade-cost').textContent = costText;
    wallsUpgradeBtn.disabled = !canAfford(currentWalls.cost);
    wallsUpgradeBtn.style.display = 'flex';
} else {
    wallsUpgradeBtn.style.display = 'none';
}

// Buildings
updateBuildingsUI();

// Items
document.getElementById('lucky-charm-count').textContent = gameState.items.luckyCharm;
document.getElementById('craft-lucky-charm').disabled = !canAfford({ wood: 3, stone: 2 });
```

}

function updateBuildingsUI() {
const maxBuildings = homeTypes[gameState.settlement.home].maxBuildings;

```
// Farms
document.getElementById('farm-count').textContent = gameState.settlement.farms.length;
document.getElementById('farm-max').textContent = maxBuildings;
document.getElementById('build-farm-btn').disabled = 
    gameState.settlement.farms.length >= maxBuildings || 
    !canAfford(buildingTypes.farm.buildCost);

const farmsContainer = document.getElementById('farms-container');
farmsContainer.innerHTML = '';
gameState.settlement.farms.forEach(farm => {
    const farmElement = createBuildingElement('farm', farm);
    farmsContainer.appendChild(farmElement);
});

// Quarries
document.getElementById('quarry-count').textContent = gameState.settlement.quarries.length;
document.getElementById('quarry-max').textContent = maxBuildings;
document.getElementById('build-quarry-btn').disabled = 
    gameState.settlement.quarries.length >= maxBuildings || 
    !canAfford(buildingTypes.quarry.buildCost);

const quarriesContainer = document.getElementById('quarries-container');
quarriesContainer.innerHTML = '';
gameState.settlement.quarries.forEach(quarry => {
    const quarryElement = createBuildingElement('quarry', quarry);
    quarriesContainer.appendChild(quarryElement);
});
```

}

function createBuildingElement(type, building) {
const buildingType = buildingTypes[type];
const currentLevel = buildingType.levels[building.level];

```
const div = document.createElement('div');
div.className = 'building-item';

div.innerHTML = `
    <div class="building-info">
        <div class="building-name">${buildingType.icon} ${buildingType.name}</div>
        <div class="building-level">${currentLevel.name} (${currentLevel.production} production)</div>
    </div>
    ${currentLevel.upgradeTo ? `
        <button class="upgrade-btn" onclick="upgradeBuilding('${type}', ${building.id})" 
                ${!canAfford(currentLevel.cost) ? 'disabled' : ''}>
            <span class="upgrade-text">Upgrade to ${buildingType.levels[currentLevel.upgradeTo].name}</span>
            <span class="upgrade-cost">${Object.keys(currentLevel.cost).map(r => 
                `${currentLevel.cost[r]} ${getResourceIcon(r)}`
            ).join(' ')}</span>
        </button>
    ` : ''}
`;

return div;
```

}

function updateEventLogUI() {
const logContent = document.getElementById(‘event-log-content’);
logContent.innerHTML = ‘’;

```
gameState.eventLog.forEach(entry => {
    const div = document.createElement('div');
    div.className = `log-entry ${entry.type}`;
    div.innerHTML = `
        <div><strong>Day ${entry.day}</strong> - ${entry.timestamp}</div>
        <div>${entry.message}</div>
    `;
    logContent.appendChild(div);
});
```

}

function getResourceIcon(resource) {
const icons = {
wood: ‘🪵’,
stone: ‘🗿’,
metal: ‘⚔️’,
food: ‘🌾’
};
return icons[resource] || resource;
}

// Save/Load
function saveGame() {
const saveData = {
…gameState,
dailyChallenge: {
explored: Array.from(gameState.dailyChallenge.explored),
completed: gameState.dailyChallenge.completed
}
};

```
try {
    const gameData = JSON.stringify(saveData);
    // Store in memory instead of localStorage for Claude.ai compatibility
    window.dicecastleGameData = gameData;
    console.log('Game saved to memory');
} catch (error) {
    console.error('Failed to save game:', error);
}
```

}

function loadGame() {
try {
// Load from memory instead of localStorage
const savedData = window.dicecastleGameData;
if (savedData) {
const loadedState = JSON.parse(savedData);

```
        // Restore Set from array
        if (loadedState.dailyChallenge && loadedState.dailyChallenge.explored) {
            loadedState.dailyChallenge.explored = new Set(loadedState.dailyChallenge.explored);
        }
        
        gameState = { ...gameState, ...loadedState };
        console.log('Game loaded from memory');
    }
} catch (error) {
    console.error('Failed to load game:', error);
}
```

}

// Initialize when page loads
document.addEventListener(‘DOMContentLoaded’, initGame);

// Also try to init if DOM is already loaded
if (document.readyState === ‘loading’) {
document.addEventListener(‘DOMContentLoaded’, initGame);
} else {
initGame();
}