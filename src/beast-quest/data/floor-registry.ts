// ============================================
// Floor Registry
// ============================================
// Central registry for all dungeon/village floors

import { DungeonFloor, DungeonRoom, EncounterZone } from '../types'

const FLOORS: Record<string, DungeonFloor> = {}

/**
 * Register a floor (dungeon, village, etc.) so it can be looked up by ID.
 */
export function registerFloor(floor: DungeonFloor): void {
  FLOORS[floor.id] = floor
}

/**
 * Get a floor by its ID.
 */
export function getFloor(floorId: string): DungeonFloor | undefined {
  return FLOORS[floorId]
}

/**
 * Get a room from any registered floor.
 */
export function getRoomFromFloor(floorId: string, roomId: string): DungeonRoom | undefined {
  return FLOORS[floorId]?.rooms.find((r) => r.id === roomId)
}

/**
 * Get a room by ID, searching all registered floors.
 */
export function getRoomGlobal(roomId: string): DungeonRoom | undefined {
  for (const floor of Object.values(FLOORS)) {
    const room = floor.rooms.find((r) => r.id === roomId)
    if (room) return room
  }
  return undefined
}

/**
 * Check if position is within an encounter zone.
 */
export function getEncounterZone(
  room: DungeonRoom,
  position: { col: number; row: number }
): EncounterZone | null {
  for (const zone of room.encounters) {
    if (
      position.col >= zone.bounds.minCol &&
      position.col <= zone.bounds.maxCol &&
      position.row >= zone.bounds.minRow &&
      position.row <= zone.bounds.maxRow
    ) {
      return zone
    }
  }
  return null
}
