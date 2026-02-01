// ============================================
// Tom - Main Hero Character
// ============================================
// Tom is the protagonist of Beast Quest, a young hero
// destined to become a Master of the Beasts

import { PartyMember, SkillTreeNode, Skill } from '../types'

// Tom's base skills (unlocked as he levels)
export const TOM_SKILLS: Skill[] = [
  // Starting skill
  {
    id: 'tom_strike',
    name: 'Strike',
    description: 'A powerful sword strike',
    type: 'attack',
    targetType: 'single_enemy',
    element: 'physical',
    mpCost: 0,
    power: 1.0,
  },
  // Level 2
  {
    id: 'tom_defend',
    name: 'Shield Guard',
    description: 'Raise your shield to reduce incoming damage',
    type: 'support',
    targetType: 'self',
    element: 'physical',
    mpCost: 0,
    power: 0,
    effects: [{ type: 'buff', stat: 'defense', value: 50, duration: 1 }],
  },
  // Level 3
  {
    id: 'tom_power_strike',
    name: 'Power Strike',
    description: 'A heavy blow that deals increased damage',
    type: 'attack',
    targetType: 'single_enemy',
    element: 'physical',
    mpCost: 5,
    power: 1.5,
  },
  // Level 4
  {
    id: 'tom_war_cry',
    name: 'War Cry',
    description: 'Boost attack power for the whole party',
    type: 'support',
    targetType: 'all_allies',
    element: 'physical',
    mpCost: 8,
    power: 0,
    effects: [{ type: 'buff', stat: 'attack', value: 25, duration: 3 }],
  },
  // Level 5
  {
    id: 'tom_shield_bash',
    name: 'Shield Bash',
    description: 'Strike with your shield, may stun the enemy',
    type: 'attack',
    targetType: 'single_enemy',
    element: 'physical',
    mpCost: 6,
    power: 1.2,
    effects: [{ type: 'status', value: 30 }], // 30% stun chance
  },
  // Level 6
  {
    id: 'tom_cleave',
    name: 'Cleave',
    description: 'A sweeping attack that hits all enemies',
    type: 'attack',
    targetType: 'all_enemies',
    element: 'physical',
    mpCost: 12,
    power: 0.8,
  },
  // Level 7
  {
    id: 'tom_heroic_resolve',
    name: 'Heroic Resolve',
    description: 'Restore HP and cure status effects',
    type: 'support',
    targetType: 'self',
    element: 'holy',
    mpCost: 15,
    power: 0,
    effects: [{ type: 'heal_percent', value: 30 }],
  },
  // Level 8 (Boss skill)
  {
    id: 'tom_beast_slayer',
    name: 'Beast Slayer',
    description: 'A devastating attack effective against Beasts',
    type: 'attack',
    targetType: 'single_enemy',
    element: 'holy',
    mpCost: 20,
    power: 2.5,
  },
]

// Tom's skill tree structure
export const TOM_SKILL_TREE: SkillTreeNode[] = [
  {
    skill: TOM_SKILLS[0], // Strike
    levelRequired: 1,
    prerequisiteSkillIds: [],
    position: { x: 0, y: 0 },
  },
  {
    skill: TOM_SKILLS[1], // Shield Guard
    levelRequired: 2,
    prerequisiteSkillIds: ['tom_strike'],
    position: { x: -1, y: 1 },
  },
  {
    skill: TOM_SKILLS[2], // Power Strike
    levelRequired: 3,
    prerequisiteSkillIds: ['tom_strike'],
    position: { x: 1, y: 1 },
  },
  {
    skill: TOM_SKILLS[3], // War Cry
    levelRequired: 4,
    prerequisiteSkillIds: ['tom_power_strike'],
    position: { x: 2, y: 2 },
  },
  {
    skill: TOM_SKILLS[4], // Shield Bash
    levelRequired: 5,
    prerequisiteSkillIds: ['tom_shield_guard'],
    position: { x: -1, y: 2 },
  },
  {
    skill: TOM_SKILLS[5], // Cleave
    levelRequired: 6,
    prerequisiteSkillIds: ['tom_power_strike'],
    position: { x: 1, y: 2 },
  },
  {
    skill: TOM_SKILLS[6], // Heroic Resolve
    levelRequired: 7,
    prerequisiteSkillIds: ['tom_war_cry', 'tom_shield_bash'],
    position: { x: 0, y: 3 },
  },
  {
    skill: TOM_SKILLS[7], // Beast Slayer
    levelRequired: 8,
    prerequisiteSkillIds: ['tom_cleave', 'tom_heroic_resolve'],
    position: { x: 0, y: 4 },
  },
]

// Experience required per level
export const LEVEL_EXPERIENCE = [
  0, // Level 1
  100, // Level 2
  250, // Level 3
  450, // Level 4
  700, // Level 5
  1000, // Level 6
  1400, // Level 7
  1900, // Level 8
  2500, // Level 9
  3200, // Level 10
]

/**
 * Create Tom with starting stats
 */
export function createTom(): PartyMember {
  return {
    id: 'tom',
    name: 'Tom',
    stats: {
      maxHp: 50,
      currentHp: 50,
      maxMp: 20,
      currentMp: 20,
      attack: 12,
      defense: 10,
      speed: 8,
      level: 1,
      experience: 0,
      experienceToNextLevel: LEVEL_EXPERIENCE[1],
    },
    equipment: {
      weapon: null, // Will start with basic sword
      armor: null, // Will start with basic armor
      accessory: null,
    },
    skills: [TOM_SKILLS[0]], // Start with Strike
    unlockedSkillIds: ['tom_strike'],
    sprite: 'tom',
    skillPoints: 0,
    skillTree: TOM_SKILL_TREE,
  }
}

/**
 * Get stats bonus per level up for Tom
 */
export function getTomLevelUpStats(): Partial<{
  maxHp: number
  maxMp: number
  attack: number
  defense: number
  speed: number
}> {
  return {
    maxHp: 8,
    maxMp: 4,
    attack: 2,
    defense: 2,
    speed: 1,
  }
}

/**
 * Check if Tom can learn a new skill at current level
 */
export function getNewSkillsForLevel(level: number, unlockedSkillIds: string[]): Skill[] {
  return TOM_SKILL_TREE.filter(
    (node) =>
      node.levelRequired === level &&
      !unlockedSkillIds.includes(node.skill.id) &&
      node.prerequisiteSkillIds.every((id) => unlockedSkillIds.includes(id))
  ).map((node) => node.skill)
}
