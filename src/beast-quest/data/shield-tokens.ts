// ============================================
// Shield Token System
// ============================================
// Tokens collected from defeated Beasts, displayed on Tom's shield
// Each token grants passive bonuses and an activatable ability

import { ShieldToken, Skill } from '../types'

// Dragon Scale active ability - grants fire resistance
const DRAGON_SCALE_ABILITY: Skill = {
  id: 'dragon_scale_shield',
  name: 'Dragon Scale Shield',
  description: 'Activate to grant fire resistance to the party for 3 turns',
  type: 'support',
  targetType: 'all_allies',
  element: 'fire',
  mpCost: 0, // Token abilities don't use MP
  power: 0,
  effects: [{ type: 'buff', stat: 'defense', value: 30, duration: 3 }], // Represents fire resistance
}

// All shield tokens (only Dragon Scale available in demo)
export const SHIELD_TOKENS: Record<string, ShieldToken> = {
  dragon_scale: {
    id: 'dragon_scale',
    name: 'Dragon Scale',
    description:
      "A scale from Ferno the Fire Dragon. Grants fire resistance when activated.",
    beastName: 'Ferno',
    sprite: 'token_dragon_scale',
    passiveBonus: {
      maxHp: 10,
      defense: 2,
    },
    activeAbility: DRAGON_SCALE_ABILITY,
    isCollected: false,
  },

  // Future tokens for full game
  serpent_tooth: {
    id: 'serpent_tooth',
    name: 'Serpent Tooth',
    description:
      "A fang from Sepron the Sea Serpent. Grants water breathing when activated.",
    beastName: 'Sepron',
    sprite: 'token_serpent_tooth',
    passiveBonus: {
      maxMp: 10,
      speed: 2,
    },
    activeAbility: {
      id: 'serpent_shield',
      name: 'Serpent Shield',
      description: 'Create a water barrier that absorbs damage',
      type: 'support',
      targetType: 'all_allies',
      element: 'ice',
      mpCost: 0,
      power: 0,
      effects: [{ type: 'buff', stat: 'defense', value: 40, duration: 2 }],
    },
    isCollected: false,
  },

  giant_claw: {
    id: 'giant_claw',
    name: 'Giant Claw',
    description:
      "A claw from Arcta the Mountain Giant. Grants increased strength when activated.",
    beastName: 'Arcta',
    sprite: 'token_giant_claw',
    passiveBonus: {
      attack: 5,
      maxHp: 15,
    },
    activeAbility: {
      id: 'giant_strength',
      name: 'Giant Strength',
      description: 'Temporarily gain immense physical power',
      type: 'support',
      targetType: 'self',
      element: 'physical',
      mpCost: 0,
      power: 0,
      effects: [{ type: 'buff', stat: 'attack', value: 50, duration: 3 }],
    },
    isCollected: false,
  },
}

/**
 * Create initial shield tokens for new game (all uncollected)
 */
export function createShieldTokens(): ShieldToken[] {
  return Object.values(SHIELD_TOKENS).map((token) => ({
    ...token,
    isCollected: false,
  }))
}

/**
 * Collect a token after defeating a beast
 */
export function collectToken(tokens: ShieldToken[], tokenId: string): ShieldToken[] {
  return tokens.map((token) =>
    token.id === tokenId ? { ...token, isCollected: true } : token
  )
}

/**
 * Get all collected tokens
 */
export function getCollectedTokens(tokens: ShieldToken[]): ShieldToken[] {
  return tokens.filter((token) => token.isCollected)
}

/**
 * Calculate total passive bonuses from collected tokens
 */
export function calculateTokenBonuses(tokens: ShieldToken[]): {
  maxHp: number
  maxMp: number
  attack: number
  defense: number
  speed: number
} {
  const collected = getCollectedTokens(tokens)

  return collected.reduce(
    (acc, token) => ({
      maxHp: acc.maxHp + (token.passiveBonus.maxHp || 0),
      maxMp: acc.maxMp + (token.passiveBonus.maxMp || 0),
      attack: acc.attack + (token.passiveBonus.attack || 0),
      defense: acc.defense + (token.passiveBonus.defense || 0),
      speed: acc.speed + (token.passiveBonus.speed || 0),
    }),
    { maxHp: 0, maxMp: 0, attack: 0, defense: 0, speed: 0 }
  )
}

/**
 * Check if a token ability can be used (once per combat)
 */
export function canUseTokenAbility(
  token: ShieldToken,
  usedTokens: string[]
): boolean {
  return token.isCollected && !usedTokens.includes(token.id)
}
