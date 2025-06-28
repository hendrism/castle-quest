export const LOCATIONS = {
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
