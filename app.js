function updateBuildingsUI() {
    const buildingTypes = ['farm', 'forester', 'quarry', 'mine', 'gemMine', 'workshop', 'sawmill', 'granary', 'smelter', 'barracks'];
    
    buildingTypes.forEach(type => {
        const limit = getBuildingLimit(type);
        const countEl = document.getElementById(`${type}-count`);
        const maxEl = document.getElementById(`${type}-max`);
        const buildBtn = document.getElementById(`build-${type}-btn`);
        const container = document.getElementById(`${getBuildingKey(type)}-container`);
        
        if (countEl) countEl.textContent = gameState.settlement[getBuildingKey(type)].length;
        if (maxEl) maxEl.textContent = limit;
        
        if (buildBtn) {
            const buildingType = BUILDING_TYPES[type];
            const underConstruction = gameState.settlement.constructionQueue.filter(b => b.type === type).length;
            const currentCount = gameState.settlement[getBuildingKey(type)].length + underConstruction;
            
            buildBtn.disabled = 
                gameState.level < buildingType.requiredLevel ||
                !homeAtLeast(buildingType.requiredHome || 'camp') ||
                (buildingType.requiredTech && !gameState.technologies.includes(buildingType.requiredTech)) ||
                currentCount >= limit ||
                !canAfford(adjustCostForTraits(buildingType.buildCost));
            
            buildBtn.title = getRequirementTooltip(type);
            
            const buildCost = adjustCostForTraits(buildingType.buildCost);
            const costText = formatCost(buildCost);
            
            const buildTextEl = buildBtn.querySelector('.build-text');
            const buildCostEl = buildBtn.querySelector('.build-cost');
            
            if (buildTextEl) {
                buildTextEl.textContent = underConstruction > 0 
                    ? `Build ${buildingType.name} (${underConstruction} in progress)`
                    : `Build ${buildingType.name}`;
            }
            if (buildCostEl) buildCostEl.textContent = costText;
        }
        
        if (container) {
            renderBuildingList(type, container);
        }
    });
    
    updateResearchUI();
}

function renderBuildingList(type, container) {
    const key = getBuildingKey(type);
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
        btn.className = 'btn-primary';
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

function updateExplorationUI() {
    const grid = document.getElementById('locations-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const sorted = Object.entries(LOCATIONS)
        .filter(([key, loc]) => gameState.level >= (loc.requiredLevel || 1))
        .sort((a, b) => (a[1].requiredLevel || 1) - (b[1].requiredLevel || 1));

    let currentLevel = null;
    sorted.forEach(([key, loc]) => {
        const level = loc.requiredLevel || 1;
        if (level !== currentLevel) {
            currentLevel = level;
            const heading = document.createElement('div');
            heading.className = 'location-level-heading';
            heading.textContent = `Level ${level}`;
            grid.appendChild(heading);
        }

        const btn = document.createElement('button');
        btn.className = 'location-card location-btn';
        btn.dataset.location = key;
        btn.innerHTML = `
            <div class="location-header">
                <div class="location-icon">${loc.icon}</div>
                <div class="location-info">
                    <div class="location-name">${loc.name}</div>
                    <div class="location-desc">${loc.description}</div>
                </div>
            </div>
            <div class="location-meta">
                <span id="${key}-difficulty"></span>
                <span id="${key}-chance"></span>
            </div>
        `;
        btn.addEventListener('click', () => exploreLocation(key));
        grid.appendChild(btn);
    });

    // Apply state for difficulty and chance
    document.querySelectorAll('.location-btn').forEach(btn => {
        const loc = LOCATIONS[btn.dataset.location];
        btn.disabled = gameState.explorationsLeft <= 0;

        const diffEl = document.getElementById(`${btn.dataset.location}-difficulty`);
        if (diffEl) {
            const diff = loc.requiredLevel || 1;
            const stars = '★★★★★'.slice(0, diff).padEnd(5, '☆');
            diffEl.textContent = `Difficulty: ${stars}`;
        }

        const chanceEl = document.getElementById(`${btn.dataset.location}-chance`);
        if (chanceEl) {
            const levelDiff = gameState.level - (loc.requiredLevel || 1);
            let chance = 0.5 + levelDiff * 0.1;
            chance = Math.min(0.95, Math.max(0.1, chance));
            chanceEl.textContent = `Success: ${Math.round(chance * 100)}%`;
        }
    });
}

function updateResourceBar() {
    const production = calculateMonthlyProduction();
    RESOURCE_TYPES.forEach(r => {
        const amount = gameState.resources[r];
        const el = document.getElementById(`bar-${r}`);
        if (el) {
            const old = parseInt(el.textContent) || 0;
            if (old !== amount) {
                uiManager.animateCounter(el, old, amount);
            }
        }

        const prodEl = document.getElementById(`bar-prod-${r}`);
        if (prodEl) {
            let val = production[r] || 0;
            if (r === 'wood') {
                val -= production.woodConsumed || 0;
            }
            if (r === 'food') {
                val -= production.foodDemand || 0;
            }
            if (val > 0) {
                prodEl.textContent = `+${val}`;
                prodEl.classList.add('positive');
                prodEl.classList.remove('negative');
            } else if (val < 0) {
                prodEl.textContent = `${val}`;
                prodEl.classList.remove('positive');
                prodEl.classList.add('negative');
            } else {
                prodEl.textContent = '0';
                prodEl.classList.remove('positive', 'negative');
            }
        }
    });
}

function updateEventLogUI() {
    const logContent = document.getElementById('event-log-content');
    if (!logContent) return;
    
    logContent.innerHTML = '';
    gameState.eventLog.forEach(entry => {
        const div = document.createElement('div');
        div.className = `log-entry ${entry.type}`;
        div.innerHTML = `
            <div><strong>Month ${entry.month}</strong> - ${entry.timestamp}</div>
            <div>${entry.message}</div>
        `;
        logContent.appendChild(div);
    });
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

// Monthly challenge system
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
        const res = RESOURCE_TYPES[Math.floor(Math.random() * RESOURCE_TYPES.length)];
        challenge.resource = res;
        challenge.target = 5 + Math.floor(Math.random() * 6);
        challenge.description = `Collect ${challenge.target} ${res}`;
        challenge.startAmount = gameState.resources[res];
    }
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

// Helper functions
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

function getResourceIcon(resource) {
    return RESOURCE_ICONS[resource] || resource;
}

function applyRewards(rewards) {
    ensureResourceKeys();
    Object.entries(rewards).forEach(([resource, amount]) => {
        if (RESOURCE_TYPES.includes(resource)) {
            const current = gameState.resources[resource] || 0;
            gameState.resources[resource] = Math.max(0, current + amount);
        }
    });
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
    return parts.join(' → ');
}

function formatCost(cost) {
    return Object.keys(cost)
        .map(r => `${cost[r]} ${getResourceIcon(r)}`)
        .join(' ');
}

function generateSettlementDecision() {
    return settlementDecisions[Math.floor(Math.random() * settlementDecisions.length)];
}

function openDecisionModal(decision) {
    const modal = document.getElementById('decision-modal');
    const textEl = document.getElementById('decision-text');
    const opt1 = document.getElementById('decision-option1');
    const opt2 = document.getElementById('decision-option2');
    if (!modal || !textEl || !opt1 || !opt2) return;
    
    textEl.textContent = decision.text;
    opt1.textContent = decision.options[0].text;
    opt2.textContent = decision.options[1].text;
    
    opt1.onclick = () => {
        decision.options[0].effect();
        closeDecisionModal();
    };
    opt2.onclick = () => {
        decision.options[1].effect();
        closeDecisionModal();
    };
    
    modal.classList.add('show');
}

function closeDecisionModal() {
    const modal = document.getElementById('decision-modal');
    if (modal) modal.classList.remove('show');
    refreshGameInterface();
    saveGame();
}

function setupCollapsibleHeader() {
    const headerToggle = document.getElementById('header-toggle');
    const headerDetails = document.getElementById('header-details');
    
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
        
        if (loaded.resources) {
            Object.assign(gameState.resources, loaded.resources);
        }
        
        ensureResourceKeys();
        console.log('Game loaded');
    } catch (error) {
        console.error('Failed to load game:', error);
    }
}

// Initialize when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}

export { game };// Month progression and random events
async function advanceMonth() {
    await showDiceRoll((roll) => {
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
        processMoraleEffects();

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
        
        adjustMoraleForResources();

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

        // Handle pending upgrades
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
        maybeTriggerMoraleEvents();

        // Prepare settlement decision for the new month
        pendingDecision = generateSettlementDecision();

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

    refreshGameInterface();
    saveGame();
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

    refreshGameInterface();
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

    refreshGameInterface();
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

    refreshGameInterface();
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

    refreshGameInterface();
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

    refreshGameInterface();
    saveGame();
}

function craftMagicScroll() {
    const cost = { wood: 2, gems: 1 };
    if (!canAfford(cost)) return;
    
    spendResources(cost);
    addEventLog('📜 Crafted a Magic Scroll!', 'success');
    gainXP(15);
    gainXP(20); // Automatically gain the scroll's XP when crafted
    addEventLog('✨ Magic Scroll activated for bonus XP!', 'success');
    
    refreshGameInterface();
    saveGame();
}

// Helper functions
function getBuildingKey(type) {
    switch (type) {
        case 'quarry': return 'quarries';
        case 'granary': return 'granaries';
        case 'barracks': return 'barracks';
        default: return type + 's';
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

    // Farm production with seasonal multiplier
    const farmProduction = gameState.settlement.farms
        .filter(farm => farm.level)
        .reduce((sum, farm) => sum + getProductionValue('farm', farm), 0);
    const seasonMultiplier = seasons[gameState.season].farmMultiplier;
    food += Math.floor(farmProduction * seasonMultiplier);

    // Other production
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

    // Workshop production (consumes wood)
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

    // Barracks production
    const barracksProduction = gameState.settlement.barracks
        .filter(b => b.level)
        .reduce((sum, b) => sum + getProductionValue('barracks', b), 0);
    tools += barracksProduction;

    // Apply level multiplier
    const multiplier = getLevelMultiplier();
    food = Math.floor(food * multiplier);
    wood = Math.floor(wood * multiplier);
    stone = Math.floor(stone * multiplier);
    metal = Math.floor(metal * multiplier);
    tools = Math.floor(tools * multiplier);
    gems = Math.floor(gems * multiplier);

    // Apply morale multiplier
    const moraleMult = getMoraleProductionMultiplier();
    food = Math.floor(food * moraleMult);
    wood = Math.floor(wood * moraleMult);
    stone = Math.floor(stone * moraleMult);
    metal = Math.floor(metal * moraleMult);
    tools = Math.floor(tools * moraleMult);
    gems = Math.floor(gems * moraleMult);

    return { food, wood, stone, metal, tools, gems, woodConsumed, foodDemand };
}

function damageWalls() {
    const order = ['none', 'earthen', 'wood', 'stone'];
    const idx = order.indexOf(gameState.settlement.walls);
    if (idx > 0) {
        gameState.settlement.walls = order[idx - 1];
    }
}

// Ruler management
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

// Morale system
function increaseMorale(amount) {
    gameState.morale = Math.min(100, gameState.morale + amount);
    addEventLog(`😊 Morale +${amount} (now ${gameState.morale})`, 'success');
}

function decreaseMorale(amount) {
    gameState.morale = Math.max(0, gameState.morale - amount);
    addEventLog(`😟 Morale -${amount} (now ${gameState.morale})`, 'failure');
}

function addMoraleEffect(amount, duration) {
    if (duration > 0 && amount !== 0) {
        gameState.moraleEffects.push({ amount, duration });
        const type = amount > 0 ? 'success' : 'failure';
        addEventLog(`⏳ Morale effect ${amount > 0 ? '+' : ''}${amount} for ${duration} months`, type);
    }
}

function processMoraleEffects() {
    gameState.moraleEffects = gameState.moraleEffects.filter(effect => {
        if (effect.duration > 0) {
            if (effect.amount > 0) increaseMorale(effect.amount);
            else decreaseMorale(-effect.amount);
            effect.duration--;
        }
        return effect.duration > 0;
    });
}

function getMoraleProductionMultiplier() {
    if (gameState.morale >= 90) return 1.15;
    if (gameState.morale >= 80) return 1.1;
    if (gameState.morale <= 15) return 0.8;
    if (gameState.morale <= 30) return 0.9;
    return 1;
}

function adjustMoraleForResources() {
    const { food, wood, stone } = gameState.resources;
    if (food <= 0 || wood <= 0 || stone <= 0) {
        decreaseMorale(5);
    }
    if (food > 30 && wood > 30 && stone > 30) {
        increaseMorale(2);
    }
}

function maybeTriggerMoraleEvents() {
    const roll = Math.random();
    if (gameState.morale > 80 && roll < 0.1) {
        increaseMorale(5);
        addEventLog('🥳 The people celebrate recent successes!', 'success');
    } else if (gameState.morale < 50 && roll < 0.1) {
        decreaseMorale(5);
        addEventLog('😠 Unrest spreads among the populace.', 'failure');
    }
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
    refreshGameInterface();
    saveGame();
}

// UI Updates
function refreshGameInterface() {
    // Update header using UI manager
    uiManager.updateMonth(gameState.month);
    uiManager.updateLevel(gameState.level);
    uiManager.updateXP(gameState.xp, gameState.xpToNext);
    uiManager.updateMorale(gameState.morale);
    uiManager.updateSeason(`${seasons[gameState.season].icon}`);
    uiManager.updateRuler(gameState.ruler);

    // Update exploration
    const explorationMax = getExplorationMax();
    uiManager.updateExplorations(gameState.explorationsLeft, explorationMax);

    // Update monthly challenge
    if (gameState.monthlyChallenge.type === 'gather') {
        const res = gameState.monthlyChallenge.resource;
        gameState.monthlyChallenge.progress = Math.max(0, gameState.resources[res] - gameState.monthlyChallenge.startAmount);
    }

    const challengeProgress = gameState.monthlyChallenge.type === 'explore'
        ? `${gameState.monthlyChallenge.explored.size}/${gameState.monthlyChallenge.target}`
        : `${gameState.monthlyChallenge.progress}/${gameState.monthlyChallenge.target}`;
    
    uiManager.updateChallenge(gameState.monthlyChallenge.description, challengeProgress);

    updateExplorationUI();
    updateSettlementUI();
    updateResourceBar();
    updateEventLogUI();
    checkMonthlyChallengeCompletion();
}

function updateSettlementUI() {
    // Home upgrade
    const currentHome = homeTypes[gameState.settlement.home];
    const homeUpgradeBtn = document.getElementById('home-upgrade-btn');
    const homeLevelEl = document.getElementById('home-level');
    
    if (homeLevelEl) homeLevelEl.textContent = currentHome.name;

    if (homeUpgradeBtn && currentHome.upgradeTo) {
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
    } else if (homeUpgradeBtn) {
        homeUpgradeBtn.style.display = 'none';
    }

    // Walls upgrade
    const currentWalls = wallTypes[gameState.settlement.walls];
    const wallsUpgradeBtn = document.getElementById('walls-upgrade-btn');
    const wallsLevelEl = document.getElementById('walls-level');
    const wallBonusEl = document.getElementById('wall-bonus');
    
    if (wallsLevelEl) wallsLevelEl.textContent = currentWalls.name;
    if (wallBonusEl) wallBonusEl.textContent = getWallBonus();

    if (wallsUpgradeBtn && currentWalls.upgradeTo) {
        const nextWalls = wallTypes[currentWalls.upgradeTo];
        const wallCost = adjustCostForTraits(currentWalls.cost);
        const costText = formatCost(wallCost);

        wallsUpgradeBtn.querySelector('.upgrade-text').textContent = `Build ${nextWalls.name} Walls`;
        wallsUpgradeBtn.querySelector('.upgrade-cost').textContent = costText;
        wallsUpgradeBtn.disabled = !canAfford(wallCost);
        wallsUpgradeBtn.style.display = 'flex';
    } else if (wallsUpgradeBtn) {
        wallsUpgradeBtn.style.display = 'none';
    }

    // Population info
    const popEl = document.getElementById('population-count');
    if (popEl) popEl.textContent = gameState.population;

    // Buildings
    updateBuildingsUI();

    // Items
    const luckyCharmEl = document.getElementById('lucky-charm-count');
    const magicScrollEl = document.getElementById('magic-scroll-count');
    const craftLuckyEl = document.getElementById('craft-lucky-charm');
    const craftScrollEl = document.getElementById('craft-magic-scroll');
    
    if (luckyCharmEl) luckyCharmEl.textContent = gameState.items.luckyCharm;
    if (magicScrollEl) magicScrollEl.textContent = gameState.items.magicScroll;
    if (craftLuckyEl) craftLuckyEl.disabled = !canAfford({ wood: 3, stone: 2 });
    if (craftScrollEl) craftScrollEl.disabled = !canAfford({ wood: 2, gems: 1 });
}// Game state has been moved to its own module for better organization
import { gameState } from './gameState.js';
import { LOCATIONS } from './data/locations.js';
import { BUILDING_TYPES } from './data/buildings.js';
import { TECHNOLOGIES } from './data/technologies.js';
import { CONSTANTS, RESOURCE_COLORS, RESOURCE_ICONS, RESOURCE_TYPES } from './constants.js';
import { rollDice, showDiceRoll, closeModal } from "./dice.js";
import { canAfford, spendResources, ensureResourceKeys } from "./utils.js";
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

// Monthly settlement decisions
const settlementDecisions = [
    {
        text: 'A nearby village requests wood for rebuilding.',
        options: [
            {
                text: 'Send aid (-5 wood, +10 morale)',
                effect: () => {
                    gameState.resources.wood = Math.max(0, gameState.resources.wood - 5);
                    increaseMorale(10);
                    addEventLog('Sent wood to help the village.', 'neutral');
                }
            },
            {
                text: 'Refuse (-10 morale, +5 wood)',
                effect: () => {
                    gameState.resources.wood += 5;
                    decreaseMorale(10);
                    addEventLog('Refused to help the village.', 'neutral');
                }
            }
        ]
    },
    {
        text: 'Captured bandits await judgment.',
        options: [
            {
                text: 'Recruit them (+2 population, -10 morale)',
                effect: () => {
                    gameState.population += 2;
                    decreaseMorale(10);
                    addEventLog('Recruited bandits into the settlement.', 'neutral');
                }
            },
            {
                text: 'Execute them (+10 morale, -1 population)',
                effect: () => {
                    if (gameState.population > 0) gameState.population -= 1;
                    increaseMorale(10);
                    addEventLog('Executed the bandits as a warning.', 'neutral');
                }
            }
        ]
    },
    {
        text: 'Citizens propose a grand festival.',
        options: [
            {
                text: 'Hold festival (-10 food & wood, +15 morale)',
                effect: () => {
                    gameState.resources.food = Math.max(0, gameState.resources.food - 10);
                    gameState.resources.wood = Math.max(0, gameState.resources.wood - 10);
                    increaseMorale(15);
                    addEventLog('Held a rousing festival for the people.', 'success');
                }
            },
            {
                text: 'Cancel plans (+5 food, -10 morale)',
                effect: () => {
                    gameState.resources.food += 5;
                    decreaseMorale(10);
                    addEventLog('Festival cancelled to conserve supplies.', 'neutral');
                }
            }
        ]
    }
];

let pendingDecision = null;

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
    },
    {
        name: 'Public celebration',
        type: 'good',
        effect: (severity) => {
            const gain = Math.ceil(severity / 4);
            increaseMorale(gain);
            return { message: `🎉 A public celebration boosts morale by ${gain}.`, type: 'success' };
        }
    },
    {
        name: 'Unrest in the streets',
        type: 'bad',
        effect: (severity) => {
            const loss = Math.ceil(severity / 4);
            decreaseMorale(loss);
            addMoraleEffect(-1, 3);
            return { message: `🚨 Unrest shakes the populace. Morale -${loss}.`, type: 'failure' };
        }
    }
];

// UI Manager Class
class UIManager {
    constructor() {
        this.elements = this.cacheElements();
    }

    cacheElements() {
        return {
            // Header elements
            monthDisplay: document.getElementById('month-display'),
            levelDisplay: document.getElementById('level-display'),
            levelDetailed: document.getElementById('level-detailed'),
            seasonDisplay: document.getElementById('season-display'),
            xpCurrent: document.getElementById('xp-current'),
            xpRequired: document.getElementById('xp-required'),
            xpProgress: document.getElementById('xp-progress'),
            moraleDetailed: document.getElementById('morale-detailed'),
            rulerName: document.getElementById('ruler-name'),
            rulerAge: document.getElementById('ruler-age'),
            rulerYearsRemaining: document.getElementById('ruler-years-remaining'),
            rulerTraits: document.getElementById('ruler-traits'),
            
            // Game state elements
            explorationsLeft: document.getElementById('explorations-left'),
            explorationsMax: document.getElementById('explorations-max'),
            nextMonthBtn: document.getElementById('next-month-btn'),
            
            // Challenge elements
            challengeText: document.getElementById('daily-challenge-text'),
            challengeProgress: document.getElementById('daily-challenge-progress'),
            
            // Resource elements
            resourceBar: document.getElementById('resource-bar'),
            
            // Event log
            eventLogContent: document.getElementById('event-log-content')
        };
    }

    updateElement(element, value, animate = false) {
        if (!element) return;
        const oldValue = element.textContent;
        element.textContent = value;
        if (animate && oldValue !== value) {
            this.pulseElement(element);
        }
    }

    pulseElement(element) {
        if (!element) return;
        element.classList.add('pulse');
        setTimeout(() => element.classList.remove('pulse'), 600);
    }

    updateMonth(month) {
        this.updateElement(this.elements.monthDisplay, month, true);
    }

    updateLevel(level) {
        this.updateElement(this.elements.levelDisplay, level, true);
        this.updateElement(this.elements.levelDetailed, level, true);
    }

    updateSeason(seasonText) {
        this.updateElement(this.elements.seasonDisplay, seasonText);
    }

    updateXP(current, required) {
        this.updateElement(this.elements.xpCurrent, current);
        this.updateElement(this.elements.xpRequired, required);
        if (this.elements.xpProgress) {
            this.elements.xpProgress.max = required;
            this.elements.xpProgress.value = current;
            this.pulseElement(this.elements.xpProgress);
        }
    }

    updateMorale(morale) {
        let face = '😀';
        if (morale < 25) face = '😠';
        else if (morale < 50) face = '😟';
        else if (morale < 75) face = '🙂';
        this.updateElement(this.elements.moraleDetailed, `${face} ${morale}`, true);
    }

    updateRuler(ruler) {
        if (!ruler) return;
        this.updateElement(this.elements.rulerName, ruler.name);
        this.updateElement(this.elements.rulerAge, ruler.age);
        this.updateElement(this.elements.rulerYearsRemaining, ruler.yearsRemaining);
        this.updateElement(this.elements.rulerTraits, ruler.traits.join(', '));
    }

    updateExplorations(left, max) {
        this.updateElement(this.elements.explorationsLeft, left);
        this.updateElement(this.elements.explorationsMax, max);
        if (this.elements.nextMonthBtn) {
            this.elements.nextMonthBtn.disabled = left > 0;
        }
    }

    updateChallenge(description, progress) {
        this.updateElement(this.elements.challengeText, description);
        this.updateElement(this.elements.challengeProgress, progress);
    }

    animateCounter(element, from, to) {
        if (!element) return;
        const duration = 500;
        const start = performance.now();
        
        const step = (now) => {
            const progress = Math.min(1, (now - start) / duration);
            const value = Math.floor(from + (to - from) * progress);
            element.textContent = value;
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }
}

const uiManager = new UIManager();

// Core Game class
class Game {
    constructor() {
        this.state = gameState;
    }

    startExploration(locationKey) {
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
        ensureResourceKeys();
        this.refreshGameInterface();
    }

    upgradeHome() {
        upgradeHome();
    }

    refreshGameInterface() {
        refreshGameInterface();
    }
}

const game = new Game();

// Initialize game
function initGame() {
    console.log('Initializing Dice & Castle...');
    try {
        loadGame();
        ensureResourceKeys();
        
        if (!gameState.population) {
            gameState.population = homeTypes[gameState.settlement.home].population;
        }
        if (!gameState.ruler || !gameState.ruler.name) {
            createNewRuler();
        }
        
        generateMonthlyChallenge();
        updateResearchUI();
        refreshGameInterface();
        setupEventListeners();
        setupCollapsibleHeader();
        
        console.log('Game initialized successfully!');
    } catch (error) {
        console.error('Error initializing game:', error);
        addEventLog(`❌ Game initialization failed: ${error.message}`, 'failure');
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
    locationBtns.forEach((btn) => {
        btn.addEventListener('click', (e) => {
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
        nextMonthBtn.addEventListener('click', () => advanceMonth());
    }

    // Settlement upgrades
    const homeUpgradeBtn = document.getElementById('home-upgrade-btn');
    const wallsUpgradeBtn = document.getElementById('walls-upgrade-btn');

    if (homeUpgradeBtn) {
        homeUpgradeBtn.addEventListener('click', () => upgradeHome());
    }

    if (wallsUpgradeBtn) {
        wallsUpgradeBtn.addEventListener('click', () => upgradeWalls());
    }

    // Building construction buttons
    const buildingButtons = [
        'farm', 'quarry', 'mine', 'workshop', 'forester', 'gemMine', 
        'sawmill', 'granary', 'smelter', 'barracks'
    ];

    buildingButtons.forEach(type => {
        const btn = document.getElementById(`build-${type}-btn`);
        if (btn) {
            btn.addEventListener('click', () => buildBuilding(type));
        }
    });

    // Research
    const researchSelect = document.getElementById('research-select');
    const startResearchBtn = document.getElementById('start-research-btn');

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
        craftBtn.addEventListener('click', () => craftLuckyCharm());
    }
    if (craftScrollBtn) {
        craftScrollBtn.addEventListener('click', () => craftMagicScroll());
    }

    // Event log controls
    const clearLogBtn = document.getElementById('clear-log-btn');
    if (clearLogBtn) {
        clearLogBtn.addEventListener('click', () => clearEventLog());
    }

    // Modal controls
    const closeModalBtn = document.getElementById('modal-continue');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            closeModal();
            if (pendingDecision) {
                openDecisionModal(pendingDecision);
                pendingDecision = null;
            }
        });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('dice-modal');
            if (modal && modal.classList.contains('show')) {
                closeModal();
                if (pendingDecision) {
                    openDecisionModal(pendingDecision);
                    pendingDecision = null;
                }
            }
        }
    });

    console.log('Event listeners setup complete');
}

// Exploration
async function exploreLocation(locationKey) {
    if (gameState.isExploring) return;
    
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
            refreshGameInterface();
            return;
        }

        gameState.isExploring = true;

        await showDiceRoll((roll) => {
            const result = calculateExplorationResult(locationKey, roll);
            applyRewards(result.rewards);
            gainXP(result.xp);

            const rewardsText = Object.keys(result.rewards)
                .filter(r => result.rewards[r] !== 0)
                .map(r => {
                    const amt = result.rewards[r];
                    const icon = getResourceIcon(r);
                    return `${amt > 0 ? '+' : ''}${amt} ${icon}`;
                })
                .join(' ');

            let logMsg = `🎲 Rolled ${result.roll}: ${result.message}`;
            if (rewardsText) {
                logMsg += ` Rewards: ${rewardsText}`;
            }
            addEventLog(logMsg, result.type);

            const details = [logMsg];
            if (result.xp) {
                details.push(`+${result.xp} XP`);
            }
            details.push(`Explorations remaining: ${gameState.explorationsLeft}`);

            return details;
        });

        gameState.explorationsLeft--;
        if (gameState.monthlyChallenge.type === 'explore' && gameState.monthlyChallenge.exploreTargets && gameState.monthlyChallenge.exploreTargets.has(locationKey)) {
            gameState.monthlyChallenge.explored.add(locationKey);
            gameState.monthlyChallenge.progress = gameState.monthlyChallenge.explored.size;
        }
        checkMonthlyChallengeCompletion();

        refreshGameInterface();
        saveGame();
        gameState.isExploring = false;

    } catch (error) {
        console.error('Exploration failed:', error);
        addEventLog(`❌ Exploration failed: ${error.message}`, 'failure');
        refreshGameInterface();
        gameState.isExploring = false;
    }
}

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
            type,
            roll: effectiveRoll
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