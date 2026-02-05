// ============================================
// Tile Definitions
// ============================================
// Tile types and colors for the isometric dungeon

import { Tile, TileType } from '../types'

// Tile color palettes (Tactics Ogre-inspired dark cave theme)
export const TILE_COLORS: Record<
  TileType,
  { top: string; left: string; right: string; highlight?: string }
> = {
  floor: {
    top: '#4a4a5a',
    left: '#3a3a4a',
    right: '#2a2a3a',
  },
  wall: {
    top: '#5a5a6a',
    left: '#4a4a5a',
    right: '#3a3a4a',
  },
  water: {
    top: '#2a4a6a',
    left: '#1a3a5a',
    right: '#0a2a4a',
    highlight: '#3a6a8a',
  },
  lava: {
    top: '#cc4a1a',
    left: '#993a10',
    right: '#662a08',
    highlight: '#dd6a2a',
  },
  pit: {
    top: '#1a1a2a',
    left: '#0a0a1a',
    right: '#000000',
  },
  door: {
    top: '#6a5a4a',
    left: '#5a4a3a',
    right: '#4a3a2a',
  },
  chest: {
    top: '#8a6a3a',
    left: '#7a5a2a',
    right: '#6a4a1a',
    highlight: '#aa8a5a',
  },
  switch: {
    top: '#6a6a7a',
    left: '#5a5a6a',
    right: '#4a4a5a',
    highlight: '#8a8a9a',
  },
  stairs_up: {
    top: '#5a5a6a',
    left: '#4a4a5a',
    right: '#3a3a4a',
  },
  stairs_down: {
    top: '#3a3a4a',
    left: '#2a2a3a',
    right: '#1a1a2a',
  },
  healing_pool: {
    top: '#4a8a6a',
    left: '#3a7a5a',
    right: '#2a6a4a',
    highlight: '#6aaa8a',
  },
}

// Tile definitions with properties
export const TILES: Record<TileType, Tile> = {
  floor: {
    type: 'floor',
    walkable: true,
    sprite: 'tile_floor',
    interactable: false,
  },
  wall: {
    type: 'wall',
    walkable: false,
    sprite: 'tile_wall',
    interactable: false,
  },
  water: {
    type: 'water',
    walkable: false,
    sprite: 'tile_water',
    interactable: false,
  },
  lava: {
    type: 'lava',
    walkable: false, // Damages if walked on (future feature)
    sprite: 'tile_lava',
    interactable: false,
  },
  pit: {
    type: 'pit',
    walkable: false,
    sprite: 'tile_pit',
    interactable: false,
  },
  door: {
    type: 'door',
    walkable: true, // When unlocked
    sprite: 'tile_door',
    interactable: true,
    metadata: { locked: false },
  },
  chest: {
    type: 'chest',
    walkable: false,
    sprite: 'tile_chest',
    interactable: true,
    metadata: { opened: false, contents: [] },
  },
  switch: {
    type: 'switch',
    walkable: true,
    sprite: 'tile_switch',
    interactable: true,
    metadata: { activated: false, targetId: '' },
  },
  stairs_up: {
    type: 'stairs_up',
    walkable: true,
    sprite: 'tile_stairs_up',
    interactable: true,
    metadata: { targetFloor: '', targetPosition: { col: 0, row: 0 } },
  },
  stairs_down: {
    type: 'stairs_down',
    walkable: true,
    sprite: 'tile_stairs_down',
    interactable: true,
    metadata: { targetFloor: '', targetPosition: { col: 0, row: 0 } },
  },
  healing_pool: {
    type: 'healing_pool',
    walkable: true,
    sprite: 'tile_healing_pool',
    interactable: true,
  },
}

/**
 * Get tile properties by type
 */
export function getTile(type: TileType): Tile {
  return TILES[type]
}

/**
 * Check if a tile type is walkable
 */
export function isWalkable(type: TileType): boolean {
  return TILES[type].walkable
}

/**
 * Check if a tile type is interactable
 */
export function isInteractable(type: TileType): boolean {
  return TILES[type].interactable
}

/**
 * Get tile colors for rendering
 */
export function getTileColors(type: TileType) {
  return TILE_COLORS[type]
}

// Wall height for rendering 3D effect
export const WALL_HEIGHT = 24

// Special tile rendering heights
export const TILE_HEIGHTS: Partial<Record<TileType, number>> = {
  wall: WALL_HEIGHT,
  chest: 12,
}

/**
 * Get the height of a tile for 3D rendering
 */
export function getTileHeight(type: TileType): number {
  return TILE_HEIGHTS[type] || 0
}
