export const BUILDING_TYPES = {
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
    requiredTech: 'metallurgy',
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
    requiredTech: 'metallurgy',
    levels: {
      basic: { name: 'Basic', upgradeTo: 'improved', cost: { metal: 1 }, production: 1 },
      improved: { name: 'Improved', upgradeTo: 'advanced', cost: { stone: 3, metal: 2 }, production: 2 },
      advanced: { name: 'Advanced', upgradeTo: 'master', cost: { stone: 6, metal: 4 }, production: 3 },
      master: { name: 'Master', upgradeTo: null, cost: null, production: 5 }
    }
  }
};
