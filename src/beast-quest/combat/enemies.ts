// ============================================
// Enemy Definitions
// ============================================
// Cave creatures and fire-themed variants for Ferno's dungeon

import { Enemy, Skill, EncounterGroup } from '../types'

// --- Enemy Skills ---

const ENEMY_SKILLS: Record<string, Skill> = {
  bite: {
    id: 'bite',
    name: 'Bite',
    description: 'A vicious bite attack',
    type: 'attack',
    targetType: 'single_enemy',
    element: 'physical',
    mpCost: 0,
    power: 1.0,
  },
  scratch: {
    id: 'scratch',
    name: 'Scratch',
    description: 'Sharp claws rake the target',
    type: 'attack',
    targetType: 'single_enemy',
    element: 'physical',
    mpCost: 0,
    power: 0.8,
  },
  poison_bite: {
    id: 'poison_bite',
    name: 'Poison Bite',
    description: 'A venomous bite that poisons the target',
    type: 'attack',
    targetType: 'single_enemy',
    element: 'physical',
    mpCost: 0,
    power: 0.7,
    effects: [{ type: 'dot', value: 3, duration: 3 }],
  },
  sonic_screech: {
    id: 'sonic_screech',
    name: 'Sonic Screech',
    description: 'A piercing screech that damages all enemies',
    type: 'attack',
    targetType: 'all_enemies',
    element: 'physical',
    mpCost: 0,
    power: 0.5,
  },
  rock_throw: {
    id: 'rock_throw',
    name: 'Rock Throw',
    description: 'Hurls a boulder at the target',
    type: 'attack',
    targetType: 'single_enemy',
    element: 'physical',
    mpCost: 0,
    power: 1.2,
  },
  harden: {
    id: 'harden',
    name: 'Harden',
    description: 'Increases defense temporarily',
    type: 'support',
    targetType: 'self',
    element: 'physical',
    mpCost: 0,
    power: 0,
    effects: [{ type: 'buff', stat: 'defense', value: 30, duration: 2 }],
  },
  fire_breath: {
    id: 'fire_breath',
    name: 'Fire Breath',
    description: 'Breathes flames at all enemies',
    type: 'attack',
    targetType: 'all_enemies',
    element: 'fire',
    mpCost: 0,
    power: 0.8,
    effects: [{ type: 'dot', value: 5, duration: 2 }],
  },
  flame_touch: {
    id: 'flame_touch',
    name: 'Flame Touch',
    description: 'A burning touch that deals fire damage',
    type: 'attack',
    targetType: 'single_enemy',
    element: 'fire',
    mpCost: 0,
    power: 1.1,
  },
  magma_burst: {
    id: 'magma_burst',
    name: 'Magma Burst',
    description: 'Erupts with molten rock',
    type: 'attack',
    targetType: 'all_enemies',
    element: 'fire',
    mpCost: 0,
    power: 0.9,
  },

  // --- Sepron's Dungeon Skills ---

  pinch: {
    id: 'pinch',
    name: 'Pinch',
    description: 'Powerful claw pinch',
    type: 'attack',
    targetType: 'single_enemy',
    element: 'physical',
    mpCost: 0,
    power: 0.9,
  },
  bubble_spray: {
    id: 'bubble_spray',
    name: 'Bubble Spray',
    description: 'A burst of freezing bubbles hits all enemies',
    type: 'attack',
    targetType: 'all_enemies',
    element: 'ice',
    mpCost: 0,
    power: 0.6,
  },
  ink_cloud: {
    id: 'ink_cloud',
    name: 'Ink Cloud',
    description: 'A blinding cloud of ink weakens attack',
    type: 'attack',
    targetType: 'all_enemies',
    element: 'physical',
    mpCost: 0,
    power: 0.4,
    effects: [{ type: 'debuff', stat: 'attack', value: -10, duration: 2 }],
  },
  reef_guard_bash: {
    id: 'reef_guard_bash',
    name: 'Coral Bash',
    description: 'Slams with a heavy coral fist',
    type: 'attack',
    targetType: 'single_enemy',
    element: 'physical',
    mpCost: 0,
    power: 1.1,
  },
  jelly_sting: {
    id: 'jelly_sting',
    name: 'Jelly Sting',
    description: 'Venomous tentacles sting the target',
    type: 'attack',
    targetType: 'single_enemy',
    element: 'ice',
    mpCost: 0,
    power: 0.8,
    effects: [{ type: 'dot', value: 4, duration: 3 }],
  },
  ice_lance: {
    id: 'ice_lance',
    name: 'Ice Lance',
    description: 'Hurls a shard of ice at the target',
    type: 'attack',
    targetType: 'single_enemy',
    element: 'ice',
    mpCost: 0,
    power: 1.2,
  },
  frost_wave: {
    id: 'frost_wave',
    name: 'Frost Wave',
    description: 'A wave of freezing water crashes over all enemies',
    type: 'attack',
    targetType: 'all_enemies',
    element: 'ice',
    mpCost: 0,
    power: 0.7,
  },
  aqua_shield: {
    id: 'aqua_shield',
    name: 'Aqua Shield',
    description: 'Creates a protective water barrier',
    type: 'support',
    targetType: 'self',
    element: 'ice',
    mpCost: 0,
    power: 0,
    effects: [{ type: 'buff', stat: 'defense', value: 25, duration: 2 }],
  },

  // Sepron's skills
  sepron_bite: {
    id: 'sepron_bite',
    name: "Serpent's Fang",
    description: 'A devastating bite from jagged fangs',
    type: 'attack',
    targetType: 'single_enemy',
    element: 'physical',
    mpCost: 0,
    power: 1.4,
  },
  tidal_wave: {
    id: 'tidal_wave',
    name: 'Tidal Wave',
    description: 'A massive wave crashes over the entire party',
    type: 'attack',
    targetType: 'all_enemies',
    element: 'ice',
    mpCost: 0,
    power: 1.1,
  },
  constrict: {
    id: 'constrict',
    name: 'Constrict',
    description: 'Coils around the target, crushing and slowing them',
    type: 'attack',
    targetType: 'single_enemy',
    element: 'physical',
    mpCost: 0,
    power: 0.9,
    effects: [{ type: 'debuff', stat: 'speed', value: -20, duration: 2 }],
  },
  sepron_roar: {
    id: 'sepron_roar',
    name: "Serpent's Roar",
    description: 'A terrifying roar that weakens the party defenses',
    type: 'support',
    targetType: 'all_enemies',
    element: 'physical',
    mpCost: 0,
    power: 0,
    effects: [{ type: 'debuff', stat: 'defense', value: -15, duration: 2 }],
  },

  // Ferno's skills
  ferno_claw: {
    id: 'ferno_claw',
    name: "Dragon's Claw",
    description: 'A devastating claw swipe',
    type: 'attack',
    targetType: 'single_enemy',
    element: 'physical',
    mpCost: 0,
    power: 1.3,
  },
  ferno_breath: {
    id: 'ferno_breath',
    name: 'Inferno Breath',
    description: 'A torrent of dragon fire',
    type: 'attack',
    targetType: 'all_enemies',
    element: 'fire',
    mpCost: 0,
    power: 1.0,
    effects: [{ type: 'dot', value: 4, duration: 2 }],
  },
  ferno_roar: {
    id: 'ferno_roar',
    name: "Dragon's Roar",
    description: 'A terrifying roar that weakens the party',
    type: 'support',
    targetType: 'all_enemies',
    element: 'physical',
    mpCost: 0,
    power: 0,
    effects: [{ type: 'debuff', stat: 'attack', value: -15, duration: 2 }],
  },
  ferno_tail: {
    id: 'ferno_tail',
    name: 'Tail Sweep',
    description: 'A powerful tail sweep hitting all targets',
    type: 'attack',
    targetType: 'all_enemies',
    element: 'physical',
    mpCost: 0,
    power: 0.8,
  },
}

// --- Cave Enemies (Normal) ---

export const ENEMIES: Record<string, Enemy> = {
  // Basic cave creatures
  cave_bat: {
    id: 'cave_bat',
    name: 'Cave Bat',
    stats: {
      maxHp: 15,
      currentHp: 15,
      maxMp: 0,
      currentMp: 0,
      attack: 6,
      defense: 3,
      speed: 12,
      level: 1,
      experience: 0,
      experienceToNextLevel: 0,
    },
    sprite: 'enemy_cave_bat',
    type: 'normal',
    experienceReward: 8,
    goldReward: 5,
    lootTable: [{ itemId: 'potion', dropRate: 0.1 }],
    skills: [ENEMY_SKILLS.bite, ENEMY_SKILLS.sonic_screech],
    aiPattern: 'aggressive',
    weaknesses: ['fire'],
    resistances: [],
  },

  cave_spider: {
    id: 'cave_spider',
    name: 'Cave Spider',
    stats: {
      maxHp: 20,
      currentHp: 20,
      maxMp: 0,
      currentMp: 0,
      attack: 8,
      defense: 4,
      speed: 10,
      level: 2,
      experience: 0,
      experienceToNextLevel: 0,
    },
    sprite: 'enemy_cave_spider',
    type: 'normal',
    experienceReward: 12,
    goldReward: 8,
    lootTable: [
      { itemId: 'potion', dropRate: 0.15 },
      { itemId: 'antidote', dropRate: 0.2 },
    ],
    skills: [ENEMY_SKILLS.bite, ENEMY_SKILLS.poison_bite],
    aiPattern: 'aggressive',
    weaknesses: ['fire'],
    resistances: [],
  },

  rock_golem: {
    id: 'rock_golem',
    name: 'Rock Golem',
    stats: {
      maxHp: 40,
      currentHp: 40,
      maxMp: 0,
      currentMp: 0,
      attack: 10,
      defense: 12,
      speed: 4,
      level: 3,
      experience: 0,
      experienceToNextLevel: 0,
    },
    sprite: 'enemy_rock_golem',
    type: 'normal',
    experienceReward: 25,
    goldReward: 15,
    lootTable: [
      { itemId: 'potion', dropRate: 0.2 },
      { itemId: 'iron_ring', dropRate: 0.05 },
    ],
    skills: [ENEMY_SKILLS.rock_throw, ENEMY_SKILLS.harden],
    aiPattern: 'defensive',
    weaknesses: [],
    resistances: ['physical'],
  },

  // Fire-themed variants
  flame_bat: {
    id: 'flame_bat',
    name: 'Flame Bat',
    stats: {
      maxHp: 18,
      currentHp: 18,
      maxMp: 0,
      currentMp: 0,
      attack: 8,
      defense: 3,
      speed: 14,
      level: 3,
      experience: 0,
      experienceToNextLevel: 0,
    },
    sprite: 'enemy_flame_bat',
    type: 'normal',
    experienceReward: 15,
    goldReward: 10,
    lootTable: [
      { itemId: 'potion', dropRate: 0.15 },
      { itemId: 'ether', dropRate: 0.1 },
    ],
    skills: [ENEMY_SKILLS.bite, ENEMY_SKILLS.flame_touch],
    aiPattern: 'aggressive',
    weaknesses: ['ice'],
    resistances: ['fire'],
  },

  magma_slime: {
    id: 'magma_slime',
    name: 'Magma Slime',
    stats: {
      maxHp: 25,
      currentHp: 25,
      maxMp: 0,
      currentMp: 0,
      attack: 7,
      defense: 6,
      speed: 6,
      level: 3,
      experience: 0,
      experienceToNextLevel: 0,
    },
    sprite: 'enemy_magma_slime',
    type: 'normal',
    experienceReward: 18,
    goldReward: 12,
    lootTable: [
      { itemId: 'ether', dropRate: 0.15 },
      { itemId: 'fire_amulet', dropRate: 0.02 },
    ],
    skills: [ENEMY_SKILLS.flame_touch, ENEMY_SKILLS.magma_burst],
    aiPattern: 'balanced',
    weaknesses: ['ice'],
    resistances: ['fire'],
  },

  // Elite enemy
  fire_elemental: {
    id: 'fire_elemental',
    name: 'Fire Elemental',
    stats: {
      maxHp: 60,
      currentHp: 60,
      maxMp: 0,
      currentMp: 0,
      attack: 14,
      defense: 8,
      speed: 10,
      level: 5,
      experience: 0,
      experienceToNextLevel: 0,
    },
    sprite: 'enemy_fire_elemental',
    type: 'elite',
    experienceReward: 50,
    goldReward: 40,
    lootTable: [
      { itemId: 'hi_potion', dropRate: 0.3 },
      { itemId: 'hi_ether', dropRate: 0.2 },
      { itemId: 'fire_amulet', dropRate: 0.1 },
    ],
    skills: [ENEMY_SKILLS.flame_touch, ENEMY_SKILLS.fire_breath, ENEMY_SKILLS.magma_burst],
    aiPattern: 'aggressive',
    weaknesses: ['ice'],
    resistances: ['fire', 'physical'],
  },

  // Boss: Ferno the Fire Dragon
  ferno: {
    id: 'ferno',
    name: 'Ferno the Fire Dragon',
    stats: {
      maxHp: 150,
      currentHp: 150,
      maxMp: 0,
      currentMp: 0,
      attack: 16,
      defense: 10,
      speed: 10,
      level: 5,
      experience: 0,
      experienceToNextLevel: 0,
    },
    sprite: 'boss_ferno',
    type: 'boss',
    experienceReward: 300,
    goldReward: 150,
    lootTable: [
      { itemId: 'flame_sword', dropRate: 0.5 },
      { itemId: 'hi_potion', dropRate: 1.0 },
      { itemId: 'hi_ether', dropRate: 1.0 },
    ],
    skills: [
      ENEMY_SKILLS.ferno_claw,
      ENEMY_SKILLS.ferno_breath,
      ENEMY_SKILLS.ferno_roar,
      ENEMY_SKILLS.ferno_tail,
    ],
    aiPattern: 'boss_ferno',
    weaknesses: ['ice'],
    resistances: ['fire'],
  },

  // --- Sepron's Dungeon Enemies ---

  tide_crab: {
    id: 'tide_crab',
    name: 'Tide Crab',
    stats: {
      maxHp: 20,
      currentHp: 20,
      maxMp: 0,
      currentMp: 0,
      attack: 7,
      defense: 6,
      speed: 8,
      level: 3,
      experience: 0,
      experienceToNextLevel: 0,
    },
    sprite: 'enemy_tide_crab',
    type: 'normal',
    experienceReward: 12,
    goldReward: 8,
    lootTable: [{ itemId: 'potion', dropRate: 0.1 }],
    skills: [ENEMY_SKILLS.pinch, ENEMY_SKILLS.aqua_shield],
    aiPattern: 'defensive',
    weaknesses: ['fire', 'lightning'],
    resistances: ['ice'],
  },

  sea_slug: {
    id: 'sea_slug',
    name: 'Sea Slug',
    stats: {
      maxHp: 15,
      currentHp: 15,
      maxMp: 0,
      currentMp: 0,
      attack: 5,
      defense: 3,
      speed: 6,
      level: 2,
      experience: 0,
      experienceToNextLevel: 0,
    },
    sprite: 'enemy_sea_slug',
    type: 'normal',
    experienceReward: 10,
    goldReward: 6,
    lootTable: [
      { itemId: 'potion', dropRate: 0.1 },
      { itemId: 'antidote', dropRate: 0.15 },
    ],
    skills: [ENEMY_SKILLS.bubble_spray, ENEMY_SKILLS.ink_cloud],
    aiPattern: 'balanced',
    weaknesses: ['fire'],
    resistances: ['ice'],
  },

  reef_guard: {
    id: 'reef_guard',
    name: 'Reef Guard',
    stats: {
      maxHp: 45,
      currentHp: 45,
      maxMp: 0,
      currentMp: 0,
      attack: 11,
      defense: 10,
      speed: 5,
      level: 4,
      experience: 0,
      experienceToNextLevel: 0,
    },
    sprite: 'enemy_reef_guard',
    type: 'normal',
    experienceReward: 30,
    goldReward: 20,
    lootTable: [
      { itemId: 'potion', dropRate: 0.2 },
      { itemId: 'iron_ring', dropRate: 0.05 },
    ],
    skills: [ENEMY_SKILLS.reef_guard_bash, ENEMY_SKILLS.aqua_shield],
    aiPattern: 'defensive',
    weaknesses: ['lightning'],
    resistances: ['ice', 'physical'],
  },

  ice_jellyfish: {
    id: 'ice_jellyfish',
    name: 'Ice Jellyfish',
    stats: {
      maxHp: 22,
      currentHp: 22,
      maxMp: 0,
      currentMp: 0,
      attack: 9,
      defense: 4,
      speed: 12,
      level: 3,
      experience: 0,
      experienceToNextLevel: 0,
    },
    sprite: 'enemy_ice_jellyfish',
    type: 'normal',
    experienceReward: 15,
    goldReward: 10,
    lootTable: [
      { itemId: 'potion', dropRate: 0.15 },
      { itemId: 'ether', dropRate: 0.1 },
    ],
    skills: [ENEMY_SKILLS.jelly_sting, ENEMY_SKILLS.frost_wave],
    aiPattern: 'aggressive',
    weaknesses: ['fire'],
    resistances: ['ice'],
  },

  frost_serpent: {
    id: 'frost_serpent',
    name: 'Frost Serpent',
    stats: {
      maxHp: 35,
      currentHp: 35,
      maxMp: 0,
      currentMp: 0,
      attack: 12,
      defense: 7,
      speed: 11,
      level: 5,
      experience: 0,
      experienceToNextLevel: 0,
    },
    sprite: 'enemy_frost_serpent',
    type: 'normal',
    experienceReward: 28,
    goldReward: 18,
    lootTable: [
      { itemId: 'ether', dropRate: 0.15 },
      { itemId: 'ice_shard', dropRate: 0.1 },
    ],
    skills: [ENEMY_SKILLS.ice_lance, ENEMY_SKILLS.frost_wave],
    aiPattern: 'aggressive',
    weaknesses: ['fire', 'lightning'],
    resistances: ['ice'],
  },

  aqua_guardian: {
    id: 'aqua_guardian',
    name: 'Aqua Guardian',
    stats: {
      maxHp: 70,
      currentHp: 70,
      maxMp: 0,
      currentMp: 0,
      attack: 15,
      defense: 10,
      speed: 8,
      level: 6,
      experience: 0,
      experienceToNextLevel: 0,
    },
    sprite: 'enemy_aqua_guardian',
    type: 'elite',
    experienceReward: 60,
    goldReward: 50,
    lootTable: [
      { itemId: 'hi_potion', dropRate: 0.3 },
      { itemId: 'hi_ether', dropRate: 0.2 },
      { itemId: 'tidal_pendant', dropRate: 0.05 },
    ],
    skills: [ENEMY_SKILLS.ice_lance, ENEMY_SKILLS.frost_wave, ENEMY_SKILLS.aqua_shield],
    aiPattern: 'balanced',
    weaknesses: ['lightning'],
    resistances: ['ice', 'physical'],
  },

  // Boss: Sepron the Sea Serpent
  sepron: {
    id: 'sepron',
    name: 'Sepron the Sea Serpent',
    stats: {
      maxHp: 200,
      currentHp: 200,
      maxMp: 0,
      currentMp: 0,
      attack: 18,
      defense: 12,
      speed: 12,
      level: 7,
      experience: 0,
      experienceToNextLevel: 0,
    },
    sprite: 'boss_sepron',
    type: 'boss',
    experienceReward: 500,
    goldReward: 250,
    lootTable: [
      { itemId: 'ice_blade', dropRate: 0.5 },
      { itemId: 'hi_potion', dropRate: 1.0 },
      { itemId: 'hi_ether', dropRate: 1.0 },
    ],
    skills: [
      ENEMY_SKILLS.sepron_bite,
      ENEMY_SKILLS.tidal_wave,
      ENEMY_SKILLS.constrict,
      ENEMY_SKILLS.sepron_roar,
    ],
    aiPattern: 'boss_sepron',
    weaknesses: ['lightning', 'fire'],
    resistances: ['ice'],
  },
}

/**
 * Get enemy by ID
 */
export function getEnemy(id: string): Enemy | undefined {
  return ENEMIES[id]
}

/**
 * Create an enemy instance for combat (with fresh stats)
 */
export function createEnemyInstance(enemyId: string): Enemy | null {
  const template = ENEMIES[enemyId]
  if (!template) return null

  return {
    ...template,
    stats: { ...template.stats },
  }
}

// --- Encounter Groups for Dungeon Zones ---

export const ENCOUNTER_GROUPS: Record<string, EncounterGroup[]> = {
  // Early dungeon - basic enemies
  cave_entrance: [
    { enemies: ['cave_bat'], weight: 40 },
    { enemies: ['cave_bat', 'cave_bat'], weight: 30 },
    { enemies: ['cave_spider'], weight: 20 },
    { enemies: ['cave_bat', 'cave_spider'], weight: 10 },
  ],

  // Mid dungeon - mix of basic and stronger
  cave_depths: [
    { enemies: ['cave_spider', 'cave_spider'], weight: 25 },
    { enemies: ['rock_golem'], weight: 25 },
    { enemies: ['cave_bat', 'cave_bat', 'cave_spider'], weight: 20 },
    { enemies: ['flame_bat'], weight: 15 },
    { enemies: ['magma_slime'], weight: 15 },
  ],

  // Late dungeon - fire themed
  volcanic_passage: [
    { enemies: ['flame_bat', 'flame_bat'], weight: 25 },
    { enemies: ['magma_slime', 'magma_slime'], weight: 25 },
    { enemies: ['flame_bat', 'magma_slime'], weight: 20 },
    { enemies: ['fire_elemental'], weight: 15 },
    { enemies: ['rock_golem', 'flame_bat'], weight: 15 },
  ],

  // --- Sepron's Dungeon Encounter Groups ---

  // Early - coastal cave
  coastal_grotto: [
    { enemies: ['tide_crab'], weight: 35 },
    { enemies: ['tide_crab', 'tide_crab'], weight: 25 },
    { enemies: ['sea_slug'], weight: 25 },
    { enemies: ['sea_slug', 'tide_crab'], weight: 15 },
  ],

  // Mid - tidal cavern
  tidal_cavern: [
    { enemies: ['sea_slug', 'sea_slug'], weight: 25 },
    { enemies: ['reef_guard'], weight: 25 },
    { enemies: ['tide_crab', 'ice_jellyfish'], weight: 25 },
    { enemies: ['tide_crab', 'tide_crab', 'sea_slug'], weight: 25 },
  ],

  // Puzzle area - submerged passage
  submerged_passage: [
    { enemies: ['ice_jellyfish', 'ice_jellyfish'], weight: 25 },
    { enemies: ['reef_guard'], weight: 25 },
    { enemies: ['frost_serpent'], weight: 25 },
    { enemies: ['sea_slug', 'ice_jellyfish'], weight: 25 },
  ],

  // Late - coral reef tunnel
  coral_tunnel: [
    { enemies: ['frost_serpent', 'ice_jellyfish'], weight: 25 },
    { enemies: ['aqua_guardian'], weight: 20 },
    { enemies: ['frost_serpent', 'frost_serpent'], weight: 25 },
    { enemies: ['reef_guard', 'frost_serpent'], weight: 30 },
  ],
}

/**
 * Get a random encounter from an encounter group
 */
export function getRandomEncounter(zoneId: string): string[] {
  const groups = ENCOUNTER_GROUPS[zoneId]
  if (!groups || groups.length === 0) return ['cave_bat']

  const totalWeight = groups.reduce((sum, g) => sum + g.weight, 0)
  let random = Math.random() * totalWeight

  for (const group of groups) {
    random -= group.weight
    if (random <= 0) {
      return group.enemies
    }
  }

  return groups[0].enemies
}
