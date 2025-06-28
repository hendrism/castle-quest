// Game state
let gameState = {
    day: 1,
    level: 1,
    xp: 0,
    xpToNext: 100,
    season: 'spring',
    explorationsLeft: 5,
    resources: {
        wood: 0,
        stone: 0,
        metal: 0,
        food: 0,
        tools: 0,
        gems: 0
    },
    settlement: {
        home: 'camp',
        walls: 'none',
        farms: [],
        quarries: [],
        mines: [],
        workshops: [],
        foresters: [],
        gemMines: [],
        pendingHome: null,
        constructionQueue: []
    },
    ruler: {
        name: '',
        age: 20,
        yearsRemaining: 20,
        traits: []
    },
    pastRulers: [],
    population: 5,
    items: {
        luckyCharm: 0,
        magicScroll: 0
    },
    dailyChallenge: {
        type: 'explore',
        description: 'Explore all unlocked locations',
        target: 0,
        progress: 0,
        explored: new Set(),
        resource: null,
        startAmount: 0,
        reward: 50,
        completed: false
    },
    eventLog: []
};

const LUCKY_CHARM_MAX_USES = 3;

// Game data
const locations = {
forest: {
    name: 'Deep Forest',
    icon: '🌲',
    description: 'Rich in wood and wildlife',
    rewards: { wood: [1, 4], food: [0, 2] },
    requiredLevel: 1
},
quarry: {
    name: 'Stone Quarry',
    icon: '⛰️',
    description: 'Source of stone and metal',
    rewards: { stone: [1, 3], metal: [0, 1] },
    requiredLevel: 1
},
ruins: {
    name: 'Ancient Ruins',
    icon: '🏛️',
    description: 'Mysterious treasures await',
    rewards: { wood: [0, 2], stone: [0, 2], metal: [0, 2], food: [0, 1], gems: [0, 1] },
    requiredLevel: 2
},
plains: {
    name: 'Fertile Plains',
    icon: '🌾',
    description: 'Food and farming supplies',
    rewards: { food: [1, 3], wood: [0, 1] },
    requiredLevel: 1
}
};

const seasons = {
    spring: { name: 'Spring', icon: '🌸', farmMultiplier: 1.2 },
    summer: { name: 'Summer', icon: '☀️', farmMultiplier: 1.5 },
    autumn: { name: 'Autumn', icon: '🍂', farmMultiplier: 1.0 },
    winter: { name: 'Winter', icon: '❄️', farmMultiplier: 0.8 }
};

const rulerNames = ['Arthur', 'Beatrice', 'Cedric', 'Diana', 'Edmund', 'Fiona'];
const rulerTraits = ['builder', 'explorer', 'wealthy', 'lucky', 'charismatic'];

const homeTypes = {
    camp: {
        name: 'Camp',
        upgradeTo: 'house',
        cost: { wood: 5 },
        buildingLimits: { farm: 2, forester: 2, quarry: 2, mine: 0, workshop: 0, gemMine: 0 },
        population: 5
    },
    house: {
        name: 'House',
        upgradeTo: 'hall',
        cost: { wood: 10, stone: 5 },
        buildingLimits: { farm: 4, forester: 3, quarry: 3, mine: 1, workshop: 0, gemMine: 0 },
        population: 10
    },
    hall: {
        name: 'Hall',
        upgradeTo: 'fortress',
        cost: { stone: 20, metal: 5 },
        buildingLimits: { farm: 5, forester: 4, quarry: 4, mine: 2, workshop: 1, gemMine: 1 },
        population: 15
    },
    fortress: {
        name: 'Fortress',
        upgradeTo: null,
        cost: null,
        buildingLimits: { farm: 6, forester: 5, quarry: 5, mine: 3, workshop: 2, gemMine: 2 },
        population: 20
    }
};

const wallTypes = {
    none: { name: 'None', upgradeTo: 'earthen', cost: { wood: 5 } },
    earthen: { name: 'Earthen', upgradeTo: 'wood', cost: { wood: 10 } },
    wood: { name: 'Wood', upgradeTo: 'stone', cost: { stone: 20 } },
    stone: { name: 'Stone', upgradeTo: null, cost: null }
};

const wallBonuses = {
    none: 0,
    earthen: 1,
    wood: 2,
    stone: 3
};

const homeBonuses = {
    camp: 0,
    house: 1,
    hall: 2,
    fortress: 3
};

const homeOrder = ['camp', 'house', 'hall', 'fortress'];

const buildingTypes = {
farm: {
    name: 'Farm',
    icon: '🌾',
    buildCost: { wood: 1, stone: 1 },
    requiredLevel: 1,
    requiredHome: 'camp',
    levels: {
basic: { name: 'Basic', upgradeTo: 'improved', cost: { wood: 2 }, production: 1 },
improved: { name: 'Improved', upgradeTo: 'advanced', cost: { wood: 5, stone: 2 }, production: 2 },
advanced: { name: 'Advanced', upgradeTo: 'master', cost: { wood: 10, stone: 5, metal: 2 }, production: 3 },
    master: { name: 'Master', upgradeTo: null, cost: null, production: 5 }
    }
},
quarry: {
    name: 'Quarry',
    icon: '⛏️',
    buildCost: { wood: 1, stone: 2 },
    requiredLevel: 1,
    requiredHome: 'camp',
    levels: {
basic: { name: 'Basic', upgradeTo: 'improved', cost: { wood: 2 }, production: 1 },
improved: { name: 'Improved', upgradeTo: 'advanced', cost: { wood: 5, stone: 2 }, production: 2 },
advanced: { name: 'Advanced', upgradeTo: 'master', cost: { wood: 10, stone: 5, metal: 2 }, production: 3 },
    master: { name: 'Master', upgradeTo: null, cost: null, production: 5 }
    }
},
mine: {
    name: 'Mine',
    icon: '⚒️',
    buildCost: { wood: 2, stone: 2 },
    requiredLevel: 2,
    requiredHome: 'house',
    levels: {
        basic: { name: 'Basic', upgradeTo: 'improved', cost: { wood: 3 }, production: 1 },
        improved: { name: 'Improved', upgradeTo: 'advanced', cost: { wood: 6, stone: 3 }, production: 2 },
        advanced: { name: 'Advanced', upgradeTo: 'master', cost: { wood: 12, stone: 6, metal: 2 }, production: 3 },
        master: { name: 'Master', upgradeTo: null, cost: null, production: 5 }
    }
},
    workshop: {
        name: 'Workshop',
        icon: '🔧',
        buildCost: { wood: 2, stone: 1 },
        requiredLevel: 3,
        requiredHome: 'hall',
        levels: {
            basic: { name: 'Basic', upgradeTo: 'improved', cost: { wood: 3 }, production: 1, woodCost: 1 },
            improved: { name: 'Improved', upgradeTo: 'advanced', cost: { wood: 6, stone: 2 }, production: 2, woodCost: 1 },
            advanced: { name: 'Advanced', upgradeTo: 'master', cost: { wood: 12, stone: 6, metal: 2 }, production: 3, woodCost: 2 },
            master: { name: 'Master', upgradeTo: null, cost: null, production: 5, woodCost: 2 }
        }
    },
    forester: {
        name: 'Forester Hut',
        icon: '🌳',
        buildCost: { wood: 2, stone: 1 },
        requiredLevel: 2,
        requiredHome: 'camp',
        levels: {
            basic: { name: 'Basic', upgradeTo: 'improved', cost: { stone: 1 }, production: 1 },
            improved: { name: 'Improved', upgradeTo: 'advanced', cost: { wood: 4, stone: 2 }, production: 2 },
            advanced: { name: 'Advanced', upgradeTo: 'master', cost: { wood: 8, stone: 4, metal: 2 }, production: 3 },
            master: { name: 'Master', upgradeTo: null, cost: null, production: 5 }
        }
    },
    gemMine: {
        name: 'Gem Mine',
        icon: '💎',
        buildCost: { wood: 2, stone: 2, metal: 1 },
        requiredLevel: 4,
        requiredHome: 'fortress',
        levels: {
            basic: { name: 'Basic', upgradeTo: 'improved', cost: { metal: 1 }, production: 1 },
            improved: { name: 'Improved', upgradeTo: 'advanced', cost: { stone: 3, metal: 2 }, production: 2 },
            advanced: { name: 'Advanced', upgradeTo: 'master', cost: { stone: 6, metal: 4 }, production: 3 },
            master: { name: 'Master', upgradeTo: null, cost: null, production: 5 }
        }
    }
};

const nightEvents = [
    {
        name: 'Peaceful night',
        type: 'neutral',
        effect: () => ({ message: '🌙 A peaceful night passes without incident.', type: 'neutral' })
    },
    {
        name: 'Strange noises',
        type: 'neutral',
        effect: () => ({ message: '👻 Strange noises kept you awake, but nothing happened.', type: 'neutral' })
    },
    {
        name: 'Friendly neighbor',
        type: 'good',
        effect: (severity) => {
            if (severity === 1) {
                return { message: '🤝 Met a friendly neighbor, but nothing came of it.', type: 'neutral' };
            }
            const gain = Math.ceil(severity / 5);
            gameState.resources.wood += gain;
            gameState.resources.food += gain;
            return { message: `🤝 Friendly neighbor shared supplies (+${gain} wood, +${gain} food).`, type: 'success' };
        }
    },
    {
        name: 'Hidden cache',
        type: 'good',
        effect: (severity) => {
            if (severity === 1) {
                return { message: '🧰 You found signs of a cache, but it was empty.', type: 'neutral' };
            }
            const gain = Math.ceil(severity / 5);
            gameState.resources.wood += gain;
            gameState.resources.stone += gain;
            gameState.resources.metal += Math.floor(gain / 2);
            return { message: `🧰 Discovered a hidden cache: +${gain} wood, +${gain} stone, +${Math.floor(gain / 2)} metal.`, type: 'success' };
        }
    },
    {
        name: 'Traveling merchant',
        type: 'good',
        effect: (severity) => {
            if (severity === 1) {
                return { message: '🧑‍💼 A traveling merchant passed by but had nothing to trade.', type: 'neutral' };
            }
            const gain = Math.ceil(severity / 5);
            gameState.resources.food += gain;
            gameState.resources.stone += gain;
            return { message: `🧑‍💼 A traveling merchant traded goods: +${gain} food, +${gain} stone.`, type: 'success' };
        }
    },
    {
        name: 'Skilled builder',
        type: 'good',
        effect: (severity) => {
            if (severity === 1) {
                return { message: '👷‍♂️ A skilled builder offered no help.', type: 'neutral' };
            }
            const gain = Math.ceil(severity / 5);
            gameState.resources.wood += gain;
            gameState.resources.stone += gain;
            return { message: `👷‍♂️ A skilled builder assisted you (+${gain} wood, +${gain} stone).`, type: 'success' };
        }
    },
    {
        name: 'Thieves',
        type: 'bad',
        effect: (severity) => {
            if (severity === 1) {
                return { message: '🦹 Thieves tried to rob you but were caught.', type: 'neutral' };
            }
            const loss = Math.ceil(severity / 5);
            gameState.resources.wood = Math.max(0, gameState.resources.wood - loss);
            gameState.resources.food = Math.max(0, gameState.resources.food - loss);
            return { message: `🦹 Thieves stole ${loss} wood and ${loss} food.`, type: 'failure' };
        }
    },
    {
        name: 'Enemy raid',
        type: 'bad',
        effect: (severity) => {
            if (severity === 1) {
                return { message: '⚔️ An enemy raid was easily repelled.', type: 'neutral' };
            }
            const loss = Math.ceil(severity / 4);
            gameState.resources.food = Math.max(0, gameState.resources.food - loss);
            gameState.resources.stone = Math.max(0, gameState.resources.stone - loss);
            return { message: `⚔️ Enemies raided your camp, costing ${loss} food and ${loss} stone.`, type: 'failure' };
        }
    },
    {
        name: 'Fire',
        type: 'bad',
        effect: (severity) => {
            if (severity === 1) {
                return { message: '🔥 A small fire caused no real harm.', type: 'neutral' };
            }
            const loss = Math.ceil(severity / 4);
            gameState.resources.wood = Math.max(0, gameState.resources.wood - loss);
            return { message: `🔥 Fire damaged supplies: -${loss} wood.`, type: 'failure' };
        }
    },
    {
        name: 'Disease outbreak',
        type: 'bad',
        effect: (severity) => {
            if (severity === 1) {
                return { message: '🤒 A mild sickness passed quickly.', type: 'neutral' };
            }
            const loss = Math.ceil(severity / 4);
            gameState.resources.food = Math.max(0, gameState.resources.food - loss);
            return { message: `🤒 Disease swept the camp, using ${loss} food for medicine.`, type: 'failure' };
        }
    },
    {
        name: 'Dragon attack',
        type: 'bad',
        effect: (severity) => {
            if (severity === 1) {
                return { message: '🐉 A dragon appeared but was driven off with minimal damage.', type: 'neutral' };
            }
            const loss = Math.ceil(severity / 3);
            gameState.resources.wood = Math.max(0, gameState.resources.wood - loss);
            gameState.resources.stone = Math.max(0, gameState.resources.stone - loss);
            if (severity === 20) {
                if (gameState.settlement.farms.length > 0) {
                    gameState.settlement.farms.pop();
                    return { message: '🐉 The dragon destroyed one of your farms!', type: 'failure' };
                }
                damageWalls();
                return { message: '🐉 The dragon obliterated your walls!', type: 'failure' };
            }
            return { message: `🐉 Dragon attack! Lost ${loss} wood and ${loss} stone.`, type: 'failure' };
        }
    }
];

// Initialize game
function initGame() {
console.log('Initializing Dice & Castle...');
try {
    loadGame();
    if (!gameState.population) {
        gameState.population = homeTypes[gameState.settlement.home].population;
    }
    if (!gameState.ruler || !gameState.ruler.name) {
        createNewRuler();
    }
    setupResourceBar();
    generateDailyChallenge();
    updateUI();
setupEventListeners();
console.log('Game initialized successfully!');

    // Test that buttons exist
    const testBtn = document.querySelector('.location-btn');
    if (testBtn) {
        console.log('Location buttons found');
    } else {
        console.error('Location buttons not found!');
    }
} catch (error) {
    console.error('Error initializing game:', error);
}

// Register service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
        .then(registration => console.log('SW registered'))
        .catch(error => console.log('SW registration failed:', error));
}

}

// Event listeners
function setupEventListeners() {
console.log('Setting up event listeners...');

// Location exploration
const locationBtns = document.querySelectorAll('.location-btn');
console.log('Found', locationBtns.length, 'location buttons');

locationBtns.forEach((btn, index) => {
    console.log('Setting up button', index, 'for location:', btn.dataset.location);
    btn.addEventListener('click', (e) => {
        console.log('Location button clicked:', btn.dataset.location);
        
        // Visual feedback for phone users
        btn.style.background = '#e74c3c';
        btn.style.color = 'white';
        setTimeout(() => {
            btn.style.background = '';
            btn.style.color = '';
        }, 200);
        
        const location = btn.dataset.location;
        exploreLocation(location);
    });
});

// Sleep button
const sleepBtn = document.getElementById('sleep-btn');
if (sleepBtn) {
    sleepBtn.addEventListener('click', (e) => {
        console.log('Sleep button clicked');
        sleep();
    });
} else {
    console.error('Sleep button not found!');
}

// Settlement upgrades
const homeUpgradeBtn = document.getElementById('home-upgrade-btn');
const wallsUpgradeBtn = document.getElementById('walls-upgrade-btn');

if (homeUpgradeBtn) {
    homeUpgradeBtn.addEventListener('click', (e) => {
        console.log('Home upgrade clicked');
        upgradeHome();
    });
}

if (wallsUpgradeBtn) {
    wallsUpgradeBtn.addEventListener('click', (e) => {
        console.log('Walls upgrade clicked');
        upgradeWalls();
    });
}

// Building construction
const buildFarmBtn = document.getElementById('build-farm-btn');
const buildQuarryBtn = document.getElementById('build-quarry-btn');
const buildMineBtn = document.getElementById('build-mine-btn');
const buildWorkshopBtn = document.getElementById('build-workshop-btn');
const buildForesterBtn = document.getElementById('build-forester-btn');
const buildGemMineBtn = document.getElementById('build-gemMine-btn');

if (buildFarmBtn) {
    buildFarmBtn.addEventListener('click', () => {
        console.log('Build farm clicked');
        buildBuilding('farm');
    });
}

if (buildQuarryBtn) {
    buildQuarryBtn.addEventListener('click', () => {
        console.log('Build quarry clicked');
        buildBuilding('quarry');
    });
}

if (buildMineBtn) {
    buildMineBtn.addEventListener('click', () => {
        console.log('Build mine clicked');
        buildBuilding('mine');
    });
}

if (buildForesterBtn) {
    buildForesterBtn.addEventListener('click', () => {
        console.log('Build forester clicked');
        buildBuilding('forester');
    });
}

if (buildGemMineBtn) {
    buildGemMineBtn.addEventListener('click', () => {
        console.log('Build gem mine clicked');
        buildBuilding('gemMine');
    });
}

if (buildWorkshopBtn) {
    buildWorkshopBtn.addEventListener('click', () => {
        console.log('Build workshop clicked');
        buildBuilding('workshop');
    });
}

// Crafting
const craftBtn = document.getElementById('craft-lucky-charm');
const craftScrollBtn = document.getElementById('craft-magic-scroll');
if (craftBtn) {
    craftBtn.addEventListener('click', () => {
        console.log('Craft lucky charm clicked');
        craftLuckyCharm();
    });
}
if (craftScrollBtn) {
    craftScrollBtn.addEventListener('click', () => {
        console.log('Craft magic scroll clicked');
        craftMagicScroll();
    });
}

// Event log controls
const clearLogBtn = document.getElementById('clear-log-btn');
const textSizeSelect = document.getElementById('text-size-select');

if (clearLogBtn) {
    clearLogBtn.addEventListener('click', () => {
        console.log('Clear log clicked');
        clearEventLog();
    });
}

if (textSizeSelect) {
    textSizeSelect.addEventListener('change', changeTextSize);
}

// Modal controls
const closeModalBtn = document.getElementById('close-modal-btn');
if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
        console.log('Close modal clicked');
        closeModal();
    });
}

console.log('Event listeners setup complete');

}

// Exploration
function exploreLocation(locationKey) {
if (gameState.explorationsLeft <= 0) return;

const location = locations[locationKey];
if (gameState.level < (location.requiredLevel || 1)) {
    addEventLog(`🔒 ${location.name} requires level ${location.requiredLevel}.`, 'failure');
    updateUI();
    return;
}
    gameState.explorationsLeft--;

    if (gameState.dailyChallenge.type === 'explore' && gameState.dailyChallenge.exploreTargets && gameState.dailyChallenge.exploreTargets.has(locationKey)) {
        gameState.dailyChallenge.explored.add(locationKey);
        gameState.dailyChallenge.progress = gameState.dailyChallenge.explored.size;
    }
    checkDailyChallengeCompletion();

// Roll dice and show modal
showDiceRoll((roll) => {
    const result = calculateExplorationResult(locationKey, roll);
    
    // Apply rewards
    Object.keys(result.rewards).forEach(resource => {
        gameState.resources[resource] += result.rewards[resource];
    });

    // Gain XP
    gainXP(result.xp);

    // Log event with roll and rewards
    const rewardsText = Object.keys(result.rewards)
        .map(r => {
            const amt = result.rewards[r];
            if (amt === 0) return null;
            const icon = getResourceIcon(r);
            return `${amt > 0 ? '+' : ''}${amt} ${icon}`;
        })
        .filter(Boolean)
        .join(' ');

    let logMsg = `🎲 Rolled ${result.roll}: ${result.message}`;
    if (rewardsText) {
        logMsg += ` Rewards: ${rewardsText}`;
    }
    addEventLog(logMsg, result.type);

    updateUI();
    saveGame();

    // Build detail lines for the modal
    const details = [];
    details.push(result.message);
    Object.keys(result.rewards).forEach(r => {
        const amt = result.rewards[r];
        if (amt !== 0) {
            details.push(`${amt > 0 ? '+' : ''}${amt} ${getResourceIcon(r)} ${r}`);
        }
    });
    if (result.xp) details.push(`+${result.xp} XP`);

    return details;
});

}

function calculateExplorationResult(locationKey, roll) {
const location = locations[locationKey];
let luckyCharmBonus = 0;
if (gameState.items.luckyCharm > 0) {
    luckyCharmBonus = 2;
    gameState.items.luckyCharm--;
}
const effectiveRoll = Math.min(20, roll + luckyCharmBonus);

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

return { rewards, xp, message, type, roll: effectiveRoll };

}

// Sleep and day progression
function sleep() {
    showDiceRoll((roll) => {
        // Overnight event using 2d6 for event and provided d20 roll for severity
        const d1 = rollDice(6);
        const d2 = rollDice(6);
        const eventIndex = (((d1 - 1) * 6 + (d2 - 1)) % nightEvents.length);
        const nightEvent = nightEvents[eventIndex];

        const wallBonus = getWallBonus();
        const homeBonus = getHomeBonus();
        let severityRoll = roll;
        if (nightEvent.type === 'bad') {
            const savingThrow = roll + wallBonus + homeBonus;
            severityRoll = Math.max(1, 21 - savingThrow);
        } else if (nightEvent.type === 'good') {
            severityRoll = Math.min(20, roll + wallBonus + homeBonus);
        }

        let eventMessage = '';
        let eventType = 'neutral';

        if (nightEvent && typeof nightEvent.effect === 'function') {
            const result = nightEvent.effect(severityRoll);
            eventMessage = result.message;
            eventType = result.type || nightEvent.type;
        }

        // Daily production from buildings
        const production = calculateDailyProduction();
        gameState.resources.food += production.food;
        gameState.resources.wood += production.wood;
        gameState.resources.stone += production.stone;
        gameState.resources.metal += production.metal;
        gameState.resources.tools += production.tools;
        gameState.resources.gems += production.gems;
        if (production.woodConsumed) {
            gameState.resources.wood = Math.max(0, gameState.resources.wood - production.woodConsumed);
        }
        if (production.foodDemand) {
            gameState.resources.food = Math.max(0, gameState.resources.food - production.foodDemand);
        }

        if (production.food > 0 || production.wood > 0 || production.stone > 0 || production.metal > 0 || production.tools > 0 || production.gems > 0 || production.woodConsumed > 0 || production.foodDemand > 0) {
            const parts = [];
            if (production.food) parts.push(`+${production.food} food`);
            if (production.wood) parts.push(`+${production.wood} wood`);
            if (production.stone) parts.push(`+${production.stone} stone`);
            if (production.metal) parts.push(`+${production.metal} metal`);
            if (production.tools) parts.push(`+${production.tools} tools`);
            if (production.gems) parts.push(`+${production.gems} gems`);
            if (production.woodConsumed) parts.push(`-${production.woodConsumed} wood`);
            if (production.foodDemand) parts.push(`-${production.foodDemand} food`);
            addEventLog(`🏭 Daily production: ${parts.join(', ')}`, 'success');
        }

        // Progress day
        gameState.day++;
        gameState.explorationsLeft = 5;
        generateDailyChallenge();

        // Age ruler
        if (gameState.ruler) {
            gameState.ruler.age++;
            gameState.ruler.yearsRemaining--;
            if (gameState.ruler.yearsRemaining <= 0) {
                endCurrentRuler();
            }
        } else {
            createNewRuler();
        }

        if (gameState.settlement.pendingHome) {
            gameState.settlement.home = gameState.settlement.pendingHome;
            gameState.settlement.pendingHome = null;
            const newHome = homeTypes[gameState.settlement.home];
            gameState.population = newHome.population;
            addEventLog(`🏠 Home upgrade complete! Now ${newHome.name}.`, 'success');
            gainXP(100);
        }

        if (gameState.settlement.constructionQueue.length > 0) {
            gameState.settlement.constructionQueue.forEach(b => {
                const key = getBuildingKey(b.type);
                gameState.settlement[key].push({ id: b.id, level: 'basic', pendingLevel: null });
                const bt = buildingTypes[b.type];
                addEventLog(`${bt.icon} ${bt.name} finished construction!`, 'success');
                gainXP(50);
            });
            gameState.settlement.constructionQueue = [];
        }

        finalizeBuildingUpgrades();

        // Change season every 4 days
        const seasonKeys = Object.keys(seasons);
        const seasonIndex = Math.floor((gameState.day - 1) / 4) % seasonKeys.length;
        gameState.season = seasonKeys[seasonIndex];

        // Add event log
        addEventLog(eventMessage, eventType);
        addEventLog(`🌅 Day ${gameState.day} begins. Season: ${seasons[gameState.season].icon} ${seasons[gameState.season].name}`, 'neutral');

        updateUI();
        saveGame();

        // Build detail text for modal
        const details = [];
        details.push(eventMessage);
        if (production.food > 0 || production.wood > 0 || production.stone > 0 || production.metal > 0 || production.tools > 0 || production.gems > 0 || production.woodConsumed > 0 || production.foodDemand > 0) {
            const parts = [];
            if (production.food) parts.push(`+${production.food} food`);
            if (production.wood) parts.push(`+${production.wood} wood`);
            if (production.stone) parts.push(`+${production.stone} stone`);
            if (production.metal) parts.push(`+${production.metal} metal`);
            if (production.tools) parts.push(`+${production.tools} tools`);
            if (production.gems) parts.push(`+${production.gems} gems`);
            if (production.woodConsumed) parts.push(`-${production.woodConsumed} wood`);
            if (production.foodDemand) parts.push(`-${production.foodDemand} food`);
            details.push(`🏭 Daily production: ${parts.join(', ')}`);
        }
        details.push(`🌅 Day ${gameState.day} begins. Season: ${seasons[gameState.season].icon} ${seasons[gameState.season].name}`);

        return details;
    });
}

// Settlement management
function upgradeHome() {
const currentHome = homeTypes[gameState.settlement.home];
if (!currentHome.upgradeTo) return;

const upgradeCost = currentHome.cost;
if (!canAfford(upgradeCost)) return;

spendResources(upgradeCost);
gameState.settlement.pendingHome = currentHome.upgradeTo;
addEventLog(`🏠 Started upgrading home to ${homeTypes[currentHome.upgradeTo].name}. It will be ready tomorrow.`, 'success');

updateUI();
saveGame();

}

function upgradeWalls() {
const currentWalls = wallTypes[gameState.settlement.walls];
if (!currentWalls.upgradeTo) return;

const upgradeCost = currentWalls.cost;
if (!canAfford(upgradeCost)) return;

spendResources(upgradeCost);
gameState.settlement.walls = currentWalls.upgradeTo;

const newWalls = wallTypes[gameState.settlement.walls];
addEventLog(`🛡️ Built ${newWalls.name} walls!`, 'success');
gainXP(75);

updateUI();
saveGame();

}

function buildBuilding(type) {
    const buildingType = buildingTypes[type];
    const key = getBuildingKey(type);
    const maxBuildings = getBuildingLimit(type);
    const underConstruction = gameState.settlement.constructionQueue.filter(b => b.type === type).length;
    const currentCount = gameState.settlement[key].length + underConstruction;

    if (gameState.level < (buildingType.requiredLevel || 1)) return;
    if (buildingType.requiredHome && !homeAtLeast(buildingType.requiredHome)) return;
    if (currentCount >= maxBuildings) return;
    if (!canAfford(buildingType.buildCost)) return;

    spendResources(buildingType.buildCost);

    const id = Date.now();
    gameState.settlement.constructionQueue.push({ type, id });
    addEventLog(`${buildingType.icon} Started building a ${buildingType.name}. It will be ready tomorrow.`, 'success');

    if (gameState.dailyChallenge.type === 'build') {
        gameState.dailyChallenge.progress++;
    }
    checkDailyChallengeCompletion();

updateUI();
saveGame();

}

function upgradeBuilding(type, buildingId) {
const key = getBuildingKey(type);
const buildings = gameState.settlement[key];
const building = buildings.find(b => b.id === buildingId);
if (!building) return;

const currentLevel = buildingTypes[type].levels[building.level];
if (!currentLevel.upgradeTo) return;
if (!canAfford(currentLevel.cost)) return;

spendResources(currentLevel.cost);
building.pendingLevel = currentLevel.upgradeTo;

const newLevel = buildingTypes[type].levels[currentLevel.upgradeTo];
addEventLog(`${buildingTypes[type].icon} Upgrading ${buildingTypes[type].name} to ${newLevel.name}. It will be ready tomorrow.`, 'success');
gainXP(10);

    if (gameState.dailyChallenge.type === 'upgrade') {
        gameState.dailyChallenge.progress++;
    }
    checkDailyChallengeCompletion();

updateUI();
saveGame();

}

function finalizeBuildingUpgrades() {
    const types = ['farm', 'forester', 'quarry', 'mine', 'gemMine', 'workshop'];
    types.forEach(t => {
        const key = getBuildingKey(t);
        gameState.settlement[key].forEach(b => {
            if (b.pendingLevel) {
                b.level = b.pendingLevel;
                b.pendingLevel = null;
                const bt = buildingTypes[t];
                const lvl = bt.levels[b.level];
                addEventLog(`${bt.icon} ${bt.name} upgrade to ${lvl.name} complete!`, 'success');
                gainXP(25);
            }
        });
    });
}

// Crafting
function craftLuckyCharm() {
const cost = { wood: 3, stone: 2 };
if (!canAfford(cost)) return;

spendResources(cost);
gameState.items.luckyCharm += LUCKY_CHARM_MAX_USES;
addEventLog(`🍀 Crafted a Lucky Charm! (${LUCKY_CHARM_MAX_USES} uses)`, 'success');
gainXP(30);

updateUI();
saveGame();

}


function craftMagicScroll() {
    const cost = { wood: 2, gems: 1 };
    if (!canAfford(cost)) return;
    spendResources(cost);
    addEventLog('📜 Crafted a Magic Scroll!', 'success');
    gainXP(15);
    // Automatically gain the scroll's XP when crafted
    gainXP(20);
    addEventLog('✨ Magic Scroll activated for bonus XP!', 'success');
    updateUI();
    saveGame();
}

// Helper functions
function rollDice(sides = 20) {
    return Math.floor(Math.random() * sides) + 1;
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

function getBuildingKey(type) {
    return type === 'quarry' ? 'quarries' : type + 's';
}

function getBuildingLimit(type) {
    const home = homeTypes[gameState.settlement.home];
    if (home.buildingLimits && typeof home.buildingLimits[type] === 'number') {
        return home.buildingLimits[type];
    }
    return 0;
}

function calculateDailyProduction() {
    let food = 0;
    let wood = 0;
    let stone = 0;
    let metal = 0;
    let tools = 0;
    let gems = 0;
    let foodDemand = gameState.population || 0;

    gameState.settlement.farms.forEach(farm => {
        const production = buildingTypes.farm.levels[farm.level].production;
        const seasonMultiplier = seasons[gameState.season].farmMultiplier;
        food += Math.floor(production * seasonMultiplier);
    });

    gameState.settlement.quarries.forEach(quarry => {
        const production = buildingTypes.quarry.levels[quarry.level].production;
        stone += production;
    });

    gameState.settlement.mines.forEach(mine => {
        const production = buildingTypes.mine.levels[mine.level].production;
        metal += production;
    });

    gameState.settlement.foresters.forEach(forester => {
        const production = buildingTypes.forester.levels[forester.level].production;
        wood += production;
    });

    gameState.settlement.gemMines.forEach(gm => {
        const production = buildingTypes.gemMine.levels[gm.level].production;
        gems += production;
    });

    let woodConsumed = 0;
    gameState.settlement.workshops.forEach(ws => {
        const levelData = buildingTypes.workshop.levels[ws.level];
        const woodCost = levelData.woodCost || 1;
        if (gameState.resources.wood - woodConsumed >= woodCost) {
            woodConsumed += woodCost;
            tools += levelData.production;
        }
    });

    const multiplier = getLevelMultiplier();
    food = Math.floor(food * multiplier);
    wood = Math.floor(wood * multiplier);
    stone = Math.floor(stone * multiplier);
    metal = Math.floor(metal * multiplier);
    tools = Math.floor(tools * multiplier);
    gems = Math.floor(gems * multiplier);

    return { food, wood, stone, metal, tools, gems, woodConsumed, foodDemand };
}

function damageWalls() {
    const order = ['none', 'earthen', 'wood', 'stone'];
    const idx = order.indexOf(gameState.settlement.walls);
    if (idx > 0) {
        gameState.settlement.walls = order[idx - 1];
    }
}

function createNewRuler() {
    const name = rulerNames[Math.floor(Math.random() * rulerNames.length)];
    const traits = [];
    const pool = [...rulerTraits];
    while (traits.length < 2 && pool.length > 0) {
        const idx = Math.floor(Math.random() * pool.length);
        traits.push(pool.splice(idx, 1)[0]);
    }
    gameState.ruler = {
        name,
        age: 20,
        yearsRemaining: 20,
        traits
    };
    addEventLog(`👑 ${name} begins their reign.`, 'success');
}

function endCurrentRuler() {
    gameState.pastRulers.push({ ...gameState.ruler });
    addEventLog(`⚰️ ${gameState.ruler.name}'s reign has ended.`, 'neutral');
    createNewRuler();
}

function getWallBonus() {
    return wallBonuses[gameState.settlement.walls] || 0;
}

function getHomeBonus() {
    return homeBonuses[gameState.settlement.home] || 0;
}

function homeAtLeast(required) {
    return homeOrder.indexOf(gameState.settlement.home) >= homeOrder.indexOf(required);
}

function getLevelMultiplier() {
    return 1 + (gameState.level - 1) * 0.05;
}

function gainXP(amount) {
gameState.xp += amount;

while (gameState.xp >= gameState.xpToNext) {
    gameState.xp -= gameState.xpToNext;
    gameState.level++;
    gameState.xpToNext = Math.floor(gameState.xpToNext * 1.2);
    addEventLog(`🎉 Level up! You are now level ${gameState.level}!`, 'success');
}

}

function addEventLog(message, type = 'neutral') {
const timestamp = new Date().toLocaleTimeString();
gameState.eventLog.unshift({
message,
type,
timestamp,
day: gameState.day
});

// Keep only last 50 entries
if (gameState.eventLog.length > 50) {
    gameState.eventLog = gameState.eventLog.slice(0, 50);
}

}

function clearEventLog() {
gameState.eventLog = [];
updateUI();
saveGame();
}

function changeTextSize() {
const size = document.getElementById('text-size-select').value;
const logContent = document.getElementById('event-log-content');
logContent.className = `log-content ${size}`;
}

// Modal functions
function showDiceRoll(callback) {
    const modal = document.getElementById('dice-modal');
    const dice = document.getElementById('dice');
    const diceFace = dice.querySelector('.dice-face');
    const result = document.getElementById('roll-result');

    modal.classList.add('show');
    dice.classList.add('rolling');
    diceFace.textContent = '?';
    result.textContent = 'Rolling...';

    setTimeout(() => {
        dice.classList.remove('rolling');
        const roll = rollDice();
        diceFace.textContent = roll;

        const lines = [];
        let rollLine = `You rolled a ${roll}.`;
        if (gameState.items.luckyCharm > 0) {
            rollLine += ` (Lucky Charm: +2 = ${Math.min(20, roll + 2)})`;
        }
        lines.push(rollLine);

        // Allow callback to provide additional detail text
        let detail = '';
        if (callback) {
            detail = callback(roll) || '';
        }

        if (Array.isArray(detail)) {
            lines.push(...detail);
        } else if (detail) {
            lines.push(detail);
        }

        result.innerHTML = lines.join('<br>');
    }, 1000);
}

function closeModal() {
document.getElementById('dice-modal').classList.remove('show');
}

// UI Updates
function updateUI() {
// Update header
document.getElementById('day').textContent = gameState.day;
document.getElementById('level').textContent = gameState.level;
document.getElementById('xp').textContent = gameState.xp;
document.getElementById('xp-next').textContent = gameState.xpToNext;
document.getElementById('season').textContent = `${seasons[gameState.season].icon} ${seasons[gameState.season].name}`;
if (gameState.ruler) {
    document.getElementById('ruler-name').textContent = gameState.ruler.name;
    document.getElementById('ruler-age').textContent = gameState.ruler.age;
}

    // Update resources bar
    updateResourceBar();

    if (gameState.dailyChallenge.type === 'gather') {
        const res = gameState.dailyChallenge.resource;
        gameState.dailyChallenge.progress = Math.max(0, gameState.resources[res] - gameState.dailyChallenge.startAmount);
    }


// Update exploration
document.getElementById('explorations-left').textContent = gameState.explorationsLeft;

// Enable/disable location buttons
document.querySelectorAll('.location-btn').forEach(btn => {
    const loc = locations[btn.dataset.location];
    const locked = gameState.level < (loc.requiredLevel || 1);
    btn.disabled = gameState.explorationsLeft <= 0 || locked;
    if (locked) {
        btn.title = `Requires level ${loc.requiredLevel}`;
    } else {
        btn.removeAttribute('title');
    }
});

// Enable/disable sleep button
document.getElementById('sleep-btn').disabled = gameState.explorationsLeft > 0;

// Update settlement
updateSettlementUI();

// Update event log
    updateEventLogUI();
    updateDailyChallengeUI();
    checkDailyChallengeCompletion();

}

function updateSettlementUI() {
// Home upgrade
const currentHome = homeTypes[gameState.settlement.home];
const homeUpgradeBtn = document.getElementById('home-upgrade-btn');
document.getElementById('home-level').textContent = currentHome.name;

if (currentHome.upgradeTo) {
    const nextHome = homeTypes[currentHome.upgradeTo];
    const costText = Object.keys(currentHome.cost).map(r =>
        `${currentHome.cost[r]} ${getResourceIcon(r)}`
    ).join(' ');

    if (gameState.settlement.pendingHome) {
        homeUpgradeBtn.querySelector('.upgrade-text').textContent = `Upgrading to ${nextHome.name}...`;
        homeUpgradeBtn.querySelector('.upgrade-cost').textContent = '';
        homeUpgradeBtn.disabled = true;
    } else {
        homeUpgradeBtn.querySelector('.upgrade-text').textContent = `Upgrade to ${nextHome.name}`;
        homeUpgradeBtn.querySelector('.upgrade-cost').textContent = costText;
        homeUpgradeBtn.disabled = !canAfford(currentHome.cost);
    }
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

// Population info
const popEl = document.getElementById('population-count');
const foodEl = document.getElementById('population-food');
if (popEl) popEl.textContent = gameState.population;
if (foodEl) foodEl.textContent = gameState.population;

// Buildings
updateBuildingsUI();

// Items
document.getElementById('lucky-charm-count').textContent = gameState.items.luckyCharm;
document.getElementById('craft-lucky-charm').disabled = !canAfford({ wood: 3, stone: 2 });


document.getElementById('magic-scroll-count').textContent = gameState.items.magicScroll;
document.getElementById('craft-magic-scroll').disabled = !canAfford({ wood: 2, gems: 1 });

}

function updateBuildingsUI() {
const farmLimit = getBuildingLimit('farm');
document.getElementById('farm-count').textContent = gameState.settlement.farms.length;
document.getElementById('farm-max').textContent = farmLimit;
document.getElementById('build-farm-btn').disabled =
    gameState.level < buildingTypes.farm.requiredLevel ||
    !homeAtLeast(buildingTypes.farm.requiredHome || 'camp') ||
    gameState.settlement.farms.length + gameState.settlement.constructionQueue.filter(b=>b.type==='farm').length >= farmLimit ||
    !canAfford(buildingTypes.farm.buildCost);
document.getElementById('build-farm-btn').title =
    gameState.level < buildingTypes.farm.requiredLevel ?
    `Requires level ${buildingTypes.farm.requiredLevel}` : '';
const farmCostText = Object.keys(buildingTypes.farm.buildCost).map(r => `${buildingTypes.farm.buildCost[r]} ${getResourceIcon(r)}`).join(' ');
const farmBtn = document.getElementById('build-farm-btn');
if (gameState.settlement.constructionQueue.some(b=>b.type==='farm')) {
    farmBtn.querySelector('.build-text').textContent = 'Building...';
    farmBtn.querySelector('.build-cost').textContent = '';
    farmBtn.disabled = true;
} else {
    farmBtn.querySelector('.build-text').textContent = 'Build Farm';
    farmBtn.querySelector('.build-cost').textContent = farmCostText;
}

const farmsContainer = document.getElementById('farms-container');
farmsContainer.innerHTML = '';
gameState.settlement.farms.forEach(farm => {
    const farmElement = createBuildingElement('farm', farm);
    farmsContainer.appendChild(farmElement);
});
gameState.settlement.constructionQueue.filter(b=>b.type==='farm').forEach(b=>{
    const el = createConstructionElement('farm');
    farmsContainer.appendChild(el);
});

// Foresters
const foresterLimit = getBuildingLimit('forester');
document.getElementById('forester-count').textContent = gameState.settlement.foresters.length;
document.getElementById('forester-max').textContent = foresterLimit;
document.getElementById('build-forester-btn').disabled =
    gameState.level < buildingTypes.forester.requiredLevel ||
    !homeAtLeast(buildingTypes.forester.requiredHome || 'camp') ||
    gameState.settlement.foresters.length + gameState.settlement.constructionQueue.filter(b=>b.type==='forester').length >= foresterLimit ||
    !canAfford(buildingTypes.forester.buildCost);
document.getElementById('build-forester-btn').title =
    gameState.level < buildingTypes.forester.requiredLevel ?
    `Requires level ${buildingTypes.forester.requiredLevel}` : '';
const foresterCostText = Object.keys(buildingTypes.forester.buildCost).map(r => `${buildingTypes.forester.buildCost[r]} ${getResourceIcon(r)}`).join(' ');
const foresterBtn = document.getElementById('build-forester-btn');
if (gameState.settlement.constructionQueue.some(b=>b.type==='forester')) {
    foresterBtn.querySelector('.build-text').textContent = 'Building...';
    foresterBtn.querySelector('.build-cost').textContent = '';
    foresterBtn.disabled = true;
} else {
    foresterBtn.querySelector('.build-text').textContent = 'Build Forester Hut';
    foresterBtn.querySelector('.build-cost').textContent = foresterCostText;
}

const forestersContainer = document.getElementById('foresters-container');
forestersContainer.innerHTML = '';
gameState.settlement.foresters.forEach(f => {
    const el = createBuildingElement('forester', f);
    forestersContainer.appendChild(el);
});
gameState.settlement.constructionQueue.filter(b=>b.type==='forester').forEach(b=>{
    const el = createConstructionElement('forester');
    forestersContainer.appendChild(el);
});

// Quarries
const quarryLimit = getBuildingLimit('quarry');
document.getElementById('quarry-count').textContent = gameState.settlement.quarries.length;
document.getElementById('quarry-max').textContent = quarryLimit;
document.getElementById('build-quarry-btn').disabled =
    gameState.level < buildingTypes.quarry.requiredLevel ||
    !homeAtLeast(buildingTypes.quarry.requiredHome || 'camp') ||
    gameState.settlement.quarries.length + gameState.settlement.constructionQueue.filter(b=>b.type==='quarry').length >= quarryLimit ||
    !canAfford(buildingTypes.quarry.buildCost);
document.getElementById('build-quarry-btn').title =
    gameState.level < buildingTypes.quarry.requiredLevel ?
    `Requires level ${buildingTypes.quarry.requiredLevel}` : '';
const quarryCostText = Object.keys(buildingTypes.quarry.buildCost).map(r => `${buildingTypes.quarry.buildCost[r]} ${getResourceIcon(r)}`).join(' ');
const quarryBtn = document.getElementById('build-quarry-btn');
if (gameState.settlement.constructionQueue.some(b=>b.type==='quarry')) {
    quarryBtn.querySelector('.build-text').textContent = 'Building...';
    quarryBtn.querySelector('.build-cost').textContent = '';
    quarryBtn.disabled = true;
} else {
    quarryBtn.querySelector('.build-text').textContent = 'Build Quarry';
    quarryBtn.querySelector('.build-cost').textContent = quarryCostText;
}

const quarriesContainer = document.getElementById('quarries-container');
quarriesContainer.innerHTML = '';
gameState.settlement.quarries.forEach(quarry => {
    const quarryElement = createBuildingElement('quarry', quarry);
    quarriesContainer.appendChild(quarryElement);
});
gameState.settlement.constructionQueue.filter(b=>b.type==='quarry').forEach(b=>{
    const el = createConstructionElement('quarry');
    quarriesContainer.appendChild(el);
});

// Mines
const mineLimit = getBuildingLimit('mine');
document.getElementById('mine-count').textContent = gameState.settlement.mines.length;
document.getElementById('mine-max').textContent = mineLimit;
document.getElementById('build-mine-btn').disabled =
    gameState.level < buildingTypes.mine.requiredLevel ||
    !homeAtLeast(buildingTypes.mine.requiredHome || 'camp') ||
    gameState.settlement.mines.length + gameState.settlement.constructionQueue.filter(b=>b.type==='mine').length >= mineLimit ||
    !canAfford(buildingTypes.mine.buildCost);
document.getElementById('build-mine-btn').title =
    gameState.level < buildingTypes.mine.requiredLevel ?
    `Requires level ${buildingTypes.mine.requiredLevel}` : '';
const mineCostText = Object.keys(buildingTypes.mine.buildCost).map(r => `${buildingTypes.mine.buildCost[r]} ${getResourceIcon(r)}`).join(' ');
const mineBtn = document.getElementById('build-mine-btn');
if (gameState.settlement.constructionQueue.some(b=>b.type==='mine')) {
    mineBtn.querySelector('.build-text').textContent = 'Building...';
    mineBtn.querySelector('.build-cost').textContent = '';
    mineBtn.disabled = true;
} else {
    mineBtn.querySelector('.build-text').textContent = 'Build Mine';
    mineBtn.querySelector('.build-cost').textContent = mineCostText;
}

const minesContainer = document.getElementById('mines-container');
minesContainer.innerHTML = '';
gameState.settlement.mines.forEach(mine => {
    const mineElement = createBuildingElement('mine', mine);
    minesContainer.appendChild(mineElement);
});
gameState.settlement.constructionQueue.filter(b=>b.type==='mine').forEach(b=>{
    const el = createConstructionElement('mine');
    minesContainer.appendChild(el);
});

// Gem Mines
const gemMineLimit = getBuildingLimit('gemMine');
document.getElementById('gemMine-count').textContent = gameState.settlement.gemMines.length;
document.getElementById('gemMine-max').textContent = gemMineLimit;
document.getElementById('build-gemMine-btn').disabled =
    gameState.level < buildingTypes.gemMine.requiredLevel ||
    !homeAtLeast(buildingTypes.gemMine.requiredHome || 'camp') ||
    gameState.settlement.gemMines.length + gameState.settlement.constructionQueue.filter(b=>b.type==='gemMine').length >= gemMineLimit ||
    !canAfford(buildingTypes.gemMine.buildCost);
document.getElementById('build-gemMine-btn').title =
    gameState.level < buildingTypes.gemMine.requiredLevel ?
    `Requires level ${buildingTypes.gemMine.requiredLevel}` : '';
const gemMineCostText = Object.keys(buildingTypes.gemMine.buildCost).map(r => `${buildingTypes.gemMine.buildCost[r]} ${getResourceIcon(r)}`).join(' ');
const gemMineBtn = document.getElementById('build-gemMine-btn');
if (gameState.settlement.constructionQueue.some(b=>b.type==='gemMine')) {
    gemMineBtn.querySelector('.build-text').textContent = 'Building...';
    gemMineBtn.querySelector('.build-cost').textContent = '';
    gemMineBtn.disabled = true;
} else {
    gemMineBtn.querySelector('.build-text').textContent = 'Build Gem Mine';
    gemMineBtn.querySelector('.build-cost').textContent = gemMineCostText;
}

const gemMinesContainer = document.getElementById('gemMines-container');
gemMinesContainer.innerHTML = '';
gameState.settlement.gemMines.forEach(gm => {
    const el = createBuildingElement('gemMine', gm);
    gemMinesContainer.appendChild(el);
});
gameState.settlement.constructionQueue.filter(b=>b.type==='gemMine').forEach(b=>{
    const el = createConstructionElement('gemMine');
    gemMinesContainer.appendChild(el);
});

// Workshops
const workshopLimit = getBuildingLimit('workshop');
document.getElementById('workshop-count').textContent = gameState.settlement.workshops.length;
document.getElementById('workshop-max').textContent = workshopLimit;
document.getElementById('build-workshop-btn').disabled =
    gameState.level < buildingTypes.workshop.requiredLevel ||
    !homeAtLeast(buildingTypes.workshop.requiredHome || 'camp') ||
    gameState.settlement.workshops.length + gameState.settlement.constructionQueue.filter(b=>b.type==='workshop').length >= workshopLimit ||
    !canAfford(buildingTypes.workshop.buildCost);
document.getElementById('build-workshop-btn').title =
    gameState.level < buildingTypes.workshop.requiredLevel ?
    `Requires level ${buildingTypes.workshop.requiredLevel}` : '';
const workshopCostText = Object.keys(buildingTypes.workshop.buildCost).map(r => `${buildingTypes.workshop.buildCost[r]} ${getResourceIcon(r)}`).join(' ');
const workshopBtn = document.getElementById('build-workshop-btn');
if (gameState.settlement.constructionQueue.some(b=>b.type==='workshop')) {
    workshopBtn.querySelector('.build-text').textContent = 'Building...';
    workshopBtn.querySelector('.build-cost').textContent = '';
    workshopBtn.disabled = true;
} else {
    workshopBtn.querySelector('.build-text').textContent = 'Build Workshop';
    workshopBtn.querySelector('.build-cost').textContent = workshopCostText;
}

const workshopsContainer = document.getElementById('workshops-container');
workshopsContainer.innerHTML = '';
gameState.settlement.workshops.forEach(ws => {
    const wsElement = createBuildingElement('workshop', ws);
    workshopsContainer.appendChild(wsElement);
});
gameState.settlement.constructionQueue.filter(b=>b.type==='workshop').forEach(b=>{
    const el = createConstructionElement('workshop');
    workshopsContainer.appendChild(el);
});

}

function createBuildingElement(type, building) {
    const buildingType = buildingTypes[type];
    const currentLevel = buildingType.levels[building.level];
    const upgrading = !!building.pendingLevel;

    const div = document.createElement('div');
    div.className = 'building-item' + (upgrading ? ' under-construction' : '');

    const levelText = upgrading
        ? `Upgrading to ${buildingType.levels[building.pendingLevel].name}...`
        : `${currentLevel.name} (${currentLevel.production} production)`;

    div.innerHTML = `
        <div class="building-info">
            <div class="building-name">${buildingType.icon} ${buildingType.name}</div>
            <div class="building-level">${levelText}</div>
        </div>
        ${!upgrading && currentLevel.upgradeTo ? `
            <button class="upgrade-btn" onclick="upgradeBuilding('${type}', ${building.id})"
                    ${!canAfford(currentLevel.cost) ? 'disabled' : ''}>
                <span class="upgrade-text">Upgrade to ${buildingType.levels[currentLevel.upgradeTo].name}</span>
                <span class="upgrade-cost">${Object.keys(currentLevel.cost).map(r => `${currentLevel.cost[r]} ${getResourceIcon(r)}`).join(' ')}</span>
            </button>
        ` : ''}
    `;

    return div;
}

function createConstructionElement(type) {
    const buildingType = buildingTypes[type];
    const div = document.createElement('div');
    div.className = 'building-item under-construction';
    div.innerHTML = `
        <div class="building-info">
            <div class="building-name">${buildingType.icon} ${buildingType.name}</div>
            <div class="building-level">Building...</div>
        </div>
    `;
    return div;
}

function updateEventLogUI() {
const logContent = document.getElementById('event-log-content');
logContent.innerHTML = '';

gameState.eventLog.forEach(entry => {
    const div = document.createElement('div');
    div.className = `log-entry ${entry.type}`;
    div.innerHTML = `
        <div><strong>Day ${entry.day}</strong> - ${entry.timestamp}</div>
        <div>${entry.message}</div>
    `;
    logContent.appendChild(div);
});

}

function setupResourceBar() {
    const bar = document.getElementById('resource-bar');
    if (!bar) return;
    bar.innerHTML = Object.keys(gameState.resources).map(r => {
        const icon = getResourceIcon(r);
        return `<div class="resource"><span class="resource-icon">${icon}</span><span class="resource-amount" id="bar-${r}">${gameState.resources[r]}</span><span class="resource-production" id="bar-prod-${r}"></span></div>`;
    }).join('');
}

function updateResourceBar() {
    const prod = calculateDailyProduction();
    Object.keys(gameState.resources).forEach(r => {
        const el = document.getElementById(`bar-${r}`);
        if (el) el.textContent = gameState.resources[r];
        const prodEl = document.getElementById(`bar-prod-${r}`);
        if (prodEl) {
            let val = prod[r] || 0;
            if (r === 'wood') {
                val -= prod.woodConsumed || 0;
            }
            if (r === 'food') {
                val -= prod.foodDemand || 0;
            }
            prodEl.textContent = val > 0 ? `(+${val})` : val < 0 ? `(${val})` : '';
        }
    });
}

function getResourceIcon(resource) {
const icons = {
wood: '🪵',
stone: '🗿',
metal: '⚔️',
food: '🌾',
tools: '🔧',
gems: '💎'
};
return icons[resource] || resource;
}

function getAccessibleLocations() {
    return Object.keys(locations).filter(key => {
        const loc = locations[key];
        return gameState.level >= (loc.requiredLevel || 1);
    });
}

function generateDailyChallenge() {
    const types = ['explore', 'build', 'upgrade', 'gather'];
    const type = types[Math.floor(Math.random() * types.length)];
    const challenge = gameState.dailyChallenge;

    challenge.type = type;
    challenge.progress = 0;
    challenge.completed = false;
    challenge.explored.clear();
    challenge.reward = 50;

    if (type === 'explore') {
        const locs = getAccessibleLocations();
        challenge.target = locs.length;
        challenge.description = `Explore all ${locs.length} unlocked locations`;
        challenge.exploreTargets = new Set(locs);
    } else if (type === 'build') {
        challenge.target = 2 + Math.floor(Math.random() * 3);
        challenge.description = `Construct ${challenge.target} building${challenge.target > 1 ? 's' : ''}`;
    } else if (type === 'upgrade') {
        challenge.target = 1 + Math.floor(Math.random() * 3);
        challenge.description = `Upgrade buildings ${challenge.target} time${challenge.target > 1 ? 's' : ''}`;
    } else if (type === 'gather') {
        const resources = Object.keys(gameState.resources);
        const res = resources[Math.floor(Math.random() * resources.length)];
        challenge.resource = res;
        challenge.target = 5 + Math.floor(Math.random() * 6);
        challenge.description = `Collect ${challenge.target} ${res}`;
        challenge.startAmount = gameState.resources[res];
    }
}

function updateDailyChallengeUI() {
    const textEl = document.getElementById('daily-challenge-text');
    const progEl = document.getElementById('daily-challenge-progress');
    if (!textEl || !progEl) return;
    textEl.textContent = gameState.dailyChallenge.description;
    const target = gameState.dailyChallenge.target;
    const progress = gameState.dailyChallenge.type === 'explore'
        ? gameState.dailyChallenge.explored.size
        : gameState.dailyChallenge.progress;
    progEl.textContent = `${progress}/${target}`;
}

function checkDailyChallengeCompletion() {
    const challenge = gameState.dailyChallenge;
    if (challenge.completed) return;
    let progress = challenge.progress;
    if (challenge.type === 'explore') {
        progress = challenge.explored.size;
    }
    if (progress >= challenge.target) {
        challenge.completed = true;
        addEventLog(`🎯 Daily Challenge completed! Gained ${challenge.reward} XP.`, 'success');
        gainXP(challenge.reward);
    }
}

// Save/Load
function saveGame() {
const saveData = {
...gameState,
dailyChallenge: {
    type: gameState.dailyChallenge.type,
    description: gameState.dailyChallenge.description,
    target: gameState.dailyChallenge.target,
    progress: gameState.dailyChallenge.progress,
    resource: gameState.dailyChallenge.resource,
    startAmount: gameState.dailyChallenge.startAmount,
    reward: gameState.dailyChallenge.reward,
    explored: Array.from(gameState.dailyChallenge.explored),
    completed: gameState.dailyChallenge.completed
}
};

try {
    const gameData = JSON.stringify(saveData);
    // Store in memory instead of localStorage for Claude.ai compatibility
    window.dicecastleGameData = gameData;
    console.log('Game saved to memory');
} catch (error) {
    console.error('Failed to save game:', error);
}

}

function loadGame() {
try {
// Load from memory instead of localStorage
const savedData = window.dicecastleGameData;
if (savedData) {
const loadedState = JSON.parse(savedData);

        // Restore Set from array
        if (loadedState.dailyChallenge) {
            if (loadedState.dailyChallenge.explored) {
                loadedState.dailyChallenge.explored = new Set(loadedState.dailyChallenge.explored);
            }
        }

        if (!loadedState.population) {
            loadedState.population = homeTypes[loadedState.settlement.home].population;
        }

        // Ensure buildings have pendingLevel property
        const keys = ['farms','foresters','quarries','mines','gemMines','workshops'];
        keys.forEach(k => {
            if (loadedState.settlement[k]) {
                loadedState.settlement[k] = loadedState.settlement[k].map(b => ({ pendingLevel: null, ...b }));
            }
        });

        gameState = { ...gameState, ...loadedState };
        console.log('Game loaded from memory');
    }
} catch (error) {
    console.error('Failed to load game:', error);
}

}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initGame);

// Also try to init if DOM is already loaded
if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', initGame);
} else {
initGame();
}