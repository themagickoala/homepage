// ============================================
// Animal Companions - Storm & Silver
// ============================================
// Storm is Tom's loyal horse, Silver is Elenna's wolf
// They assist in combat and exploration

import { Companion, Skill } from '../types'

// Storm's combat skill
const STORM_CHARGE: Skill = {
  id: 'storm_charge',
  name: 'Thundering Charge',
  description: "Storm charges through enemies, dealing damage to all",
  type: 'attack',
  targetType: 'all_enemies',
  element: 'physical',
  mpCost: 0, // Companion skills don't use MP
  power: 1.0,
  effects: [{ type: 'debuff', stat: 'defense', value: -10, duration: 2 }],
}

// Silver's combat skill
const SILVER_FANG: Skill = {
  id: 'silver_fang',
  name: 'Savage Fang',
  description: "Silver lunges at an enemy with a powerful bite",
  type: 'attack',
  targetType: 'single_enemy',
  element: 'physical',
  mpCost: 0,
  power: 1.5,
  effects: [{ type: 'debuff', stat: 'attack', value: -15, duration: 2 }],
}

/**
 * Create Storm companion
 */
export function createStorm(): Companion {
  return {
    id: 'storm',
    name: 'Storm',
    sprite: 'storm',
    combatSkill: STORM_CHARGE,
    explorationAbility: 'Fast travel between discovered locations',
    isUnlocked: true, // Available from start in demo
  }
}

/**
 * Create Silver companion
 */
export function createSilver(): Companion {
  return {
    id: 'silver',
    name: 'Silver',
    sprite: 'silver',
    combatSkill: SILVER_FANG,
    explorationAbility: 'Track hidden items and secret passages',
    isUnlocked: true, // Available from start in demo
  }
}

/**
 * Create all companions for a new game
 */
export function createCompanions(): Companion[] {
  return [createStorm(), createSilver()]
}

/**
 * Get companion by ID
 */
export function getCompanion(companions: Companion[], id: string): Companion | undefined {
  return companions.find((c) => c.id === id)
}

/**
 * Check if companion skill can be used (cooldown system for future)
 * For now, companions can be summoned once per combat
 */
export function canUseCompanion(companionId: string, usedCompanions: string[]): boolean {
  return !usedCompanions.includes(companionId)
}
