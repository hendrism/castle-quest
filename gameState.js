import { CONSTANTS } from './constants.js';

export const gameState = {
    month: 1,
    level: 1,
    xp: 0,
    xpToNext: 100,
    morale: 100,
    rollPenalty: 0,
    season: 'spring',
    explorationsLeft: CONSTANTS.BASE_EXPLORATIONS,
    resources: {
        wood: 0,
        stone: 0,
        metal: 0,
        food: 10,
        tools: 0,
        military: 0,
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
        sawmills: [],
        granaries: [],
        smelters: [],
        barracks: [],
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
    legacy: { builder: 0, explorer: 0, wealthy: 0, lucky: 0, charismatic: 0 },
    culture: null,
    cultureLegacy: { military: 0, trading: 0, scholarly: 0, artistic: 0 },
    technologies: [],
    research: { current: null, progress: 0 },
    population: 5,
    items: {
        luckyCharm: 0,
        magicScroll: 0
    },
    monthlyChallenge: {
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
