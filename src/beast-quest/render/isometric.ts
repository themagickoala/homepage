// ============================================
// Isometric Projection Utilities
// ============================================
// Standard 2:1 ratio isometric projection
// Used for Tactics Ogre-style grid-based rendering

import { Vector2D, IsoPosition } from '../types'

// Canvas dimensions
export const CANVAS_WIDTH = 800
export const CANVAS_HEIGHT = 600

// Tile dimensions in screen space
export const TILE_WIDTH = 64 // Width of diamond
export const TILE_HEIGHT = 32 // Height of diamond (half of width for 2:1 ratio)

// Vertical offset for sprites standing on tiles
export const SPRITE_FLOOR_OFFSET = TILE_HEIGHT / 2

// Origin point for the isometric grid (where 0,0 tile is rendered)
// Centered horizontally, offset from top
export const GRID_ORIGIN: Vector2D = {
  x: CANVAS_WIDTH / 2,
  y: 100,
}

/**
 * Convert isometric grid coordinates to screen coordinates
 * The screen coordinates point to the CENTER of the tile diamond
 */
export function isoToScreen(iso: IsoPosition): Vector2D {
  return {
    x: GRID_ORIGIN.x + (iso.col - iso.row) * (TILE_WIDTH / 2),
    y: GRID_ORIGIN.y + (iso.col + iso.row) * (TILE_HEIGHT / 2),
  }
}

/**
 * Convert screen coordinates to isometric grid coordinates
 * Useful for mouse/click detection
 */
export function screenToIso(screen: Vector2D): IsoPosition {
  // Translate to grid origin
  const relX = screen.x - GRID_ORIGIN.x
  const relY = screen.y - GRID_ORIGIN.y

  // Inverse of the isometric transformation
  const col = (relX / (TILE_WIDTH / 2) + relY / (TILE_HEIGHT / 2)) / 2
  const row = (relY / (TILE_HEIGHT / 2) - relX / (TILE_WIDTH / 2)) / 2

  return {
    col: Math.floor(col),
    row: Math.floor(row),
  }
}

/**
 * Check if a screen position is within the diamond shape of a tile
 */
export function isPointInTile(screen: Vector2D, tileIso: IsoPosition): boolean {
  const tileCenter = isoToScreen(tileIso)

  // Calculate distance from tile center in isometric terms
  const dx = Math.abs(screen.x - tileCenter.x)
  const dy = Math.abs(screen.y - tileCenter.y)

  // Point is inside diamond if it satisfies the diamond equation
  // |x|/halfWidth + |y|/halfHeight <= 1
  return dx / (TILE_WIDTH / 2) + dy / (TILE_HEIGHT / 2) <= 1
}

/**
 * Get the four corner vertices of an isometric tile
 * Useful for drawing tile outlines
 */
export function getTileVertices(iso: IsoPosition): Vector2D[] {
  const center = isoToScreen(iso)
  return [
    { x: center.x, y: center.y - TILE_HEIGHT / 2 }, // Top
    { x: center.x + TILE_WIDTH / 2, y: center.y }, // Right
    { x: center.x, y: center.y + TILE_HEIGHT / 2 }, // Bottom
    { x: center.x - TILE_WIDTH / 2, y: center.y }, // Left
  ]
}

/**
 * Draw an isometric tile (diamond shape)
 */
export function drawIsometricTile(
  ctx: CanvasRenderingContext2D,
  iso: IsoPosition,
  fillColor: string,
  strokeColor?: string
): void {
  const vertices = getTileVertices(iso)

  ctx.beginPath()
  ctx.moveTo(vertices[0].x, vertices[0].y)
  for (let i = 1; i < vertices.length; i++) {
    ctx.lineTo(vertices[i].x, vertices[i].y)
  }
  ctx.closePath()

  ctx.fillStyle = fillColor
  ctx.fill()

  if (strokeColor) {
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = 1
    ctx.stroke()
  }
}

/**
 * Draw an isometric cube (tile with height)
 * Used for walls and raised terrain
 */
export function drawIsometricCube(
  ctx: CanvasRenderingContext2D,
  iso: IsoPosition,
  height: number,
  topColor: string,
  leftColor: string,
  rightColor: string
): void {
  const center = isoToScreen(iso)
  const halfW = TILE_WIDTH / 2
  const halfH = TILE_HEIGHT / 2

  // Top face (raised by height)
  const topVertices = [
    { x: center.x, y: center.y - halfH - height },
    { x: center.x + halfW, y: center.y - height },
    { x: center.x, y: center.y + halfH - height },
    { x: center.x - halfW, y: center.y - height },
  ]

  // Left face
  ctx.beginPath()
  ctx.moveTo(center.x - halfW, center.y - height)
  ctx.lineTo(center.x, center.y + halfH - height)
  ctx.lineTo(center.x, center.y + halfH)
  ctx.lineTo(center.x - halfW, center.y)
  ctx.closePath()
  ctx.fillStyle = leftColor
  ctx.fill()

  // Right face
  ctx.beginPath()
  ctx.moveTo(center.x + halfW, center.y - height)
  ctx.lineTo(center.x, center.y + halfH - height)
  ctx.lineTo(center.x, center.y + halfH)
  ctx.lineTo(center.x + halfW, center.y)
  ctx.closePath()
  ctx.fillStyle = rightColor
  ctx.fill()

  // Top face
  ctx.beginPath()
  ctx.moveTo(topVertices[0].x, topVertices[0].y)
  for (let i = 1; i < topVertices.length; i++) {
    ctx.lineTo(topVertices[i].x, topVertices[i].y)
  }
  ctx.closePath()
  ctx.fillStyle = topColor
  ctx.fill()
}

/**
 * Calculate render order for isometric tiles
 * Tiles further back (higher row + col sum) should render first
 */
export function calculateRenderOrder(positions: IsoPosition[]): IsoPosition[] {
  return [...positions].sort((a, b) => {
    // Sort by sum of row and col (depth)
    const depthA = a.row + a.col
    const depthB = b.row + b.col
    if (depthA !== depthB) return depthA - depthB

    // If same depth, sort by row (left to right)
    return a.row - b.row
  })
}

/**
 * Get all visible tiles within a rectangular area
 */
export function getVisibleTiles(
  mapWidth: number,
  mapHeight: number,
  cameraOffset: Vector2D = { x: 0, y: 0 }
): IsoPosition[] {
  const tiles: IsoPosition[] = []

  // Calculate visible range based on canvas and camera
  // Add padding to ensure tiles at edges are visible
  const padding = 2

  for (let row = -padding; row < mapHeight + padding; row++) {
    for (let col = -padding; col < mapWidth + padding; col++) {
      const screenPos = isoToScreen({ col, row })
      screenPos.x += cameraOffset.x
      screenPos.y += cameraOffset.y

      // Check if tile is potentially visible on screen
      if (
        screenPos.x >= -TILE_WIDTH &&
        screenPos.x <= CANVAS_WIDTH + TILE_WIDTH &&
        screenPos.y >= -TILE_HEIGHT * 2 &&
        screenPos.y <= CANVAS_HEIGHT + TILE_HEIGHT
      ) {
        if (col >= 0 && col < mapWidth && row >= 0 && row < mapHeight) {
          tiles.push({ col, row })
        }
      }
    }
  }

  return calculateRenderOrder(tiles)
}

/**
 * Calculate distance between two isometric positions
 */
export function isoDistance(a: IsoPosition, b: IsoPosition): number {
  // Manhattan distance in isometric grid
  return Math.abs(a.col - b.col) + Math.abs(a.row - b.row)
}

/**
 * Get neighboring positions in the four cardinal directions
 */
export function getNeighbors(pos: IsoPosition): Record<string, IsoPosition> {
  return {
    north: { col: pos.col, row: pos.row - 1 },
    south: { col: pos.col, row: pos.row + 1 },
    east: { col: pos.col + 1, row: pos.row },
    west: { col: pos.col - 1, row: pos.row },
  }
}

/**
 * Lerp between two isometric positions (for smooth movement)
 */
export function lerpIsoPosition(
  from: IsoPosition,
  to: IsoPosition,
  t: number
): { col: number; row: number } {
  return {
    col: from.col + (to.col - from.col) * t,
    row: from.row + (to.row - from.row) * t,
  }
}

/**
 * Convert lerped position to screen coords (allows fractional positions)
 */
export function lerpedIsoToScreen(pos: { col: number; row: number }): Vector2D {
  return {
    x: GRID_ORIGIN.x + (pos.col - pos.row) * (TILE_WIDTH / 2),
    y: GRID_ORIGIN.y + (pos.col + pos.row) * (TILE_HEIGHT / 2),
  }
}
