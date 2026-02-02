// ============================================
// Game State Management
// ============================================
// State creation, updates, and save/load serialization

import { GameState, SaveData, ExplorationState, PartyMember, InventorySlot } from './types'
import { createTom } from './characters/tom'
import { createElenna } from './characters/elenna'
import { createCompanions } from './characters/companions'
import { createShieldTokens } from './data/shield-tokens'
import { createStartingInventory, getTomStartingEquipment, getElennaStartingEquipment } from './data/items'
import { FERNO_DUNGEON } from './data/ferno-dungeon'

const SAVE_VERSION = '1.0.0'

/**
 * Create a new game state
 */
export function createNewGameState(): GameState {
  const tom = createTom()
  const elenna = createElenna()

  // Apply starting equipment
  tom.equipment = getTomStartingEquipment()
  elenna.equipment = getElennaStartingEquipment()

  const initialExploration: ExplorationState = {
    currentFloorId: FERNO_DUNGEON.id,
    currentRoomId: FERNO_DUNGEON.startRoomId,
    playerPosition: { ...FERNO_DUNGEON.startPosition },
    playerDirection: 'south',
    visitedRooms: [FERNO_DUNGEON.startRoomId],
    openedChests: [],
    activatedSwitches: [],
    stepsSinceLastEncounter: 0,
  }

  return {
    phase: 'exploring',
    party: [tom, elenna],
    inventory: createStartingInventory(),
    gold: 100,
    companions: createCompanions(),
    shieldTokens: createShieldTokens(),
    exploration: initialExploration,
    combat: null,
    currentDialogue: null,
    currentDialogueNodeId: null,
    flags: {},
    playTime: 0,
  }
}

/**
 * Serialize game state to a save code string
 */
export function serializeGameState(state: GameState): string {
  const saveData: SaveData = {
    version: SAVE_VERSION,
    timestamp: Date.now(),
    gameState: state,
  }

  try {
    const json = JSON.stringify(saveData)
    // Base64 encode for shorter string
    const encoded = btoa(json)
    return encoded
  } catch (error) {
    console.error('Failed to serialize game state:', error)
    throw new Error('Failed to save game')
  }
}

/**
 * Deserialize a save code string to game state
 */
export function deserializeGameState(saveCode: string): GameState | null {
  try {
    const json = atob(saveCode.trim())
    const saveData: SaveData = JSON.parse(json)

    // Version check
    if (!saveData.version || !saveData.gameState) {
      console.error('Invalid save data format')
      return null
    }

    // Migrate old saves if needed (future feature)
    if (saveData.version !== SAVE_VERSION) {
      console.warn(`Save version mismatch: ${saveData.version} vs ${SAVE_VERSION}`)
      // Could add migration logic here
    }

    return saveData.gameState
  } catch (error) {
    console.error('Failed to deserialize save code:', error)
    return null
  }
}

/**
 * Update exploration state
 */
export function updateExplorationState(
  state: GameState,
  updates: Partial<ExplorationState>
): GameState {
  return {
    ...state,
    exploration: {
      ...state.exploration,
      ...updates,
    },
  }
}

/**
 * Change to a new room
 */
export function changeRoom(
  state: GameState,
  roomId: string,
  position: { col: number; row: number }
): GameState {
  const visitedRooms = state.exploration.visitedRooms.includes(roomId)
    ? state.exploration.visitedRooms
    : [...state.exploration.visitedRooms, roomId]

  return updateExplorationState(state, {
    currentRoomId: roomId,
    playerPosition: position,
    visitedRooms,
    stepsSinceLastEncounter: 0, // Reset encounter counter on room change
  })
}

/**
 * Open a chest and add items to inventory
 */
export function openChest(
  state: GameState,
  chestId: string,
  items: InventorySlot[]
): GameState {
  // Add chest to opened list
  const openedChests = [...state.exploration.openedChests, chestId]

  // Add items to inventory
  let newInventory = [...state.inventory]
  for (const slot of items) {
    const existingIndex = newInventory.findIndex((s) => s.item.id === slot.item.id)
    if (existingIndex >= 0 && slot.item.stackable) {
      newInventory[existingIndex] = {
        ...newInventory[existingIndex],
        quantity: Math.min(
          newInventory[existingIndex].quantity + slot.quantity,
          slot.item.maxStack
        ),
      }
    } else {
      newInventory.push(slot)
    }
  }

  return {
    ...state,
    inventory: newInventory,
    exploration: {
      ...state.exploration,
      openedChests,
    },
  }
}

/**
 * Toggle a switch
 */
export function toggleSwitch(state: GameState, switchId: string): GameState {
  const activatedSwitches = state.exploration.activatedSwitches.includes(switchId)
    ? state.exploration.activatedSwitches.filter((id) => id !== switchId)
    : [...state.exploration.activatedSwitches, switchId]

  return updateExplorationState(state, { activatedSwitches })
}

/**
 * Update party member stats
 */
export function updatePartyMember(
  state: GameState,
  memberId: string,
  updates: Partial<PartyMember>
): GameState {
  const party = state.party.map((member) =>
    member.id === memberId ? { ...member, ...updates } : member
  )

  return { ...state, party }
}

/**
 * Heal party member
 */
export function healPartyMember(
  state: GameState,
  memberId: string,
  hpAmount: number,
  mpAmount: number = 0
): GameState {
  const party = state.party.map((member) => {
    if (member.id !== memberId) return member

    return {
      ...member,
      stats: {
        ...member.stats,
        currentHp: Math.min(member.stats.maxHp, member.stats.currentHp + hpAmount),
        currentMp: Math.min(member.stats.maxMp, member.stats.currentMp + mpAmount),
      },
    }
  })

  return { ...state, party }
}

/**
 * Use a consumable item
 */
export function useItem(
  state: GameState,
  itemId: string,
  targetMemberId: string
): GameState {
  // Find item in inventory
  const itemSlot = state.inventory.find((slot) => slot.item.id === itemId)
  if (!itemSlot || itemSlot.quantity <= 0) return state

  const item = itemSlot.item
  let newState = state

  // Apply item effect
  if (item.effect) {
    const target = state.party.find((m) => m.id === targetMemberId)
    if (!target) return state

    switch (item.effect.type) {
      case 'heal_hp':
        newState = healPartyMember(state, targetMemberId, item.effect.value)
        break
      case 'heal_mp':
        newState = healPartyMember(state, targetMemberId, 0, item.effect.value)
        break
      // Add more effect types as needed
    }
  }

  // Remove item from inventory
  const newInventory = state.inventory
    .map((slot) => {
      if (slot.item.id !== itemId) return slot
      return { ...slot, quantity: slot.quantity - 1 }
    })
    .filter((slot) => slot.quantity > 0)

  return { ...newState, inventory: newInventory }
}

/**
 * Equip an item to a party member
 */
export function equipItem(
  state: GameState,
  itemId: string,
  memberId: string
): GameState {
  const itemSlot = state.inventory.find((slot) => slot.item.id === itemId)
  if (!itemSlot) return state

  const item = itemSlot.item
  if (!['weapon', 'armor', 'accessory'].includes(item.type)) return state

  const member = state.party.find((m) => m.id === memberId)
  if (!member) return state

  // Determine equipment slot
  const slot = item.type as 'weapon' | 'armor' | 'accessory'
  const currentEquipped = member.equipment[slot]

  // Swap equipment
  let newInventory = state.inventory.filter((s) => s.item.id !== itemId)
  if (currentEquipped) {
    newInventory.push({ item: currentEquipped, quantity: 1 })
  }

  const party = state.party.map((m) => {
    if (m.id !== memberId) return m
    return {
      ...m,
      equipment: {
        ...m.equipment,
        [slot]: item,
      },
    }
  })

  return { ...state, inventory: newInventory, party }
}

/**
 * Add experience to party
 */
export function addExperience(state: GameState, amount: number): GameState {
  const party = state.party.map((member) => {
    let newExp = member.stats.experience + amount
    let newLevel = member.stats.level
    let expToNext = member.stats.experienceToNextLevel

    // Track stat bonuses from level ups (don't mutate original)
    let bonusMaxHp = 0
    let bonusMaxMp = 0
    let bonusAttack = 0
    let bonusDefense = 0
    let bonusSpeed = 0

    // Check for level up
    while (newExp >= expToNext && newLevel < 99) {
      newExp -= expToNext
      newLevel++
      // Increase exp requirement for next level
      expToNext = Math.floor(expToNext * 1.5)

      // Accumulate level up stat bonuses
      bonusMaxHp += 5
      bonusMaxMp += 3
      bonusAttack += 2
      bonusDefense += 1
      bonusSpeed += 1
    }

    const newMaxHp = member.stats.maxHp + bonusMaxHp
    const newMaxMp = member.stats.maxMp + bonusMaxMp

    return {
      ...member,
      stats: {
        ...member.stats,
        maxHp: newMaxHp,
        maxMp: newMaxMp,
        attack: member.stats.attack + bonusAttack,
        defense: member.stats.defense + bonusDefense,
        speed: member.stats.speed + bonusSpeed,
        experience: newExp,
        experienceToNextLevel: expToNext,
        level: newLevel,
        currentHp: newMaxHp, // Heal on level up
        currentMp: newMaxMp,
      },
    }
  })

  return { ...state, party }
}

/**
 * Add gold to inventory
 */
export function addGold(state: GameState, amount: number): GameState {
  return { ...state, gold: state.gold + amount }
}

/**
 * Set a story flag
 */
export function setFlag(state: GameState, flag: string, value: boolean = true): GameState {
  return {
    ...state,
    flags: {
      ...state.flags,
      [flag]: value,
    },
  }
}

/**
 * Check a story flag
 */
export function hasFlag(state: GameState, flag: string): boolean {
  return state.flags[flag] === true
}

/**
 * Update play time (call every second)
 */
export function updatePlayTime(state: GameState): GameState {
  return { ...state, playTime: state.playTime + 1 }
}

/**
 * Restore party to full health (save points, rest)
 */
export function restoreParty(state: GameState): GameState {
  const party = state.party.map((member) => ({
    ...member,
    stats: {
      ...member.stats,
      currentHp: member.stats.maxHp,
      currentMp: member.stats.maxMp,
    },
  }))

  return { ...state, party }
}

/**
 * Learn a skill for a party member
 */
export function learnSkill(
  state: GameState,
  characterId: string,
  skillId: string
): GameState {
  const party = state.party.map((member) => {
    if (member.id !== characterId) return member

    // Find the skill in the skill tree
    const skillNode = member.skillTree.find((node) => node.skill.id === skillId)
    if (!skillNode) return member

    // Check if already unlocked
    if (member.unlockedSkillIds.includes(skillId)) return member

    // Check level requirement
    if (member.stats.level < skillNode.levelRequired) return member

    // Check prerequisites
    const hasPrereqs = skillNode.prerequisiteSkillIds.every((id) =>
      member.unlockedSkillIds.includes(id)
    )
    if (!hasPrereqs) return member

    // Learn the skill
    return {
      ...member,
      skills: [...member.skills, skillNode.skill],
      unlockedSkillIds: [...member.unlockedSkillIds, skillId],
    }
  })

  return { ...state, party }
}
