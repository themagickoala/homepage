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

  // Ferno's skills
  ferno_claw: {
    id: 'ferno_claw',
    name: "Dragon's Claw",
    description: 'A devastating claw swipe',
    type: 'attack',
    targetType: 'single_enemy',
    element: 'physical',
    mpCost: 0,
    power: 1.5,
  },
  ferno_breath: {
    id: 'ferno_breath',
    name: 'Inferno Breath',
    description: 'A torrent of dragon fire',
    type: 'attack',
    targetType: 'all_enemies',
    element: 'fire',
    mpCost: 0,
    power: 1.2,
    effects: [{ type: 'dot', value: 8, duration: 3 }],
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
    effects: [{ type: 'debuff', stat: 'attack', value: -20, duration: 2 }],
  },
  ferno_tail: {
    id: 'ferno_tail',
    name: 'Tail Sweep',
    description: 'A powerful tail sweep hitting all targets',
    type: 'attack',
    targetType: 'all_enemies',
    element: 'physical',
    mpCost: 0,
    power: 1.0,
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
      maxHp: 300,
      currentHp: 300,
      maxMp: 0,
      currentMp: 0,
      attack: 25,
      defense: 15,
      speed: 12,
      level: 10,
      experience: 0,
      experienceToNextLevel: 0,
    },
    sprite: 'boss_ferno',
    type: 'boss',
    experienceReward: 500,
    goldReward: 200,
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
