import { Player, PlayerColor, Treasure, PathSpace } from './types'

// Player color configuration
export const PLAYER_COLORS: Record<
  PlayerColor,
  { primary: string; secondary: string; name: string }
> = {
  blue: { primary: '#3498db', secondary: '#2980b9', name: 'Blue' },
  green: { primary: '#2ecc71', secondary: '#27ae60', name: 'Green' },
  yellow: { primary: '#f1c40f', secondary: '#d4ac0d', name: 'Yellow' },
  orange: { primary: '#e67e22', secondary: '#d35400', name: 'Orange' },
  purple: { primary: '#9b59b6', secondary: '#8e44ad', name: 'Purple' },
}

const COLOR_ORDER: PlayerColor[] = ['blue', 'green', 'yellow', 'orange', 'purple']

// Create a new player
export function createPlayer(id: number): Player {
  return {
    id,
    color: COLOR_ORDER[id],
    position: -1, // In submarine
    direction: 'down',
    heldTreasures: [],
    scoredTreasures: [],
    isInSubmarine: true,
    drownedThisRound: false,
    hasReturnedToSubmarine: false,
  }
}

// Create multiple players
export function createPlayers(count: number): Player[] {
  return Array.from({ length: count }, (_, i) => createPlayer(i))
}

// Reset player for new round (keep scored treasures)
export function resetPlayerForNewRound(player: Player): Player {
  return {
    ...player,
    position: -1,
    direction: 'down',
    heldTreasures: [],
    isInSubmarine: true,
    drownedThisRound: false,
    hasReturnedToSubmarine: false,
  }
}

// Turn player around (can only do if heading down)
export function turnAround(player: Player): Player {
  if (player.direction === 'down' && !player.isInSubmarine) {
    return { ...player, direction: 'up' }
  }
  return player
}

// Move player along the path
export function movePlayer(
  player: Player,
  spaces: number,
  pathLength: number
): Player {
  if (player.isInSubmarine && spaces === 0) {
    return player
  }

  let newPosition: number

  if (player.isInSubmarine) {
    // Starting from submarine, move onto the path
    newPosition = spaces - 1 // Position 0 is first space
  } else if (player.direction === 'down') {
    // Moving down the path (away from submarine)
    newPosition = player.position + spaces
  } else {
    // Moving up the path (toward submarine)
    newPosition = player.position - spaces
  }

  // Check if returned to submarine
  if (newPosition < 0) {
    return {
      ...player,
      position: -1,
      isInSubmarine: true,
      // Score held treasures
      scoredTreasures: [...player.scoredTreasures, ...player.heldTreasures],
      heldTreasures: [],
    }
  }

  // Clamp to path bounds
  newPosition = Math.min(newPosition, pathLength - 1)

  return {
    ...player,
    position: newPosition,
    isInSubmarine: false,
  }
}

// Skip over occupied spaces when moving
export function calculateFinalPosition(
  startPosition: number,
  direction: 'down' | 'up',
  spaces: number,
  path: PathSpace[],
  otherPlayerPositions: number[]
): number {
  let remaining = spaces
  let current = startPosition

  while (remaining > 0) {
    if (direction === 'down') {
      current++
    } else {
      current--
    }

    // Check if returned to submarine
    if (current < 0) {
      return -1 // Submarine
    }

    // Check if past end of path
    if (current >= path.length) {
      return path.length - 1 // Stay at end
    }

    // Skip removed spaces and occupied spaces
    const space = path[current]
    const isOccupied = otherPlayerPositions.includes(current)

    if (space.type !== 'removed' && !isOccupied) {
      remaining--
    }
  }

  return current
}

// Pick up a treasure from current position
export function pickUpTreasure(player: Player, treasure: Treasure): Player {
  return {
    ...player,
    heldTreasures: [...player.heldTreasures, treasure],
  }
}

// Drop a treasure at current position
export function dropTreasure(
  player: Player,
  treasureIndex: number
): { player: Player; droppedTreasure: Treasure } | null {
  if (treasureIndex < 0 || treasureIndex >= player.heldTreasures.length) {
    return null
  }

  const droppedTreasure = player.heldTreasures[treasureIndex]
  const newHeldTreasures = [
    ...player.heldTreasures.slice(0, treasureIndex),
    ...player.heldTreasures.slice(treasureIndex + 1),
  ]

  return {
    player: { ...player, heldTreasures: newHeldTreasures },
    droppedTreasure,
  }
}

// Calculate oxygen loss for this player
export function calculateOxygenLoss(player: Player): number {
  return player.heldTreasures.length
}

// Calculate total score for a player
export function calculateScore(player: Player): number {
  return player.scoredTreasures.reduce((sum, t) => sum + t.points, 0)
}

// Handle player drowning (oxygen ran out while not in submarine)
export function drownPlayer(player: Player): { player: Player; droppedTreasures: Treasure[] } {
  return {
    player: {
      ...player,
      drownedThisRound: true,
      heldTreasures: [],
    },
    droppedTreasures: player.heldTreasures,
  }
}

// Check if player can turn around (heading down and not in submarine)
export function canTurnAround(player: Player): boolean {
  return player.direction === 'down' && !player.isInSubmarine
}

// Check if player is still active in the round
// A player is active if they haven't drowned and haven't returned to the submarine
export function isPlayerActive(player: Player): boolean {
  return !player.drownedThisRound && !player.hasReturnedToSubmarine
}
