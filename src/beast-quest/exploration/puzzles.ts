// ============================================
// Puzzle System
// ============================================
// Environmental puzzles using character abilities

import { IsoPosition, MapEntity, ExplorationState } from '../types'

// Puzzle types
export type PuzzleType = 'switch' | 'push_block' | 'shoot_target' | 'strength_door'

export interface Puzzle {
  id: string
  type: PuzzleType
  entities: string[] // Entity IDs involved
  targetId: string // What gets activated/opened
  solved: boolean
  requiredState: Record<string, boolean> // Required entity states
}

// Puzzle definitions for all dungeons
export const DUNGEON_PUZZLES: Record<string, Puzzle> = {
  // Ferno's dungeon
  puzzle_room_bridge: {
    id: 'puzzle_room_bridge',
    type: 'switch',
    entities: ['puzzle_block_1', 'puzzle_block_2'],
    targetId: 'puzzle_bridge',
    solved: false,
    requiredState: {
      puzzle_block_1: true,
      puzzle_block_2: true,
    },
  },

  // Sepron's dungeon
  tidal_locks: {
    id: 'tidal_locks',
    type: 'switch',
    entities: ['tidal_switch_1', 'tidal_switch_2', 'tidal_switch_3'],
    targetId: 'tidal_gate',
    solved: false,
    requiredState: {
      tidal_switch_1: true,
      tidal_switch_2: true,
      tidal_switch_3: true,
    },
  },
}

/**
 * Check if a puzzle is solved based on current state
 */
export function checkPuzzleSolved(
  puzzle: Puzzle,
  activatedSwitches: string[]
): boolean {
  return puzzle.entities.every((entityId) => {
    const requiredState = puzzle.requiredState[entityId]
    const currentState = activatedSwitches.includes(entityId)
    return requiredState === currentState
  })
}

/**
 * Toggle a switch entity
 */
export function toggleSwitch(
  switchId: string,
  activatedSwitches: string[]
): string[] {
  if (activatedSwitches.includes(switchId)) {
    return activatedSwitches.filter((id) => id !== switchId)
  }
  return [...activatedSwitches, switchId]
}

/**
 * Get puzzle by target ID
 */
export function getPuzzleByTarget(targetId: string): Puzzle | undefined {
  return Object.values(DUNGEON_PUZZLES).find((p) => p.targetId === targetId)
}

/**
 * Get puzzle affecting an entity
 */
export function getPuzzleForEntity(entityId: string): Puzzle | undefined {
  return Object.values(DUNGEON_PUZZLES).find((p) => p.entities.includes(entityId))
}

/**
 * Check if player can interact with an entity
 */
export function canInteract(
  entity: MapEntity,
  playerPosition: IsoPosition,
  explorationState: ExplorationState
): boolean {
  // Check if adjacent to entity
  const dx = Math.abs(entity.position.col - playerPosition.col)
  const dy = Math.abs(entity.position.row - playerPosition.row)
  const isAdjacent = dx + dy === 1

  if (!isAdjacent || !entity.interactable) return false

  // Check specific entity types
  switch (entity.type) {
    case 'chest':
      return !explorationState.openedChests.includes(entity.id)

    case 'switch':
      return true

    case 'npc':
      return true

    case 'enemy':
      return true

    default:
      return false
  }
}

/**
 * Handle interaction with a chest
 */
export function openChest(
  chestId: string,
  openedChests: string[]
): { openedChests: string[]; loot: string[] } {
  if (openedChests.includes(chestId)) {
    return { openedChests, loot: [] }
  }

  // Get chest contents from dungeon data (simplified)
  const loot = getChestContents(chestId)

  return {
    openedChests: [...openedChests, chestId],
    loot,
  }
}

/**
 * Get chest contents by ID
 */
function getChestContents(chestId: string): string[] {
  const contents: Record<string, string[]> = {
    // Ferno's dungeon
    'main_cavern_chest_1': ['potion', 'potion'],
    'main_cavern_chest_2': ['ether', 'antidote'],
    'volcanic_passage_chest': ['hi_potion', 'fire_amulet'],
    // Sepron's dungeon
    'tidal_cavern_chest_1': ['potion', 'potion', 'antidote'],
    'tidal_cavern_chest_2': ['ether', 'ice_shard'],
    'coral_tunnel_chest': ['hi_potion', 'tidal_pendant'],
  }

  return contents[chestId] || ['potion']
}

/**
 * Check if a door is blocked by an unsolved puzzle
 */
export function isDoorBlocked(
  doorId: string,
  activatedSwitches: string[]
): boolean {
  const puzzle = getPuzzleByTarget(doorId)
  if (!puzzle) return false

  return !checkPuzzleSolved(puzzle, activatedSwitches)
}

/**
 * Get hint text for a puzzle
 */
export function getPuzzleHint(puzzleId: string): string {
  const hints: Record<string, string> = {
    puzzle_room_bridge:
      'Two ancient switches must be activated to lower the bridge.',
    tidal_locks:
      'Three ancient tidal locks must be opened to drain the passage.',
  }

  return hints[puzzleId] || 'An ancient mechanism blocks the way.'
}

/**
 * Environmental puzzle: Push block logic
 * (Tom's ability - for future implementation)
 */
export function canPushBlock(
  blockPosition: IsoPosition,
  pushDirection: 'north' | 'south' | 'east' | 'west',
  tiles: string[][],
  entities: MapEntity[]
): boolean {
  // Calculate target position
  const targetPos = getPositionInDirection(blockPosition, pushDirection)

  // Check if target is within bounds
  if (
    targetPos.col < 0 ||
    targetPos.row < 0 ||
    targetPos.row >= tiles.length ||
    targetPos.col >= tiles[0].length
  ) {
    return false
  }

  // Check if target tile is walkable
  const targetTile = tiles[targetPos.row][targetPos.col]
  if (targetTile === 'wall' || targetTile === 'water' || targetTile === 'lava') {
    return false
  }

  // Check if target has another entity
  const hasEntity = entities.some(
    (e) => e.position.col === targetPos.col && e.position.row === targetPos.row
  )

  return !hasEntity
}

/**
 * Environmental puzzle: Shoot target logic
 * (Elenna's ability - for future implementation)
 */
export function canShootTarget(
  archerPosition: IsoPosition,
  targetPosition: IsoPosition,
  archerDirection: 'north' | 'south' | 'east' | 'west',
  tiles: string[][]
): boolean {
  // Check if target is in a straight line from archer
  const dx = targetPosition.col - archerPosition.col
  const dy = targetPosition.row - archerPosition.row

  // Must be in a cardinal direction
  if (dx !== 0 && dy !== 0) return false

  // Check direction matches
  if (dx > 0 && archerDirection !== 'east') return false
  if (dx < 0 && archerDirection !== 'west') return false
  if (dy > 0 && archerDirection !== 'south') return false
  if (dy < 0 && archerDirection !== 'north') return false

  // Check for obstacles in path
  const stepX = dx === 0 ? 0 : dx > 0 ? 1 : -1
  const stepY = dy === 0 ? 0 : dy > 0 ? 1 : -1

  let checkPos = { ...archerPosition }
  while (checkPos.col !== targetPosition.col || checkPos.row !== targetPosition.row) {
    checkPos = {
      col: checkPos.col + stepX,
      row: checkPos.row + stepY,
    }

    const tile = tiles[checkPos.row]?.[checkPos.col]
    if (tile === 'wall') return false
  }

  return true
}

/**
 * Helper: Get position in a direction
 */
function getPositionInDirection(
  pos: IsoPosition,
  direction: 'north' | 'south' | 'east' | 'west'
): IsoPosition {
  switch (direction) {
    case 'north':
      return { col: pos.col, row: pos.row - 1 }
    case 'south':
      return { col: pos.col, row: pos.row + 1 }
    case 'east':
      return { col: pos.col + 1, row: pos.row }
    case 'west':
      return { col: pos.col - 1, row: pos.row }
  }
}
