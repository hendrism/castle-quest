export const TECHNOLOGIES = {
  irrigation: {
    name: 'Irrigation',
    description: 'Improves farm production',
    cost: 50,
    prerequisites: [],
    cultures: ['military', 'trading', 'scholarly', 'artistic']
  },
  metallurgy: {
    name: 'Advanced Metallurgy',
    description: 'Allows construction of Workshops and increases metal yields',
    cost: 70,
    prerequisites: [],
    cultures: ['military', 'trading', 'scholarly']
  },
  magicalStudies: {
    name: 'Magical Studies',
    description: 'Unlocks arcane knowledge and special crafts',
    cost: 90,
    prerequisites: [],
    cultures: ['scholarly', 'artistic']
  },
  fortifications: {
    name: 'Fortifications',
    description: 'Improves settlement walls',
    cost: 60,
    prerequisites: [],
    cultures: ['military']
  }
};
