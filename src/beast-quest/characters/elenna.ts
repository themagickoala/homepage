// ============================================
// Elenna - Archer Companion
// ============================================
// Elenna is Tom's loyal companion, skilled with a bow
// and accompanied by her wolf Silver

import { PartyMember, SkillTreeNode, Skill } from '../types'
import { LEVEL_EXPERIENCE } from './tom'

// Elenna's base skills (unlocked as she levels)
export const ELENNA_SKILLS: Skill[] = [
  // Starting skill
  {
    id: 'elenna_arrow',
    name: 'Arrow Shot',
    description: 'Fire a precise arrow at the enemy',
    type: 'attack',
    targetType: 'single_enemy',
    element: 'physical',
    mpCost: 0,
    power: 0.9,
  },
  // Level 2
  {
    id: 'elenna_aim',
    name: 'Take Aim',
    description: 'Focus to increase accuracy and critical chance',
    type: 'support',
    targetType: 'self',
    element: 'physical',
    mpCost: 3,
    power: 0,
    effects: [{ type: 'buff', stat: 'attack', value: 30, duration: 2 }],
  },
  // Level 3
  {
    id: 'elenna_poison_arrow',
    name: 'Poison Arrow',
    description: 'An arrow coated in venom that damages over time',
    type: 'attack',
    targetType: 'single_enemy',
    element: 'physical',
    mpCost: 6,
    power: 0.7,
    effects: [{ type: 'dot', value: 5, duration: 3 }],
  },
  // Level 4
  {
    id: 'elenna_heal_herbs',
    name: 'Herbal Remedy',
    description: 'Use forest herbs to heal an ally',
    type: 'support',
    targetType: 'single_ally',
    element: 'physical',
    mpCost: 8,
    power: 1.2,
    effects: [{ type: 'heal_percent', value: 25 }],
  },
  // Level 5
  {
    id: 'elenna_multishot',
    name: 'Multi Shot',
    description: 'Fire a volley of arrows at all enemies',
    type: 'attack',
    targetType: 'all_enemies',
    element: 'physical',
    mpCost: 10,
    power: 0.6,
  },
  // Level 6
  {
    id: 'elenna_piercing_shot',
    name: 'Piercing Shot',
    description: 'A powerful shot that ignores enemy defense',
    type: 'attack',
    targetType: 'single_enemy',
    element: 'physical',
    mpCost: 12,
    power: 1.4,
    effects: [{ type: 'debuff', stat: 'defense', value: -50, duration: 1 }],
  },
  // Level 7
  {
    id: 'elenna_silver_call',
    name: "Silver's Aid",
    description: 'Call Silver to attack and weaken the enemy',
    type: 'attack',
    targetType: 'single_enemy',
    element: 'physical',
    mpCost: 15,
    power: 1.6,
    effects: [{ type: 'debuff', stat: 'attack', value: -20, duration: 2 }],
  },
  // Level 8 (Boss skill)
  {
    id: 'elenna_storm_arrows',
    name: 'Storm of Arrows',
    description: 'Unleash a devastating barrage on all enemies',
    type: 'attack',
    targetType: 'all_enemies',
    element: 'physical',
    mpCost: 20,
    power: 1.3,
  },
]

// Elenna's skill tree structure
export const ELENNA_SKILL_TREE: SkillTreeNode[] = [
  {
    skill: ELENNA_SKILLS[0], // Arrow Shot
    levelRequired: 1,
    prerequisiteSkillIds: [],
    position: { x: 0, y: 0 },
  },
  {
    skill: ELENNA_SKILLS[1], // Take Aim
    levelRequired: 2,
    prerequisiteSkillIds: ['elenna_arrow'],
    position: { x: -1, y: 1 },
  },
  {
    skill: ELENNA_SKILLS[2], // Poison Arrow
    levelRequired: 3,
    prerequisiteSkillIds: ['elenna_arrow'],
    position: { x: 1, y: 1 },
  },
  {
    skill: ELENNA_SKILLS[3], // Herbal Remedy
    levelRequired: 4,
    prerequisiteSkillIds: ['elenna_aim'],
    position: { x: -2, y: 2 },
  },
  {
    skill: ELENNA_SKILLS[4], // Multi Shot
    levelRequired: 5,
    prerequisiteSkillIds: ['elenna_poison_arrow'],
    position: { x: 1, y: 2 },
  },
  {
    skill: ELENNA_SKILLS[5], // Piercing Shot
    levelRequired: 6,
    prerequisiteSkillIds: ['elenna_aim', 'elenna_poison_arrow'],
    position: { x: 0, y: 2 },
  },
  {
    skill: ELENNA_SKILLS[6], // Silver's Aid
    levelRequired: 7,
    prerequisiteSkillIds: ['elenna_multishot'],
    position: { x: 1, y: 3 },
  },
  {
    skill: ELENNA_SKILLS[7], // Storm of Arrows
    levelRequired: 8,
    prerequisiteSkillIds: ['elenna_piercing_shot', 'elenna_silver_call'],
    position: { x: 0, y: 4 },
  },
]

/**
 * Create Elenna with starting stats
 */
export function createElenna(): PartyMember {
  return {
    id: 'elenna',
    name: 'Elenna',
    stats: {
      maxHp: 40,
      currentHp: 40,
      maxMp: 30,
      currentMp: 30,
      attack: 10,
      defense: 6,
      speed: 12,
      level: 1,
      experience: 0,
      experienceToNextLevel: LEVEL_EXPERIENCE[1],
    },
    equipment: {
      weapon: null, // Will start with basic bow
      armor: null, // Will start with basic leather
      accessory: null,
    },
    skills: [ELENNA_SKILLS[0]], // Start with Arrow Shot
    unlockedSkillIds: ['elenna_arrow'],
    sprite: 'elenna',
    skillPoints: 0,
    skillTree: ELENNA_SKILL_TREE,
  }
}

/**
 * Get stats bonus per level up for Elenna
 */
export function getElennaLevelUpStats(): Partial<{
  maxHp: number
  maxMp: number
  attack: number
  defense: number
  speed: number
}> {
  return {
    maxHp: 6,
    maxMp: 5,
    attack: 2,
    defense: 1,
    speed: 2,
  }
}

/**
 * Check if Elenna can learn a new skill at current level
 */
export function getNewSkillsForLevel(level: number, unlockedSkillIds: string[]): Skill[] {
  return ELENNA_SKILL_TREE.filter(
    (node) =>
      node.levelRequired === level &&
      !unlockedSkillIds.includes(node.skill.id) &&
      node.prerequisiteSkillIds.every((id) => unlockedSkillIds.includes(id))
  ).map((node) => node.skill)
}
