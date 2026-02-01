// ============================================
// Combat Action System
// ============================================
// Handles attack, skill, item, and defend actions

import {
  CombatState,
  CombatEntity,
  Skill,
  Item,
  BattleLogEntry,
  StatusEffect,
} from '../types'

/**
 * Calculate damage for an attack or skill
 */
export function calculateDamage(
  attacker: CombatEntity,
  defender: CombatEntity,
  power: number = 1.0,
  _isPhysical: boolean = true
): number {
  const attackStat = attacker.stats.attack
  const defenseStat = defender.isDefending ? defender.stats.defense * 1.5 : defender.stats.defense

  // Base damage formula
  let damage = Math.floor(attackStat * power - defenseStat * 0.5)

  // Variance (±10%)
  const variance = 0.9 + Math.random() * 0.2
  damage = Math.floor(damage * variance)

  // Minimum damage
  damage = Math.max(1, damage)

  return damage
}

/**
 * Calculate healing amount
 */
export function calculateHealing(_healer: CombatEntity, power: number): number {
  // Base healing is 20 + power factor
  const baseHealing = 20 + Math.floor(power * 10)

  // Variance
  const variance = 0.9 + Math.random() * 0.2
  return Math.floor(baseHealing * variance)
}

/**
 * Apply damage to an entity
 */
export function applyDamage(entity: CombatEntity, damage: number): CombatEntity {
  return {
    ...entity,
    stats: {
      ...entity.stats,
      currentHp: Math.max(0, entity.stats.currentHp - damage),
    },
  }
}

/**
 * Apply healing to an entity
 */
export function applyHealing(entity: CombatEntity, amount: number): CombatEntity {
  return {
    ...entity,
    stats: {
      ...entity.stats,
      currentHp: Math.min(entity.stats.maxHp, entity.stats.currentHp + amount),
    },
  }
}

/**
 * Apply MP cost for a skill
 */
export function applyMpCost(entity: CombatEntity, cost: number): CombatEntity {
  return {
    ...entity,
    stats: {
      ...entity.stats,
      currentMp: Math.max(0, entity.stats.currentMp - cost),
    },
  }
}

/**
 * Check if entity can use a skill (has enough MP)
 */
export function canUseSkill(entity: CombatEntity, skill: Skill): boolean {
  return entity.stats.currentMp >= skill.mpCost
}

/**
 * Check if entity is alive
 */
export function isAlive(entity: CombatEntity): boolean {
  return entity.stats.currentHp > 0
}

/**
 * Execute a basic attack
 */
export function executeAttack(
  state: CombatState,
  attackerId: string,
  targetId: string
): { state: CombatState; log: BattleLogEntry } {
  const attacker = state.entities.find((e) => e.id === attackerId)!
  const targetIndex = state.entities.findIndex((e) => e.id === targetId)
  const target = state.entities[targetIndex]

  const damage = calculateDamage(attacker, target)
  const updatedTarget = applyDamage(target, damage)

  const newEntities = [...state.entities]
  newEntities[targetIndex] = updatedTarget

  const log: BattleLogEntry = {
    turn: state.turn,
    message: `${attacker.name} attacks ${target.name} for ${damage} damage!`,
    type: 'damage',
  }

  return {
    state: { ...state, entities: newEntities },
    log,
  }
}

/**
 * Execute a skill
 */
export function executeSkill(
  state: CombatState,
  actorId: string,
  skill: Skill,
  targetIds: string[]
): { state: CombatState; logs: BattleLogEntry[] } {
  let newState = { ...state, entities: [...state.entities] }
  const logs: BattleLogEntry[] = []

  const actorIndex = newState.entities.findIndex((e) => e.id === actorId)
  const actor = newState.entities[actorIndex]

  // Apply MP cost
  newState.entities[actorIndex] = applyMpCost(actor, skill.mpCost)

  logs.push({
    turn: state.turn,
    message: `${actor.name} uses ${skill.name}!`,
    type: 'action',
  })

  // Apply skill effects to each target
  for (const targetId of targetIds) {
    const targetIndex = newState.entities.findIndex((e) => e.id === targetId)
    let target = newState.entities[targetIndex]

    if (skill.type === 'attack' || skill.type === 'magic') {
      // Damage skill
      const isPhysical = skill.element === 'physical'
      const damage = calculateDamage(
        newState.entities[actorIndex],
        target,
        skill.power,
        isPhysical
      )
      target = applyDamage(target, damage)

      logs.push({
        turn: state.turn,
        message: `${target.name} takes ${damage} damage!`,
        type: 'damage',
      })
    } else if (skill.type === 'support') {
      // Support skill (healing or buff)
      if (skill.effects) {
        for (const effect of skill.effects) {
          if (effect.type === 'heal_percent') {
            const healAmount = Math.floor(target.stats.maxHp * (effect.value / 100))
            target = applyHealing(target, healAmount)
            logs.push({
              turn: state.turn,
              message: `${target.name} recovers ${healAmount} HP!`,
              type: 'heal',
            })
          } else if (effect.type === 'buff' || effect.type === 'debuff') {
            const statusEffect: StatusEffect = {
              id: `${skill.id}_${Date.now()}`,
              name: skill.name,
              type: effect.type,
              stat: effect.stat,
              value: effect.value,
              remainingTurns: effect.duration || 3,
            }
            target = {
              ...target,
              statusEffects: [...target.statusEffects, statusEffect],
            }
            logs.push({
              turn: state.turn,
              message: `${target.name}'s ${effect.stat} ${effect.value > 0 ? 'increased' : 'decreased'}!`,
              type: 'status',
            })
          }
        }
      }
    }

    // Apply status effects from skill (like poison, burn)
    if (skill.effects) {
      for (const effect of skill.effects) {
        if (effect.type === 'dot') {
          const statusEffect: StatusEffect = {
            id: `${skill.id}_dot_${Date.now()}`,
            name: 'Poison',
            type: 'poison',
            value: effect.value,
            remainingTurns: effect.duration || 3,
          }
          target = {
            ...target,
            statusEffects: [...target.statusEffects, statusEffect],
          }
          logs.push({
            turn: state.turn,
            message: `${target.name} is poisoned!`,
            type: 'status',
          })
        }
      }
    }

    newState.entities[targetIndex] = target
  }

  return { state: newState, logs }
}

/**
 * Execute using an item
 */
export function executeItem(
  state: CombatState,
  actorId: string,
  item: Item,
  targetId: string
): { state: CombatState; log: BattleLogEntry; consumed: boolean } {
  let newState = { ...state, entities: [...state.entities] }

  const actor = newState.entities.find((e) => e.id === actorId)!
  const targetIndex = newState.entities.findIndex((e) => e.id === targetId)
  let target = newState.entities[targetIndex]

  let logMessage = `${actor.name} uses ${item.name}`
  let logType: 'action' | 'heal' | 'status' = 'action'

  if (item.effect) {
    switch (item.effect.type) {
      case 'heal_hp':
        const healAmount = Math.min(item.effect.value, target.stats.maxHp - target.stats.currentHp)
        target = applyHealing(target, item.effect.value)
        logMessage = `${target.name} recovers ${healAmount} HP!`
        logType = 'heal'
        break

      case 'heal_mp':
        const mpAmount = Math.min(item.effect.value, target.stats.maxMp - target.stats.currentMp)
        target = {
          ...target,
          stats: {
            ...target.stats,
            currentMp: Math.min(target.stats.maxMp, target.stats.currentMp + item.effect.value),
          },
        }
        logMessage = `${target.name} recovers ${mpAmount} MP!`
        logType = 'heal'
        break

      case 'cure_status':
        target = {
          ...target,
          statusEffects: target.statusEffects.filter(
            (e) => e.type !== 'poison' && e.type !== 'burn'
          ),
        }
        logMessage = `${target.name}'s status effects are cured!`
        logType = 'status'
        break
    }
  }

  newState.entities[targetIndex] = target

  return {
    state: newState,
    log: { turn: state.turn, message: logMessage, type: logType },
    consumed: true,
  }
}

/**
 * Execute defend action
 */
export function executeDefend(
  state: CombatState,
  actorId: string
): { state: CombatState; log: BattleLogEntry } {
  const actorIndex = state.entities.findIndex((e) => e.id === actorId)
  const actor = state.entities[actorIndex]

  const newEntities = [...state.entities]
  newEntities[actorIndex] = { ...actor, isDefending: true }

  return {
    state: { ...state, entities: newEntities },
    log: {
      turn: state.turn,
      message: `${actor.name} is defending!`,
      type: 'action',
    },
  }
}

/**
 * Process status effects at start of turn
 */
export function processStatusEffects(
  state: CombatState,
  entityId: string
): { state: CombatState; logs: BattleLogEntry[] } {
  const entityIndex = state.entities.findIndex((e) => e.id === entityId)
  let entity = state.entities[entityIndex]
  const logs: BattleLogEntry[] = []

  // Process each status effect
  const newStatusEffects: StatusEffect[] = []

  for (const effect of entity.statusEffects) {
    if (effect.type === 'poison' || effect.type === 'dot') {
      // Apply damage over time
      entity = applyDamage(entity, effect.value)
      logs.push({
        turn: state.turn,
        message: `${entity.name} takes ${effect.value} poison damage!`,
        type: 'damage',
      })
    } else if (effect.type === 'hot') {
      // Heal over time
      entity = applyHealing(entity, effect.value)
      logs.push({
        turn: state.turn,
        message: `${entity.name} recovers ${effect.value} HP!`,
        type: 'heal',
      })
    }

    // Decrease duration
    if (effect.remainingTurns > 1) {
      newStatusEffects.push({
        ...effect,
        remainingTurns: effect.remainingTurns - 1,
      })
    } else {
      logs.push({
        turn: state.turn,
        message: `${entity.name}'s ${effect.name} wore off.`,
        type: 'status',
      })
    }
  }

  entity = { ...entity, statusEffects: newStatusEffects }

  const newEntities = [...state.entities]
  newEntities[entityIndex] = entity

  return { state: { ...state, entities: newEntities }, logs }
}

/**
 * Reset defending status at start of turn
 */
export function resetDefending(state: CombatState, entityId: string): CombatState {
  const entityIndex = state.entities.findIndex((e) => e.id === entityId)
  const entity = state.entities[entityIndex]

  if (!entity.isDefending) return state

  const newEntities = [...state.entities]
  newEntities[entityIndex] = { ...entity, isDefending: false }

  return { ...state, entities: newEntities }
}

/**
 * Get valid targets for an action
 */
export function getValidTargets(
  state: CombatState,
  actorId: string,
  targetType: 'single_enemy' | 'all_enemies' | 'single_ally' | 'all_allies' | 'self'
): CombatEntity[] {
  const actor = state.entities.find((e) => e.id === actorId)!

  switch (targetType) {
    case 'single_enemy':
      return state.entities.filter((e) => e.isPlayer !== actor.isPlayer && isAlive(e))
    case 'all_enemies':
      return state.entities.filter((e) => e.isPlayer !== actor.isPlayer && isAlive(e))
    case 'single_ally':
      return state.entities.filter((e) => e.isPlayer === actor.isPlayer && isAlive(e))
    case 'all_allies':
      return state.entities.filter((e) => e.isPlayer === actor.isPlayer && isAlive(e))
    case 'self':
      return [actor]
    default:
      return []
  }
}

/**
 * Determine turn order based on speed
 */
export function calculateTurnOrder(entities: CombatEntity[]): CombatEntity[] {
  return [...entities]
    .filter(isAlive)
    .sort((a, b) => {
      // Higher speed goes first
      const speedDiff = b.stats.speed - a.stats.speed
      if (speedDiff !== 0) return speedDiff
      // Tie-breaker: players go first
      if (a.isPlayer !== b.isPlayer) return a.isPlayer ? -1 : 1
      return 0
    })
    .map((entity, index) => ({ ...entity, turnOrder: index }))
}

/**
 * Check for combat end conditions
 */
export function checkCombatEnd(state: CombatState): 'victory' | 'defeat' | null {
  const aliveParty = state.entities.filter((e) => e.isPlayer && isAlive(e))
  const aliveEnemies = state.entities.filter((e) => !e.isPlayer && isAlive(e))

  if (aliveEnemies.length === 0) return 'victory'
  if (aliveParty.length === 0) return 'defeat'
  return null
}

/**
 * Calculate experience reward from defeated enemies
 */
export function calculateExperienceReward(defeatedEnemyIds: string[]): number {
  // This would look up enemy data - simplified for now
  return defeatedEnemyIds.length * 20
}

/**
 * Calculate gold reward from defeated enemies
 */
export function calculateGoldReward(defeatedEnemyIds: string[]): number {
  return defeatedEnemyIds.length * 10
}
