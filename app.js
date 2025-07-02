// Game state has been moved to its own module for better organization
import { gameState } from './gameState.js';
import { LOCATIONS } from './data/locations.js';
import { BUILDING_TYPES } from './data/buildings.js';
import { TECHNOLOGIES } from './data/technologies.js';
import { CONSTANTS, RESOURCE_COLORS } from './constants.js';
import { uiManager } from './uiManager.js';
import { rollDice, showDiceRoll, closeModal } from "./dice.js";
import { canAfford, spendResources } from "./utils.js";
import { startResearch, progressResearch, getAvailableTechnologies, getResearchProgress } from './research.js';

// Game data

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
        buildingLimits: { farm: 2, forester: 2, quarry: 2, mine: 0, workshop: 0, gemMine: 0, sawmill: 0, granary: 0, smelter: 0, barracks: 0 },
        population: 5
    },
    house: {
        name: 'House',
        upgradeTo: 'hall',
        cost: { wood: 10, stone: 5 },
        buildingLimits: { farm: 4, forester: 3, quarry: 3, mine: 1, workshop: 0, gemMine: 0, sawmill: 1, granary: 1, smelter: 0, barracks: 0 },
        population: 10
    },
    hall: {
        name: 'Hall',
        upgradeTo: 'fortress',
        cost: { stone: 20, metal: 5 },
        buildingLimits: { farm: 5, forester: 4, quarry: 4, mine: 2, workshop: 1, gemMine: 1, sawmill: 2, granary: 2, smelter: 1, barracks: 0 },
        population: 15
    },
    fortress: {
        name: 'Fortress',
        upgradeTo: null,
        cost: null,
        buildingLimits: { farm: 6, forester: 5, quarry: 5, mine: 3, workshop: 2, gemMine: 2, sawmill: 2, granary: 2, smelter: 1, barracks: 1 },
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

// Core Game class encapsulating high level actions
class Game {
    constructor() {
        this.state = gameState;
    }

    exploreLocation(locationKey) {
        exploreLocation(locationKey);
    }

    advanceMonth() {
        advanceMonth();
    }

    save() {
        saveGame();
    }

    load() {
        loadGame();
        debouncedRefreshGameInterface();
    }

    upgradeHome() {
        upgradeHome();
    }

    refreshGameInterface() {
        debouncedRefreshGameInterface();
    }
}

const game = new Game();

// Initialize game
function initGame() {
    console.log('Initializing Dice & Castle...');
    try {
        loadGame();
        validateGameState(gameState);
        if (!gameState.population) {
            gameState.population = homeTypes[gameState.settlement.home].population;
        }
        if (!gameState.ruler || !gameState.ruler.name) {
            createNewRuler();
        }
        setupResourceBar();
        generateMonthlyChallenge();
        updateResearchUI();
        debouncedRefreshGameInterface();
        setupEventListeners();
        setupCollapsibleHeader();
        initScrollIndicators();
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

    // Next month button
    const nextMonthBtn = document.getElementById('next-month-btn');
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            console.log('Next month button clicked');
            advanceMonth();
        });
    } else {
        console.error('Next month button not found!');
    }

    // Floating next month button
    const fabNext = document.getElementById('fab-next-month');
    if (fabNext) {
        fabNext.addEventListener('click', () => {
            console.log('FAB next month clicked');
            advanceMonth();
        });
    }

    // Enhanced header behavior
    const header = document.querySelector('header');
    const sentinel = document.querySelector('.sentinel');
    let lastScroll = window.scrollY;
    let inactivity;

    if (header && sentinel) {
        new IntersectionObserver(entries => {
            for (const e of entries) {
                header.classList.toggle('header--collapsed', !e.isIntersecting);
            }
        }).observe(sentinel);

        function hideAfterDelay() {
            clearTimeout(inactivity);
            inactivity = setTimeout(() => header.classList.add('header--hidden'), 2000);
        }

        window.addEventListener('scroll', () => {
            const y = window.scrollY;
            if (y > lastScroll && y > 50) {
                header.classList.add('header--hidden');
            } else {
                header.classList.remove('header--hidden');
            }
            lastScroll = y;
            hideAfterDelay();
        });

        ['touchstart', 'mousemove'].forEach(evt =>
            window.addEventListener(evt, () => {
                clearTimeout(inactivity);
                header.classList.remove('header--hidden');
            })
        );

        hideAfterDelay();
    }

    // Save and load buttons
    const saveBtn = document.getElementById('save-btn');
    const loadBtn = document.getElementById('load-btn');

    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            console.log('Save button clicked');
            game.save();
        });
    }

    if (loadBtn) {
        loadBtn.addEventListener('click', () => {
            console.log('Load button clicked');
            game.load();
        });
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
    const buildSawmillBtn = document.getElementById('build-sawmill-btn');
    const buildGranaryBtn = document.getElementById('build-granary-btn');
    const buildSmelterBtn = document.getElementById('build-smelter-btn');
    const buildBarracksBtn = document.getElementById('build-barracks-btn');
    const researchSelect = document.getElementById('research-select');
    const startResearchBtn = document.getElementById('start-research-btn');

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

    if (buildSawmillBtn) {
        buildSawmillBtn.addEventListener('click', () => {
            buildBuilding('sawmill');
        });
    }

    if (buildGranaryBtn) {
        buildGranaryBtn.addEventListener('click', () => {
            buildBuilding('granary');
        });
    }

    if (buildSmelterBtn) {
        buildSmelterBtn.addEventListener('click', () => {
            buildBuilding('smelter');
        });
    }

    if (buildBarracksBtn) {
        buildBarracksBtn.addEventListener('click', () => {
            buildBuilding('barracks');
        });
    }

    if (buildWorkshopBtn) {
        buildWorkshopBtn.addEventListener('click', () => {
            console.log('Build workshop clicked');
            buildBuilding('workshop');
        });
    }

    if (startResearchBtn) {
        startResearchBtn.addEventListener('click', () => {
            const key = researchSelect.value;
            if (startResearch(key)) {
                updateResearchUI();
            }
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
    const logSearch = document.getElementById('log-search');

    if (clearLogBtn) {
        clearLogBtn.addEventListener('click', () => {
            console.log('Clear log clicked');
            clearEventLog();
        });
    }

    if (textSizeSelect) {
        textSizeSelect.addEventListener('change', changeTextSize);
    }

    if (logSearch) {
        logSearch.addEventListener('input', updateEventLogUI);
    }

    // Modal controls
    const closeModalBtn = document.getElementById('close-modal-btn');
    const modalCloseX = document.querySelector('.modal-close-btn');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            console.log('Close modal clicked');
            closeModal();
        });
    }
    if (modalCloseX) {
        modalCloseX.addEventListener('click', () => closeModal());
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('dice-modal');
            if (modal && modal.classList.contains('show')) {
                closeModal();
            }
        }
    });

    console.log('Event listeners setup complete');

}

// Exploration
function exploreLocation(locationKey) {
    try {
        if (gameState.explorationsLeft <= 0) {
            throw new Error('No explorations remaining');
        }

        const location = LOCATIONS[locationKey];
        if (!location) {
            throw new Error(`Invalid location: ${locationKey}`);
        }

        if (gameState.level < (location.requiredLevel || 1)) {
            addEventLog(`🔒 ${location.name} requires level ${location.requiredLevel}.`, 'failure');
            debouncedRefreshGameInterface();
            return;
        }

        gameState.explorationsLeft--;

        if (gameState.monthlyChallenge.type === 'explore' && gameState.monthlyChallenge.exploreTargets && gameState.monthlyChallenge.exploreTargets.has(locationKey)) {
            gameState.monthlyChallenge.explored.add(locationKey);
            gameState.monthlyChallenge.progress = gameState.monthlyChallenge.explored.size;
        }
        checkMonthlyChallengeCompletion();

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

            debouncedRefreshGameInterface();
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

    } catch (error) {
        console.error('Exploration failed:', error);
        addEventLog(`❌ Exploration failed: ${error.message}`, 'failure');
        return;
    }
}

/**
 * Calculates exploration results based on location and dice roll
 * @param {string} locationKey - The key of the location being explored
 * @param {number} roll - The dice roll result (1-20)
 * @returns {Object} The exploration result with rewards and messages
 */
function calculateExplorationResult(locationKey, roll) {
    const location = LOCATIONS[locationKey];
    const effectiveRoll = Math.min(20, roll);

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

// Month progression and random event
function advanceMonth() {
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

        // Adjust morale based on event type
        if (eventType === 'success' || eventType === 'good') {
            increaseMorale(5);
        } else if (eventType === 'failure' || eventType === 'bad') {
            decreaseMorale(5);
        }

        // Monthly production from buildings
        const production = calculateMonthlyProduction();
        gameState.resources.food += production.food;
        gameState.resources.wood += production.wood;
        gameState.resources.stone += production.stone;
        gameState.resources.metal += production.metal;
        gameState.resources.tools += production.tools;
        gameState.resources.gems += production.gems;
        if (production.woodConsumed) {
            gameState.resources.wood = Math.max(0, gameState.resources.wood - production.woodConsumed);
        }
        let foodShortage = 0;
        if (production.foodDemand) {
            if (gameState.resources.food >= production.foodDemand) {
                gameState.resources.food -= production.foodDemand;
            } else {
                foodShortage = production.foodDemand - gameState.resources.food;
                gameState.resources.food = 0;
            }
        }
        if (foodShortage > 0) {
            gameState.rollPenalty = foodShortage;
            addEventLog(`⚠️ Food shortage! All rolls suffer -${foodShortage} this month.`, 'failure');
            decreaseMorale(5);
        } else {
            gameState.rollPenalty = 0;
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
            addEventLog(`🏭 Monthly production: ${parts.join(', ')}`, 'success');
        }

        // Progress month
        gameState.month++;
        gameState.explorationsLeft = getExplorationMax();
        generateMonthlyChallenge();
        const completedTech = progressResearch(10);
        if (completedTech) {
            addEventLog(`📚 Research completed: ${TECHNOLOGIES[completedTech].name}!`, 'success');
        }

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
                const bt = BUILDING_TYPES[b.type];
                addEventLog(`${bt.icon} ${bt.name} finished construction!`, 'success');
                gainXP(50);
            });
            gameState.settlement.constructionQueue = [];
        }

        finalizeBuildingUpgrades();

        // Change season every CONSTANTS.SEASON_CYCLE_MONTHS months
        const seasonKeys = Object.keys(seasons);
        const seasonIndex = Math.floor((gameState.month - 1) / CONSTANTS.SEASON_CYCLE_MONTHS) % seasonKeys.length;
        gameState.season = seasonKeys[seasonIndex];

        // Add event log
        addEventLog(eventMessage, eventType);
        addEventLog(`🌅 Month ${gameState.month} begins. Season: ${seasons[gameState.season].icon} ${seasons[gameState.season].name}`, 'neutral');

        checkRulerStability();

        debouncedRefreshGameInterface();
        saveGame();
        window.scrollTo({ top: 0, behavior: 'smooth' });

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
            details.push(`🏭 Monthly production: ${parts.join(', ')}`);
        }
        details.push(`🌅 Month ${gameState.month} begins. Season: ${seasons[gameState.season].icon} ${seasons[gameState.season].name}`);

        return details;
    });
}

// Settlement management
function upgradeHome() {
    const currentHome = homeTypes[gameState.settlement.home];
    if (!currentHome.upgradeTo) return;

    const upgradeCost = adjustCostForTraits(currentHome.cost);
    if (!canAfford(upgradeCost)) return;

    spendResources(upgradeCost);
    gameState.settlement.pendingHome = currentHome.upgradeTo;
    addEventLog(`🏠 Started upgrading home to ${homeTypes[currentHome.upgradeTo].name}. It will be ready tomorrow.`, 'success');

    debouncedRefreshGameInterface();
    saveGame();

}

function upgradeWalls() {
    const currentWalls = wallTypes[gameState.settlement.walls];
    if (!currentWalls.upgradeTo) return;

    const upgradeCost = adjustCostForTraits(currentWalls.cost);
    if (!canAfford(upgradeCost)) return;

    spendResources(upgradeCost);
    gameState.settlement.walls = currentWalls.upgradeTo;

    const newWalls = wallTypes[gameState.settlement.walls];
    addEventLog(`🛡️ Built ${newWalls.name} walls!`, 'success');
    gainXP(75);

    debouncedRefreshGameInterface();
    saveGame();

}

function buildBuilding(type) {
    const buildingType = BUILDING_TYPES[type];
    const key = getBuildingKey(type);
    const maxBuildings = getBuildingLimit(type);
    const underConstruction = gameState.settlement.constructionQueue.filter(b => b.type === type).length;
    const currentCount = gameState.settlement[key].length + underConstruction;

    if (gameState.level < (buildingType.requiredLevel || 1)) return;
    if (buildingType.requiredHome && !homeAtLeast(buildingType.requiredHome)) return;
    if (buildingType.requiredTech && !gameState.technologies.includes(buildingType.requiredTech)) return;
    if (currentCount >= maxBuildings) return;
    const buildCost = adjustCostForTraits(buildingType.buildCost);
    if (!canAfford(buildCost)) return;

    spendResources(buildCost);

    const id = Date.now();
    gameState.settlement.constructionQueue.push({ type, id });
    addEventLog(`${buildingType.icon} Started building a ${buildingType.name}. It will be ready tomorrow.`, 'success');

    if (gameState.monthlyChallenge.type === 'build') {
        gameState.monthlyChallenge.progress++;
    }
    checkMonthlyChallengeCompletion();

    debouncedRefreshGameInterface();
    saveGame();

}

function upgradeBuilding(type, buildingId) {
    const key = getBuildingKey(type);
    const buildings = gameState.settlement[key];
    const building = buildings.find(b => b.id === buildingId);
    if (!building) return;

    const currentLevel = BUILDING_TYPES[type].levels[building.level];
    if (!currentLevel.upgradeTo) return;
    const upgradeCost = adjustCostForTraits(currentLevel.cost);
    if (!canAfford(upgradeCost)) return;

    spendResources(upgradeCost);
    building.pendingLevel = currentLevel.upgradeTo;

    const newLevel = BUILDING_TYPES[type].levels[currentLevel.upgradeTo];
    addEventLog(`${BUILDING_TYPES[type].icon} Upgrading ${BUILDING_TYPES[type].name} to ${newLevel.name}. It will be ready tomorrow.`, 'success');
    gainXP(10);

    if (gameState.monthlyChallenge.type === 'upgrade') {
        gameState.monthlyChallenge.progress++;
    }
    checkMonthlyChallengeCompletion();

    debouncedRefreshGameInterface();
    saveGame();

}

function finalizeBuildingUpgrades() {
    const types = ['farm', 'forester', 'quarry', 'mine', 'gemMine', 'workshop', 'sawmill', 'granary', 'smelter', 'barracks'];
    types.forEach(t => {
        const key = getBuildingKey(t);
        gameState.settlement[key].forEach(b => {
            if (b.pendingLevel) {
                b.level = b.pendingLevel;
                b.pendingLevel = null;
                const bt = BUILDING_TYPES[t];
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
    gameState.items.luckyCharm += CONSTANTS.LUCKY_CHARM_MAX_USES;
    addEventLog(`🍀 Crafted a Lucky Charm! (${CONSTANTS.LUCKY_CHARM_MAX_USES} uses)`, 'success');
    gainXP(30);

    debouncedRefreshGameInterface();
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
    debouncedRefreshGameInterface();
    saveGame();
}

function getBuildingKey(type) {
    switch (type) {
        case 'quarry':
            return 'quarries';
        case 'granary':
            return 'granaries';
        case 'barracks':
            return 'barracks';
        default:
            return type + 's';
    }
}

function getBuildingLimit(type) {
    const home = homeTypes[gameState.settlement.home];
    if (home.buildingLimits && typeof home.buildingLimits[type] === 'number') {
        return home.buildingLimits[type];
    }
    return 0;
}

function getProductionValue(type, building) {
    return BUILDING_TYPES[type].levels[building?.level]?.production ?? 0;
}

function calculateMonthlyProduction() {
    let food = 0;
    let wood = 0;
    let stone = 0;
    let metal = 0;
    let tools = 0;
    let gems = 0;
    let foodDemand = gameState.population || 0;

    const farmProduction = gameState.settlement.farms
        .filter(farm => farm.level)
        .reduce((sum, farm) => sum + getProductionValue('farm', farm), 0);
    const seasonMultiplier = seasons[gameState.season].farmMultiplier;
    food += Math.floor(farmProduction * seasonMultiplier);

    stone += gameState.settlement.quarries
        .filter(quarry => quarry.level)
        .reduce((sum, quarry) => sum + getProductionValue('quarry', quarry), 0);

    metal += gameState.settlement.mines
        .filter(mine => mine.level)
        .reduce((sum, mine) => sum + getProductionValue('mine', mine), 0);

    wood += gameState.settlement.foresters
        .filter(forester => forester.level)
        .reduce((sum, forester) => sum + getProductionValue('forester', forester), 0);

    wood += gameState.settlement.sawmills
        .filter(sm => sm.level)
        .reduce((sum, sm) => sum + getProductionValue('sawmill', sm), 0);

    food += gameState.settlement.granaries
        .filter(g => g.level)
        .reduce((sum, g) => sum + getProductionValue('granary', g), 0);

    gems += gameState.settlement.gemMines
        .filter(gm => gm.level)
        .reduce((sum, gm) => sum + getProductionValue('gemMine', gm), 0);

    metal += gameState.settlement.smelters
        .filter(sm => sm.level)
        .reduce((sum, sm) => sum + getProductionValue('smelter', sm), 0);

    let woodConsumed = 0;
    const toolProduction = gameState.settlement.workshops
        .filter(ws => ws.level)
        .reduce((sum, ws) => {
            const levelData = BUILDING_TYPES.workshop.levels[ws.level];
            const woodCost = levelData.woodCost ?? 1;
            if (gameState.resources.wood - woodConsumed >= woodCost) {
                woodConsumed += woodCost;
                return sum + levelData.production;
            }
            return sum;
        }, 0);
    tools += toolProduction;

    const barracksProduction = gameState.settlement.barracks
        .filter(b => b.level)
        .reduce((sum, b) => sum + getProductionValue('barracks', b), 0);
    tools += barracksProduction;

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
    if (!gameState.culture) {
        const cultures = ['military', 'trading', 'scholarly', 'artistic'];
        gameState.culture = cultures[Math.floor(Math.random() * cultures.length)];
        addEventLog(`🏛️ Your people adopt a ${gameState.culture} culture.`, 'success');
    }
    gameState.ruler = {
        name,
        age: 20,
        yearsRemaining: 20,
        traits
    };
    gameState.morale = 100;
    const traitText = traits.join(', ');
    addEventLog(`👑 ${name} begins their reign. Traits: ${traitText}`, 'success');
    if (traits.includes('wealthy')) {
        gameState.resources.wood += 5;
        gameState.resources.stone += 5;
        gameState.resources.food += 5;
        gameState.resources.metal += 5;
        addEventLog('💰 The new ruler shares their wealth with the settlement!', 'success');
    }
    gameState.explorationsLeft = getExplorationMax();
}

function endCurrentRuler() {
    gameState.pastRulers.push({ ...gameState.ruler });
    gameState.ruler.traits.forEach(t => {
        if (!gameState.legacy[t]) gameState.legacy[t] = 0;
        gameState.legacy[t]++;
    });
    if (gameState.culture) {
        if (!gameState.cultureLegacy[gameState.culture]) gameState.cultureLegacy[gameState.culture] = 0;
        gameState.cultureLegacy[gameState.culture]++;
    }
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

function getRequirementTooltip(type) {
    const bt = BUILDING_TYPES[type];
    const requirements = [];
    if (gameState.level < bt.requiredLevel) {
        requirements.push(`level ${bt.requiredLevel}`);
    }
    if (!homeAtLeast(bt.requiredHome || 'camp')) {
        requirements.push(homeTypes[bt.requiredHome || 'camp'].name);
    }
    if (bt.requiredTech && !gameState.technologies.includes(bt.requiredTech)) {
        requirements.push(`tech: ${TECHNOLOGIES[bt.requiredTech].name}`);
    }
    return requirements.length ? `Requires ${requirements.join(' and ')}` : '';
}

function gainXP(amount) {
    gameState.xp += amount;

    while (gameState.xp >= gameState.xpToNext) {
        gameState.xp -= gameState.xpToNext;
        gameState.level++;
        gameState.xpToNext = Math.floor(gameState.xpToNext * CONSTANTS.LEVEL_XP_MULTIPLIER);
        addEventLog(`🎉 Level up! You are now level ${gameState.level}!`, 'success');
    }

}

function addEventLog(message, type = 'neutral') {
    const timestamp = new Date().toLocaleTimeString();
    gameState.eventLog.unshift({
        message,
        type,
        timestamp,
        month: gameState.month
    });

    // Keep only last 50 entries
    if (gameState.eventLog.length > 50) {
        gameState.eventLog = gameState.eventLog.slice(0, 50);
    }

}

function increaseMorale(amount) {
    gameState.morale = Math.min(100, gameState.morale + amount);
    addEventLog(`😊 Morale +${amount} (now ${gameState.morale})`, 'success');
}

function decreaseMorale(amount) {
    gameState.morale = Math.max(0, gameState.morale - amount);
    addEventLog(`😟 Morale -${amount} (now ${gameState.morale})`, 'failure');
}

function checkRulerStability() {
    if (gameState.morale < 25) {
        const roll = Math.floor(Math.random() * 6) + 1;
        if (roll <= 2) {
            addEventLog('👑 The ruler clings to power, unrest grows.', 'neutral');
            decreaseMorale(5);
        } else if (roll <= 4) {
            addEventLog('⚔️ The ruler is overthrown!', 'failure');
            endCurrentRuler();
            gameState.morale = 50;
        } else {
            addEventLog('📜 The ruler abdicates to the heir.', 'neutral');
            endCurrentRuler();
            gameState.morale = 50;
        }
    }
}

function clearEventLog() {
    gameState.eventLog = [];
    debouncedRefreshGameInterface();
    saveGame();
}

function changeTextSize() {
    const size = document.getElementById('text-size-select').value;
    const logContent = document.getElementById('event-log-content');
    logContent.className = `log-content ${size}`;
}


// UI Updates
function refreshGameInterface() {
    // Update header using cached elements
    uiManager.updateMonth(gameState.month);
    uiManager.updateLevel(gameState.level);
    uiManager.updateXP(gameState.xp, gameState.xpToNext);
    uiManager.updateMorale(gameState.morale);
    uiManager.updateSeason(`${seasons[gameState.season].icon} ${seasons[gameState.season].name}`);

    updateHeaderSummary();
    
    if (gameState.ruler) {
        const el = uiManager.elements;
        if (el.rulerName) el.rulerName.textContent = gameState.ruler.name;
        if (el.rulerAge) el.rulerAge.textContent = gameState.ruler.age;
        if (el.rulerTraits) el.rulerTraits.textContent = gameState.ruler.traits.join(', ');
        uiManager.updateRulerYears(gameState.ruler.yearsRemaining);
    }

    // Update resources bar
    updateResourceBar();

    if (gameState.monthlyChallenge.type === 'gather') {
        const res = gameState.monthlyChallenge.resource;
        gameState.monthlyChallenge.progress = Math.max(0, gameState.resources[res] - gameState.monthlyChallenge.startAmount);
    }


    // Update exploration
    const uiEl = uiManager.elements;
    if (uiEl.explorationsLeft) uiEl.explorationsLeft.textContent = gameState.explorationsLeft;
    const explorationMax = getExplorationMax() ?? 5;
    if (uiEl.explorationMax) uiEl.explorationMax.textContent = explorationMax;

    // Enable/disable location buttons
    document.querySelectorAll('.location-btn').forEach(btn => {
        const loc = LOCATIONS[btn.dataset.location];
        const locked = gameState.level < (loc.requiredLevel || 1);
        btn.disabled = gameState.explorationsLeft <= 0 || locked;
        if (locked) {
            btn.title = `Requires level ${loc.requiredLevel}`;
        } else {
            btn.removeAttribute('title');
        }

        // Update difficulty stars
        const diffEl = document.getElementById(`${btn.dataset.location}-difficulty`);
        if (diffEl) {
            const diff = loc.requiredLevel || 1;
            const stars = '★★★★★'.slice(0, diff).padEnd(5, '☆');
            diffEl.textContent = `Difficulty: ${stars}`;
        }

        // Update success chance hint
        const chanceEl = document.getElementById(`${btn.dataset.location}-chance`);
        if (chanceEl) {
            const levelDiff = gameState.level - (loc.requiredLevel || 1);
            let chance = 0.5 + levelDiff * 0.1;
            chance = Math.min(0.95, Math.max(0.1, chance));
            chanceEl.textContent = `Success: ${Math.round(chance * 100)}%`;
        }
    });

    // Enable/disable next month button
    if (uiEl.nextMonthBtn) uiEl.nextMonthBtn.disabled = gameState.explorationsLeft > 0;

    // Update settlement
    updateSettlementUI();

    // Update event log
    updateEventLogUI();
    updateMonthlyChallengeUI();
    checkMonthlyChallengeCompletion();
    updateScrollIndicators();

}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const debouncedRefreshGameInterface = debounce(refreshGameInterface, 16);

function updateSettlementUI() {
    // Home upgrade
    const currentHome = homeTypes[gameState.settlement.home];
    const homeUpgradeBtn = document.getElementById('home-upgrade-btn');
    document.getElementById('home-level').textContent = currentHome.name;

    if (currentHome.upgradeTo) {
        const nextHome = homeTypes[currentHome.upgradeTo];
        const homeCost = adjustCostForTraits(currentHome.cost);
        const costText = formatCost(homeCost);

        if (gameState.settlement.pendingHome) {
            homeUpgradeBtn.querySelector('.upgrade-text').textContent = `Upgrading to ${nextHome.name}...`;
            homeUpgradeBtn.querySelector('.upgrade-cost').textContent = '';
            homeUpgradeBtn.disabled = true;
        } else {
            homeUpgradeBtn.querySelector('.upgrade-text').textContent = `Upgrade to ${nextHome.name}`;
            homeUpgradeBtn.querySelector('.upgrade-cost').textContent = costText;
            homeUpgradeBtn.disabled = !canAfford(homeCost);
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
        const wallCost = adjustCostForTraits(currentWalls.cost);
        const costText = formatCost(wallCost);

        wallsUpgradeBtn.querySelector('.upgrade-text').textContent = `Build ${nextWalls.name} Walls`;
        wallsUpgradeBtn.querySelector('.upgrade-cost').textContent = costText;
        wallsUpgradeBtn.disabled = !canAfford(wallCost);
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

    updateSettlementDashboard();

}

function updateBuildingsUI() {
    const farmLimit = getBuildingLimit('farm');
    document.getElementById('farm-count').textContent = gameState.settlement.farms.length;
    document.getElementById('farm-max').textContent = farmLimit;
    document.getElementById('build-farm-btn').disabled =
        gameState.level < BUILDING_TYPES.farm.requiredLevel ||
        !homeAtLeast(BUILDING_TYPES.farm.requiredHome || 'camp') ||
        gameState.settlement.farms.length + gameState.settlement.constructionQueue.filter(b => b.type === 'farm').length >= farmLimit ||
        !canAfford(adjustCostForTraits(BUILDING_TYPES.farm.buildCost));
    document.getElementById('build-farm-btn').title = getRequirementTooltip('farm');
    const farmCost = adjustCostForTraits(BUILDING_TYPES.farm.buildCost);
    const farmCostText = formatCost(farmCost);
    const farmBtn = document.getElementById('build-farm-btn');
    const farmInProgress = gameState.settlement.constructionQueue.filter(b => b.type === 'farm').length;
    farmBtn.querySelector('.build-text').textContent =
        farmInProgress > 0 ? `Build Farm (${farmInProgress} in progress)` : 'Build Farm';
    farmBtn.querySelector('.build-cost').textContent = farmCostText;

    renderBuildingList('farm', 'farms-container');

    // Foresters
    const foresterLimit = getBuildingLimit('forester');
    document.getElementById('forester-count').textContent = gameState.settlement.foresters.length;
    document.getElementById('forester-max').textContent = foresterLimit;
    document.getElementById('build-forester-btn').disabled =
        gameState.level < BUILDING_TYPES.forester.requiredLevel ||
        !homeAtLeast(BUILDING_TYPES.forester.requiredHome || 'camp') ||
        gameState.settlement.foresters.length + gameState.settlement.constructionQueue.filter(b => b.type === 'forester').length >= foresterLimit ||
        !canAfford(adjustCostForTraits(BUILDING_TYPES.forester.buildCost));
    document.getElementById('build-forester-btn').title = getRequirementTooltip('forester');
    const foresterCost = adjustCostForTraits(BUILDING_TYPES.forester.buildCost);
    const foresterCostText = formatCost(foresterCost);
    const foresterBtn = document.getElementById('build-forester-btn');
    const foresterInProgress = gameState.settlement.constructionQueue.filter(b => b.type === 'forester').length;
    foresterBtn.querySelector('.build-text').textContent =
        foresterInProgress > 0 ? `Build Forester Hut (${foresterInProgress} in progress)` : 'Build Forester Hut';
    foresterBtn.querySelector('.build-cost').textContent = foresterCostText;

    renderBuildingList('forester', 'foresters-container');

    // Quarries
    const quarryLimit = getBuildingLimit('quarry');
    document.getElementById('quarry-count').textContent = gameState.settlement.quarries.length;
    document.getElementById('quarry-max').textContent = quarryLimit;
    document.getElementById('build-quarry-btn').disabled =
        gameState.level < BUILDING_TYPES.quarry.requiredLevel ||
        !homeAtLeast(BUILDING_TYPES.quarry.requiredHome || 'camp') ||
        gameState.settlement.quarries.length + gameState.settlement.constructionQueue.filter(b => b.type === 'quarry').length >= quarryLimit ||
        !canAfford(adjustCostForTraits(BUILDING_TYPES.quarry.buildCost));
    document.getElementById('build-quarry-btn').title = getRequirementTooltip('quarry');
    const quarryCost = adjustCostForTraits(BUILDING_TYPES.quarry.buildCost);
    const quarryCostText = formatCost(quarryCost);
    const quarryBtn = document.getElementById('build-quarry-btn');
    const quarryInProgress = gameState.settlement.constructionQueue.filter(b => b.type === 'quarry').length;
    quarryBtn.querySelector('.build-text').textContent =
        quarryInProgress > 0 ? `Build Quarry (${quarryInProgress} in progress)` : 'Build Quarry';
    quarryBtn.querySelector('.build-cost').textContent = quarryCostText;

    renderBuildingList('quarry', 'quarries-container');

    // Mines
    const mineLimit = getBuildingLimit('mine');
    document.getElementById('mine-count').textContent = gameState.settlement.mines.length;
    document.getElementById('mine-max').textContent = mineLimit;
    document.getElementById('build-mine-btn').disabled =
        gameState.level < BUILDING_TYPES.mine.requiredLevel ||
        !homeAtLeast(BUILDING_TYPES.mine.requiredHome || 'camp') ||
        gameState.settlement.mines.length + gameState.settlement.constructionQueue.filter(b => b.type === 'mine').length >= mineLimit ||
        !canAfford(adjustCostForTraits(BUILDING_TYPES.mine.buildCost));
    document.getElementById('build-mine-btn').title = getRequirementTooltip('mine');
    const mineCost = adjustCostForTraits(BUILDING_TYPES.mine.buildCost);
    const mineCostText = formatCost(mineCost);
    const mineBtn = document.getElementById('build-mine-btn');
    const mineInProgress = gameState.settlement.constructionQueue.filter(b => b.type === 'mine').length;
    mineBtn.querySelector('.build-text').textContent =
        mineInProgress > 0 ? `Build Mine (${mineInProgress} in progress)` : 'Build Mine';
    mineBtn.querySelector('.build-cost').textContent = mineCostText;

    renderBuildingList('mine', 'mines-container');

    // Gem Mines
    const gemMineLimit = getBuildingLimit('gemMine');
    document.getElementById('gemMine-count').textContent = gameState.settlement.gemMines.length;
    document.getElementById('gemMine-max').textContent = gemMineLimit;
    document.getElementById('build-gemMine-btn').disabled =
        gameState.level < BUILDING_TYPES.gemMine.requiredLevel ||
        !homeAtLeast(BUILDING_TYPES.gemMine.requiredHome || 'camp') ||
        gameState.settlement.gemMines.length + gameState.settlement.constructionQueue.filter(b => b.type === 'gemMine').length >= gemMineLimit ||
        !canAfford(adjustCostForTraits(BUILDING_TYPES.gemMine.buildCost));
    document.getElementById('build-gemMine-btn').title = getRequirementTooltip('gemMine');
    const gemMineCost = adjustCostForTraits(BUILDING_TYPES.gemMine.buildCost);
    const gemMineCostText = formatCost(gemMineCost);
    const gemMineBtn = document.getElementById('build-gemMine-btn');
    const gemMineInProgress = gameState.settlement.constructionQueue.filter(b => b.type === 'gemMine').length;
    gemMineBtn.querySelector('.build-text').textContent =
        gemMineInProgress > 0 ? `Build Gem Mine (${gemMineInProgress} in progress)` : 'Build Gem Mine';
    gemMineBtn.querySelector('.build-cost').textContent = gemMineCostText;

    renderBuildingList('gemMine', 'gemMines-container');

    // Workshops
    const workshopLimit = getBuildingLimit('workshop');
    document.getElementById('workshop-count').textContent = gameState.settlement.workshops.length;
    document.getElementById('workshop-max').textContent = workshopLimit;
    document.getElementById('build-workshop-btn').disabled =
        gameState.level < BUILDING_TYPES.workshop.requiredLevel ||
        !homeAtLeast(BUILDING_TYPES.workshop.requiredHome || 'camp') ||
        gameState.settlement.workshops.length + gameState.settlement.constructionQueue.filter(b => b.type === 'workshop').length >= workshopLimit ||
        !canAfford(adjustCostForTraits(BUILDING_TYPES.workshop.buildCost));
    document.getElementById('build-workshop-btn').title = getRequirementTooltip('workshop');
    const workshopCost = adjustCostForTraits(BUILDING_TYPES.workshop.buildCost);
    const workshopCostText = formatCost(workshopCost);
    const workshopBtn = document.getElementById('build-workshop-btn');
    const workshopInProgress = gameState.settlement.constructionQueue.filter(b => b.type === 'workshop').length;
    workshopBtn.querySelector('.build-text').textContent =
        workshopInProgress > 0 ? `Build Workshop (${workshopInProgress} in progress)` : 'Build Workshop';
    workshopBtn.querySelector('.build-cost').textContent = workshopCostText;

    renderBuildingList('workshop', 'workshops-container');

    // Sawmills
    const sawmillLimit = getBuildingLimit('sawmill');
    document.getElementById('sawmill-count').textContent = gameState.settlement.sawmills.length;
    document.getElementById('sawmill-max').textContent = sawmillLimit;
    document.getElementById('build-sawmill-btn').disabled =
        gameState.level < BUILDING_TYPES.sawmill.requiredLevel ||
        !homeAtLeast(BUILDING_TYPES.sawmill.requiredHome || 'camp') ||
        gameState.settlement.sawmills.length + gameState.settlement.constructionQueue.filter(b => b.type === 'sawmill').length >= sawmillLimit ||
        !canAfford(adjustCostForTraits(BUILDING_TYPES.sawmill.buildCost));
    document.getElementById('build-sawmill-btn').title = getRequirementTooltip('sawmill');
    const sawmillCost = adjustCostForTraits(BUILDING_TYPES.sawmill.buildCost);
    const sawmillBtn = document.getElementById('build-sawmill-btn');
    const sawmillInProgress = gameState.settlement.constructionQueue.filter(b => b.type === 'sawmill').length;
    sawmillBtn.querySelector('.build-text').textContent =
        sawmillInProgress > 0 ? `Build Sawmill (${sawmillInProgress} in progress)` : 'Build Sawmill';
    sawmillBtn.querySelector('.build-cost').textContent = formatCost(sawmillCost);

    renderBuildingList('sawmill', 'sawmills-container');

    // Granaries
    const granaryLimit = getBuildingLimit('granary');
    document.getElementById('granary-count').textContent = gameState.settlement.granaries.length;
    document.getElementById('granary-max').textContent = granaryLimit;
    document.getElementById('build-granary-btn').disabled =
        gameState.level < BUILDING_TYPES.granary.requiredLevel ||
        !homeAtLeast(BUILDING_TYPES.granary.requiredHome || 'camp') ||
        gameState.settlement.granaries.length + gameState.settlement.constructionQueue.filter(b => b.type === 'granary').length >= granaryLimit ||
        !canAfford(adjustCostForTraits(BUILDING_TYPES.granary.buildCost));
    document.getElementById('build-granary-btn').title = getRequirementTooltip('granary');
    const granaryCost = adjustCostForTraits(BUILDING_TYPES.granary.buildCost);
    const granaryBtn = document.getElementById('build-granary-btn');
    const granaryInProgress = gameState.settlement.constructionQueue.filter(b => b.type === 'granary').length;
    granaryBtn.querySelector('.build-text').textContent =
        granaryInProgress > 0 ? `Build Granary (${granaryInProgress} in progress)` : 'Build Granary';
    granaryBtn.querySelector('.build-cost').textContent = formatCost(granaryCost);

    renderBuildingList('granary', 'granaries-container');

    // Smelters
    const smelterLimit = getBuildingLimit('smelter');
    document.getElementById('smelter-count').textContent = gameState.settlement.smelters.length;
    document.getElementById('smelter-max').textContent = smelterLimit;
    document.getElementById('build-smelter-btn').disabled =
        gameState.level < BUILDING_TYPES.smelter.requiredLevel ||
        !homeAtLeast(BUILDING_TYPES.smelter.requiredHome || 'camp') ||
        gameState.settlement.smelters.length + gameState.settlement.constructionQueue.filter(b => b.type === 'smelter').length >= smelterLimit ||
        !canAfford(adjustCostForTraits(BUILDING_TYPES.smelter.buildCost));
    document.getElementById('build-smelter-btn').title = getRequirementTooltip('smelter');
    const smelterCost = adjustCostForTraits(BUILDING_TYPES.smelter.buildCost);
    const smelterBtn = document.getElementById('build-smelter-btn');
    const smelterInProgress = gameState.settlement.constructionQueue.filter(b => b.type === 'smelter').length;
    smelterBtn.querySelector('.build-text').textContent =
        smelterInProgress > 0 ? `Build Smelter (${smelterInProgress} in progress)` : 'Build Smelter';
    smelterBtn.querySelector('.build-cost').textContent = formatCost(smelterCost);

    renderBuildingList('smelter', 'smelters-container');

    // Barracks
    const barracksLimit = getBuildingLimit('barracks');
    document.getElementById('barracks-count').textContent = gameState.settlement.barracks.length;
    document.getElementById('barracks-max').textContent = barracksLimit;
    document.getElementById('build-barracks-btn').disabled =
        gameState.level < BUILDING_TYPES.barracks.requiredLevel ||
        !homeAtLeast(BUILDING_TYPES.barracks.requiredHome || 'camp') ||
        gameState.settlement.barracks.length + gameState.settlement.constructionQueue.filter(b => b.type === 'barracks').length >= barracksLimit ||
        !canAfford(adjustCostForTraits(BUILDING_TYPES.barracks.buildCost));
    document.getElementById('build-barracks-btn').title = getRequirementTooltip('barracks');
    const barracksCost = adjustCostForTraits(BUILDING_TYPES.barracks.buildCost);
    const barracksBtn = document.getElementById('build-barracks-btn');
    const barracksInProgress = gameState.settlement.constructionQueue.filter(b => b.type === 'barracks').length;
    barracksBtn.querySelector('.build-text').textContent =
        barracksInProgress > 0 ? `Build Barracks (${barracksInProgress} in progress)` : 'Build Barracks';
    barracksBtn.querySelector('.build-cost').textContent = formatCost(barracksCost);

    renderBuildingList('barracks', 'barracks-container');
    updateResearchUI();

}

function renderBuildingList(type, containerId) {
    const key = getBuildingKey(type);
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    gameState.settlement[key].forEach((b, idx) => {
        const index = type === 'farm' ? idx + 1 : undefined;
        container.appendChild(createBuildingElement(type, b, index));
    });
    gameState.settlement.constructionQueue
        .filter(q => q.type === type)
        .forEach(() => {
            container.appendChild(createConstructionElement(type));
        });
}

function createBuildingElement(type, building, index) {
    const buildingType = BUILDING_TYPES[type];
    const currentLevel = buildingType.levels[building.level];
    const upgrading = !!building.pendingLevel;

    const div = document.createElement('div');
    div.className = 'building-item' + (upgrading ? ' under-construction' : '');

    const levelText = upgrading
        ? `Upgrading to ${buildingType.levels[building.pendingLevel].name}...`
        : `${currentLevel.name} (${getProductionDescription(type, currentLevel)})`;

    const nameText = index ? `${buildingType.name} #${index}` : buildingType.name;
    div.innerHTML = `
        <div class="building-info">
            <div class="building-name">${buildingType.icon} ${nameText}</div>
            <div class="building-level">${levelText}</div>
        </div>
    `;

    if (!upgrading && currentLevel.upgradeTo) {
        const btn = document.createElement('button');
        btn.className = 'upgrade-btn';
        btn.disabled = !canAfford(adjustCostForTraits(currentLevel.cost));
        btn.innerHTML = `
            <span class="upgrade-text">Upgrade to ${buildingType.levels[currentLevel.upgradeTo].name}</span>
            <span class="upgrade-cost">${formatCost(adjustCostForTraits(currentLevel.cost))}</span>
        `;
        btn.addEventListener('click', () => upgradeBuilding(type, building.id));
        div.appendChild(btn);
    }

    return div;
}

function createConstructionElement(type) {
    const buildingType = BUILDING_TYPES[type];
    const div = document.createElement('div');
    div.className = 'building-item under-construction construction-item';
    div.innerHTML = `
        <div class="building-info">
            <div class="building-name">${buildingType.icon} ${buildingType.name}</div>
            <div class="building-level">Building...</div>
            <div class="progress-bar"><div class="progress"></div></div>
        </div>
    `;
    return div;
}

function updateSettlementDashboard() {
    const overview = document.getElementById('building-overview');
    if (overview) {
        let html = '';
        Object.keys(BUILDING_TYPES).forEach(t => {
            const key = getBuildingKey(t);
            const count = gameState.settlement[key].length;
            if (count > 0) {
                const icon = BUILDING_TYPES[t].icon;
                html += `<span title="${BUILDING_TYPES[t].name}">${icon.repeat(count)}</span>`;
            }
        });
        overview.innerHTML = html || '<em>No buildings yet</em>';
    }

    const happiness = document.getElementById('happiness-meter');
    if (happiness) {
        const val = gameState.morale;
        let face = '😀';
        if (val < 25) face = '😠';
        else if (val < 50) face = '😟';
        else if (val < 75) face = '🙂';
        happiness.textContent = `${face} ${val}`;
    }

    const construction = document.getElementById('construction-progress');
    if (construction) {
        construction.innerHTML = '';
        gameState.settlement.constructionQueue.forEach(b => {
            const item = document.createElement('div');
            item.className = 'construction-item';
            const bt = BUILDING_TYPES[b.type];
            item.innerHTML = `<span class="construction-label">${bt.icon} ${bt.name}</span><div class="progress-bar"><div class="progress"></div></div>`;
            construction.appendChild(item);
        });
        if (gameState.settlement.constructionQueue.length === 0) {
            construction.innerHTML = '<em>No construction</em>';
        }
    }

    const stats = document.getElementById('settlement-stats');
    if (stats) {
        const totalBuildings = Object.keys(BUILDING_TYPES).reduce((sum, t) => sum + gameState.settlement[getBuildingKey(t)].length, 0);
        stats.innerHTML = `
            <div class="stat-item">Population: ${gameState.population}</div>
            <div class="stat-item">Buildings: ${totalBuildings}</div>
            <div class="stat-item">Morale: ${gameState.morale}</div>
        `;
    }
}

function updateEventLogUI() {
    const logContent = document.getElementById('event-log-content');
    const search = document.getElementById('log-search');
    const term = search ? search.value.toLowerCase() : '';
    logContent.innerHTML = '';

    gameState.eventLog.forEach(entry => {
        const div = document.createElement('div');
        div.className = `log-entry ${entry.type}`;
        div.innerHTML = `
        <div><strong>Month ${entry.month}</strong> - ${entry.timestamp}</div>
        <div>${entry.message}</div>
    `;
        if (!term || div.textContent.toLowerCase().includes(term)) {
            logContent.appendChild(div);
        }
    });

}

function setupResourceBar() {
    const bar = document.getElementById('resource-bar');
    if (!bar) return;
    bar.innerHTML = Object.keys(gameState.resources).map(r => {
        const icon = getResourceIcon(r);
        const name = r.charAt(0).toUpperCase() + r.slice(1);
        const amount = gameState.resources[r];
        return `
            <div class="resource" data-resource="${r}" title="${name}">
                <div class="resource-icon">${icon}</div>
                <div class="resource-amount" id="bar-${r}">${amount}</div>
                <div class="resource-production" id="bar-prod-${r}"></div>
            </div>`;
    }).join('');
}

function updateResourceBar() {
    const prod = calculateMonthlyProduction();
    Object.keys(gameState.resources).forEach(r => {
        const amount = gameState.resources[r];
        const el = document.getElementById(`bar-${r}`);
        if (el) {
            const old = parseInt(el.textContent) || 0;
            if (old !== amount) {
                animateCounter(el, old, amount);
            }
        }
        const circle = document.getElementById(`circle-${r}`);
        if (circle) {
            circle.style.setProperty('--progress', Math.min(100, amount));
            circle.style.setProperty('--color', getResourceColor(r));
        }
        const prodEl = document.getElementById(`bar-prod-${r}`);
        if (prodEl) {
            let val = prod[r] || 0;
            if (r === 'wood') {
                val -= prod.woodConsumed || 0;
            }
            if (r === 'food') {
                val -= prod.foodDemand || 0;
            }
            if (val > 0) {
                prodEl.textContent = `↗️ ${val}`;
                prodEl.classList.remove('negative');
            } else if (val < 0) {
                prodEl.textContent = `↘️ ${Math.abs(val)}`;
                prodEl.classList.add('negative');
            } else {
                prodEl.textContent = '';
                prodEl.classList.remove('negative');
            }
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

function getResourceColor(resource) {
    return RESOURCE_COLORS[resource] || '#3498db';
}

function animateCounter(el, from, to) {
    const duration = 500;
    const start = performance.now();
    function step(now) {
        const progress = Math.min(1, (now - start) / duration);
        const value = Math.floor(from + (to - from) * progress);
        el.textContent = value;
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

function getProductionDescription(type, levelData) {
    const bt = BUILDING_TYPES[type];
    const parts = [];
    if (bt.consumes && levelData[`${bt.consumes}Cost`]) {
        parts.push(`-${levelData[`${bt.consumes}Cost`]} ${bt.consumes}`);
    }
    if (bt.produces) {
        parts.push(`+${levelData.production} ${bt.produces}`);
    } else {
        parts.push(`${levelData.production} production`);
    }
    return parts.join(' \u2192 ');
}

function formatCost(cost) {
    return Object.keys(cost)
        .map(r => `${cost[r]} ${getResourceIcon(r)}`)
        .join(' ');
}

function updateResearchUI() {
    const select = document.getElementById('research-select');
    const current = document.getElementById('current-research');
    const progressEl = document.getElementById('research-progress');
    if (!select || !current || !progressEl) return;

    const available = getAvailableTechnologies();
    select.innerHTML = available.map(k => `<option value="${k}">${TECHNOLOGIES[k].name}</option>`).join('');

    const prog = getResearchProgress();
    if (prog) {
        current.textContent = TECHNOLOGIES[prog.key].name;
        progressEl.textContent = `${prog.progress}/${prog.cost}`;
    } else {
        current.textContent = 'None';
        progressEl.textContent = '';
    }
}

function getTraitCount(trait) {
    const legacy = gameState.legacy[trait] || 0;
    const active = gameState.ruler && gameState.ruler.traits.includes(trait) ? 1 : 0;
    return legacy + active;
}

function getExplorationMax() {
    return CONSTANTS.BASE_EXPLORATIONS + getTraitCount('explorer');
}

function adjustCostForTraits(cost) {
    const builderCount = getTraitCount('builder');
    const factor = Math.max(0.5, 1 - 0.1 * builderCount);
    const adjusted = {};
    Object.keys(cost).forEach(r => {
        adjusted[r] = Math.max(1, Math.ceil(cost[r] * factor));
    });
    return adjusted;
}

function getAccessibleLocations() {
    return Object.keys(LOCATIONS).filter(key => {
        const loc = LOCATIONS[key];
        return gameState.level >= (loc.requiredLevel || 1);
    });
}

function generateMonthlyChallenge() {
    const types = ['explore', 'build', 'upgrade', 'gather'];
    const type = types[Math.floor(Math.random() * types.length)];
    const challenge = gameState.monthlyChallenge;

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

function updateMonthlyChallengeUI() {
    const textEl = document.getElementById('daily-challenge-text');
    const progEl = document.getElementById('daily-challenge-progress');
    if (!textEl || !progEl) return;
    textEl.textContent = gameState.monthlyChallenge.description;
    const target = gameState.monthlyChallenge.target;
    const progress = gameState.monthlyChallenge.type === 'explore'
        ? gameState.monthlyChallenge.explored.size
        : gameState.monthlyChallenge.progress;
    progEl.textContent = `${progress}/${target}`;
}

function checkMonthlyChallengeCompletion() {
    const challenge = gameState.monthlyChallenge;
    if (challenge.completed) return;
    let progress = challenge.progress;
    if (challenge.type === 'explore') {
        progress = challenge.explored.size;
    }
    if (progress >= challenge.target) {
        challenge.completed = true;
        addEventLog(`🎯 Monthly Challenge completed! Gained ${challenge.reward} XP.`, 'success');
        gainXP(challenge.reward);
    }
}

function validateGameState(state) {
    const required = ['month', 'level', 'xp', 'resources', 'settlement'];
    for (const field of required) {
        if (!(field in state)) {
            throw new Error(`Missing required field: ${field}`);
        }
    }

    if (state.level < 1) {
        throw new Error('Invalid level');
    }
}

// Save/Load
function saveGame(slot = 'default') {
    const key = `cq-save-${slot}`;
    try {
        const replacer = (k, value) => {
            if (value instanceof Set) {
                return { __type: 'Set', value: Array.from(value) };
            }
            return value;
        };
        const data = JSON.stringify(gameState, replacer);
        localStorage.setItem(key, data);
        console.log('Game saved');
    } catch (error) {
        console.error('Failed to save game:', error);
    }
}

function loadGame(slot = 'default') {
    const key = `cq-save-${slot}`;
    try {
        const data = localStorage.getItem(key);
        if (!data) return;
        const reviver = (k, value) => {
            if (value && value.__type === 'Set') {
                return new Set(value.value);
            }
            return value;
        };
        const loaded = JSON.parse(data, reviver);
        Object.assign(gameState, loaded);
        console.log('Game loaded');
    } catch (error) {
        console.error('Failed to load game:', error);
    }
}

function initScrollIndicators() {
    const containers = document.querySelectorAll('.scroll-container');
    const update = () => updateScrollIndicators(containers);
    update();
    containers.forEach(el => el.addEventListener('scroll', update));
    window.addEventListener('resize', update);
}

function updateScrollIndicators(containers = document.querySelectorAll('.scroll-container')) {
    containers.forEach(el => {
        if (el.scrollWidth - el.clientWidth - el.scrollLeft > 1) {
            el.classList.add('scrollable');
        } else {
            el.classList.remove('scrollable');
        }
    });
}

function setupCollapsibleHeader() {
    const headerToggle = document.getElementById('header-toggle');
    const headerDetails = document.getElementById('header-details');
    const headerSummary = document.getElementById('header-summary');
    
    // Load saved state
    const isExpanded = localStorage.getItem('headerExpanded') === 'true';
    if (isExpanded) {
        expandHeader();
    }
    
    // Toggle on button click
    if (headerToggle) {
        headerToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleHeader();
        });
    }
    
    // Toggle on summary click (optional)
    if (headerSummary) {
        headerSummary.addEventListener('click', () => {
            toggleHeader();
        });
    }
    
    function toggleHeader() {
        const isCurrentlyExpanded = headerDetails.classList.contains('expanded');
        
        if (isCurrentlyExpanded) {
            collapseHeader();
        } else {
            expandHeader();
        }
        
        // Save state
        localStorage.setItem('headerExpanded', !isCurrentlyExpanded);
    }
    
    function expandHeader() {
        headerDetails.classList.add('expanded');
        headerToggle.classList.add('expanded');
        headerToggle.setAttribute('aria-expanded', 'true');
    }
    
    function collapseHeader() {
        headerDetails.classList.remove('expanded');
        headerToggle.classList.remove('expanded');
        headerToggle.setAttribute('aria-expanded', 'false');
    }
}

function updateHeaderSummary() {
    // Top row stats
    const monthEl = document.getElementById('stat-month');
    if (monthEl) monthEl.textContent = gameState.month;

    const levelEl = document.getElementById('stat-level');
    if (levelEl) levelEl.textContent = gameState.level;

    const moraleEl = document.getElementById('stat-morale');
    if (moraleEl) moraleEl.textContent = gameState.morale;

    const seasonEl = document.getElementById('stat-season');
    if (seasonEl) seasonEl.textContent = seasons[gameState.season].icon;

    // Bottom row resources
    const woodEl = document.getElementById('res-wood');
    const stoneEl = document.getElementById('res-stone');
    const militaryEl = document.getElementById('res-military');
    const foodEl = document.getElementById('res-food');
    const toolsEl = document.getElementById('res-tools');
    const gemsEl = document.getElementById('res-gems');

    if (woodEl) woodEl.textContent = gameState.resources.wood;
    if (stoneEl) stoneEl.textContent = gameState.resources.stone;
    if (militaryEl) militaryEl.textContent = gameState.resources.military ?? 0;
    if (foodEl) foodEl.textContent = gameState.resources.food;
    if (toolsEl) toolsEl.textContent = gameState.resources.tools;
    if (gemsEl) gemsEl.textContent = gameState.resources.gems;
}

// Initialize when page loads. Only run initGame once
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}

export { game };
