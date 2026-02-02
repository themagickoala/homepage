import {
  GameState,
  Player,
  PathSpace,
  PathNode,
  DiceRoll,
  BubbleParticle,
  Treasure,
  TreasureLevel,
} from './types'
import { TREASURE_CONFIG } from './treasure'
import { PLAYER_COLORS } from './player'

// Canvas dimensions
export const CANVAS_WIDTH = 1000
export const CANVAS_HEIGHT = 700

// Layout constants
const SUBMARINE_Y = 60
const PATH_START_Y = 140
const PATH_ROW_HEIGHT = 130
const PATH_MARGIN_X = 80
const SPACE_SIZE = 40

// Generate path node positions for rendering with smooth curves
export function generatePathNodes(pathLength: number): PathNode[] {
  const nodes: PathNode[] = []
  const spacesPerRow = 8
  const spaceWidth = (CANVAS_WIDTH - 2 * PATH_MARGIN_X) / (spacesPerRow - 1)
  const waveAmplitude = 25 // How much the path curves up/down within a row
  const turnCurveOffset = 40 // Extra Y offset at turns to smooth the corners

  for (let i = 0; i < pathLength; i++) {
    const row = Math.floor(i / spacesPerRow)
    const col = i % spacesPerRow
    const isReversed = row % 2 === 1

    const adjustedCol = isReversed ? spacesPerRow - 1 - col : col

    // Calculate progress along the row (0 to 1)
    const rowProgress = col / (spacesPerRow - 1)

    // Create a sine wave offset for smooth curvature within each row
    // The wave dips in the middle of each row
    const waveOffset = Math.sin(rowProgress * Math.PI) * waveAmplitude

    // Add extra curve at the start/end of rows to smooth the turns
    let turnOffset = 0
    if (col === 0 && row > 0) {
      // First node of a row (except first row) - coming from a turn
      turnOffset = turnCurveOffset * 0.5
    } else if (col === spacesPerRow - 1 && row < Math.floor((pathLength - 1) / spacesPerRow)) {
      // Last node of a row (except last row) - about to turn
      turnOffset = turnCurveOffset * 0.5
    } else if (col === 1 || col === spacesPerRow - 2) {
      // Second or second-to-last nodes - partial curve
      turnOffset = turnCurveOffset * 0.2
    }

    nodes.push({
      index: i,
      x: PATH_MARGIN_X + adjustedCol * spaceWidth,
      y: PATH_START_Y + row * PATH_ROW_HEIGHT + waveOffset + turnOffset,
    })
  }

  return nodes
}

// Visual position with optional hop offset
export interface VisualPosition {
  position: number
  hopOffset: number // Vertical offset for hop animation (negative = up)
}

// Main render function
export function render(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  pathNodes: PathNode[],
  bubbles: BubbleParticle[],
  visualPositions?: Map<number, VisualPosition> // Optional animated positions (playerId -> visual position + hop)
): void {
  // Clear canvas
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  // Render layers in order
  renderBackground(ctx)
  renderBubbles(ctx, bubbles)
  renderSubmarine(ctx)
  renderPath(ctx, state.round.path, pathNodes)
  renderPlayers(ctx, state.players, pathNodes, visualPositions)
  renderOxygenMeter(ctx, state.round.oxygen)
  renderRoundIndicator(ctx, state.round.roundNumber)

  if (state.lastDiceRoll && state.turnPhase !== 'pre_roll') {
    renderDice(ctx, state.lastDiceRoll)
  }
}

// Render underwater background
function renderBackground(ctx: CanvasRenderingContext2D): void {
  // Gradient from light to dark blue (deeper water)
  const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT)
  gradient.addColorStop(0, '#1a4a6e')
  gradient.addColorStop(0.3, '#0d3a5c')
  gradient.addColorStop(1, '#051525')

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  // Add some underwater light rays
  ctx.save()
  ctx.globalAlpha = 0.05
  for (let i = 0; i < 5; i++) {
    const x = 100 + i * 200
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x - 50, CANVAS_HEIGHT)
    ctx.lineTo(x + 50, CANVAS_HEIGHT)
    ctx.closePath()
    ctx.fillStyle = '#87CEEB'
    ctx.fill()
  }
  ctx.restore()
}

// Render submarine at top
function renderSubmarine(ctx: CanvasRenderingContext2D): void {
  const x = CANVAS_WIDTH / 2
  const y = SUBMARINE_Y

  ctx.save()
  ctx.translate(x, y)

  // Submarine body
  ctx.fillStyle = '#FFD700'
  ctx.beginPath()
  ctx.ellipse(0, 0, 60, 25, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#B8860B'
  ctx.lineWidth = 2
  ctx.stroke()

  // Conning tower
  ctx.fillStyle = '#FFD700'
  ctx.fillRect(-15, -35, 30, 15)
  ctx.strokeRect(-15, -35, 30, 15)

  // Periscope
  ctx.fillStyle = '#B8860B'
  ctx.fillRect(-3, -50, 6, 20)

  // Porthole
  ctx.fillStyle = '#87CEEB'
  ctx.beginPath()
  ctx.arc(0, 0, 10, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#B8860B'
  ctx.lineWidth = 2
  ctx.stroke()

  // Propeller
  ctx.fillStyle = '#B8860B'
  ctx.beginPath()
  ctx.ellipse(65, 0, 8, 15, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

// Render the treasure path
function renderPath(
  ctx: CanvasRenderingContext2D,
  path: PathSpace[],
  nodes: PathNode[]
): void {
  // Draw connecting lines between nodes
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
  ctx.lineWidth = 2
  ctx.setLineDash([5, 5])

  ctx.beginPath()
  for (let i = 0; i < nodes.length && i < path.length; i++) {
    if (path[i].type === 'removed') continue

    const node = nodes[i]
    if (i === 0) {
      ctx.moveTo(node.x, node.y)
    } else {
      ctx.lineTo(node.x, node.y)
    }
  }
  ctx.stroke()
  ctx.setLineDash([])

  // Draw each space
  for (let i = 0; i < path.length && i < nodes.length; i++) {
    const space = path[i]
    const node = nodes[i]

    if (space.type === 'removed') continue

    if (space.type === 'treasure') {
      renderTreasure(ctx, space.treasure, node.x, node.y)
    } else if (space.type === 'empty') {
      renderEmptySpace(ctx, node.x, node.y)
    }
  }
}

// Render a treasure token
function renderTreasure(
  ctx: CanvasRenderingContext2D,
  treasure: Treasure,
  x: number,
  y: number
): void {
  const config = TREASURE_CONFIG[treasure.level]
  const size = SPACE_SIZE / 2

  ctx.save()
  ctx.translate(x, y)

  // For mega-treasures, draw a stack of shapes
  if (treasure.isMegaTreasure && treasure.componentCount > 1) {
    const stackCount = Math.min(treasure.componentCount, 3) // Show up to 3 stacked
    const stackOffset = 4 // Pixels between each stacked shape

    // Draw from back to front (bottom to top of stack)
    for (let i = stackCount - 1; i >= 0; i--) {
      const offsetY = -i * stackOffset
      const offsetX = i * 2 // Slight horizontal offset for 3D effect

      ctx.save()
      ctx.translate(offsetX, offsetY)

      // Shadow for depth
      if (i > 0) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
        ctx.shadowBlur = 3
        ctx.shadowOffsetX = -2
        ctx.shadowOffsetY = 2
      }

      // Draw shape based on level
      ctx.fillStyle = config.color
      ctx.strokeStyle = '#FFFFFF'
      ctx.lineWidth = 2

      ctx.beginPath()
      switch (config.shape) {
        case 'triangle':
          drawTriangle(ctx, size)
          break
        case 'square':
          drawSquare(ctx, size)
          break
        case 'hexagon':
          drawHexagon(ctx, size)
          break
        case 'octagon':
          drawOctagon(ctx, size)
          break
      }
      ctx.fill()
      ctx.stroke()

      ctx.restore()
    }

    // Draw dots only on top treasure
    drawLevelDots(ctx, treasure.level, config.dotColor)

    // Gold glow for mega treasure
    ctx.shadowColor = '#FFD700'
    ctx.shadowBlur = 10
    ctx.strokeStyle = '#FFD700'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(0, 0, size + 5, 0, Math.PI * 2)
    ctx.stroke()
  } else {
    // Regular treasure - draw single shape
    ctx.fillStyle = config.color
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 2

    ctx.beginPath()
    switch (config.shape) {
      case 'triangle':
        drawTriangle(ctx, size)
        break
      case 'square':
        drawSquare(ctx, size)
        break
      case 'hexagon':
        drawHexagon(ctx, size)
        break
      case 'octagon':
        drawOctagon(ctx, size)
        break
    }
    ctx.fill()
    ctx.stroke()

    // Draw dots for level indicator
    drawLevelDots(ctx, treasure.level, config.dotColor)
  }

  ctx.restore()
}

// Draw triangle shape
function drawTriangle(ctx: CanvasRenderingContext2D, size: number): void {
  ctx.moveTo(0, -size)
  ctx.lineTo(size * 0.866, size * 0.5)
  ctx.lineTo(-size * 0.866, size * 0.5)
  ctx.closePath()
}

// Draw square shape
function drawSquare(ctx: CanvasRenderingContext2D, size: number): void {
  ctx.rect(-size * 0.7, -size * 0.7, size * 1.4, size * 1.4)
}

// Draw hexagon shape
function drawHexagon(ctx: CanvasRenderingContext2D, size: number): void {
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6
    const px = Math.cos(angle) * size
    const py = Math.sin(angle) * size
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
}

// Draw octagon shape
function drawOctagon(ctx: CanvasRenderingContext2D, size: number): void {
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI / 4) * i - Math.PI / 8
    const px = Math.cos(angle) * size
    const py = Math.sin(angle) * size
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
}

// Draw dots indicating treasure level
function drawLevelDots(
  ctx: CanvasRenderingContext2D,
  level: TreasureLevel,
  color: string
): void {
  ctx.fillStyle = color
  const dotSize = 3
  const spacing = 8

  const positions: Array<[number, number]> = []
  switch (level) {
    case 1:
      positions.push([0, 0])
      break
    case 2:
      positions.push([-spacing / 2, 0], [spacing / 2, 0])
      break
    case 3:
      positions.push([0, -spacing / 2], [-spacing / 2, spacing / 2], [spacing / 2, spacing / 2])
      break
    case 4:
      positions.push(
        [-spacing / 2, -spacing / 2],
        [spacing / 2, -spacing / 2],
        [-spacing / 2, spacing / 2],
        [spacing / 2, spacing / 2]
      )
      break
  }

  for (const [px, py] of positions) {
    ctx.beginPath()
    ctx.arc(px, py, dotSize, 0, Math.PI * 2)
    ctx.fill()
  }
}

// Render empty space (where treasure was taken)
function renderEmptySpace(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const size = SPACE_SIZE / 2

  ctx.save()
  ctx.translate(x, y)

  // Circle with X
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
  ctx.lineWidth = 2

  ctx.beginPath()
  ctx.arc(0, 0, size * 0.7, 0, Math.PI * 2)
  ctx.stroke()

  // X mark
  const xSize = size * 0.4
  ctx.beginPath()
  ctx.moveTo(-xSize, -xSize)
  ctx.lineTo(xSize, xSize)
  ctx.moveTo(xSize, -xSize)
  ctx.lineTo(-xSize, xSize)
  ctx.stroke()

  ctx.restore()
}

// Helper to get position coordinates
function getPositionCoords(
  position: number,
  pathNodes: PathNode[]
): { x: number; y: number } {
  if (position < 0) {
    // In submarine
    return { x: CANVAS_WIDTH / 2, y: SUBMARINE_Y + 30 }
  } else if (position < pathNodes.length) {
    return { x: pathNodes[position].x, y: pathNodes[position].y }
  } else {
    // Fallback to last node
    const lastNode = pathNodes[pathNodes.length - 1]
    return { x: lastNode.x, y: lastNode.y }
  }
}

// Interpolate between two positions (handles fractional positions)
function interpolatePosition(
  visualPos: number,
  pathNodes: PathNode[]
): { x: number; y: number } {
  if (visualPos < 0) {
    // Moving to/from submarine - interpolate with first node
    // visualPos goes from 0 to -1 (0 = at first node, -1 = at submarine)
    const progress = -visualPos // 0 to 1
    const subCoords = getPositionCoords(-1, pathNodes)
    const firstCoords = getPositionCoords(0, pathNodes)
    return {
      x: firstCoords.x + (subCoords.x - firstCoords.x) * progress,
      y: firstCoords.y + (subCoords.y - firstCoords.y) * progress,
    }
  }

  const floorPos = Math.floor(visualPos)
  const ceilPos = Math.ceil(visualPos)
  const fraction = visualPos - floorPos

  if (fraction === 0 || floorPos === ceilPos) {
    return getPositionCoords(floorPos, pathNodes)
  }

  const fromCoords = getPositionCoords(floorPos, pathNodes)
  const toCoords = getPositionCoords(ceilPos, pathNodes)

  return {
    x: fromCoords.x + (toCoords.x - fromCoords.x) * fraction,
    y: fromCoords.y + (toCoords.y - fromCoords.y) * fraction,
  }
}

// Render players/divers
function renderPlayers(
  ctx: CanvasRenderingContext2D,
  players: Player[],
  pathNodes: PathNode[],
  visualPositions?: Map<number, VisualPosition>
): void {
  // Render each player individually (for animation support)
  for (const player of players) {
    let x: number, y: number
    let hopOffset = 0

    // Check if this player has an animated visual position
    const visualPosData = visualPositions?.get(player.id)

    if (visualPosData !== undefined) {
      // Animated position - interpolate
      const coords = interpolatePosition(visualPosData.position, pathNodes)
      x = coords.x
      y = coords.y
      hopOffset = visualPosData.hopOffset
    } else {
      // Static position
      const coords = getPositionCoords(player.position, pathNodes)
      x = coords.x
      y = coords.y
    }

    renderDiver(ctx, player, x, y - 20 + hopOffset)
  }
}

// Render a single diver
function renderDiver(
  ctx: CanvasRenderingContext2D,
  player: Player,
  x: number,
  y: number
): void {
  const colors = PLAYER_COLORS[player.color]

  ctx.save()
  ctx.translate(x, y)

  // Helmet/head
  ctx.fillStyle = colors.primary
  ctx.beginPath()
  ctx.arc(0, -8, 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = colors.secondary
  ctx.lineWidth = 2
  ctx.stroke()

  // Face plate
  ctx.fillStyle = '#87CEEB'
  ctx.beginPath()
  ctx.arc(0, -8, 5, 0, Math.PI * 2)
  ctx.fill()

  // Body
  ctx.fillStyle = colors.primary
  ctx.fillRect(-6, 0, 12, 15)
  ctx.strokeStyle = colors.secondary
  ctx.strokeRect(-6, 0, 12, 15)

  // Direction indicator (arrow)
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  if (player.direction === 'down') {
    ctx.moveTo(0, 18)
    ctx.lineTo(-4, 14)
    ctx.lineTo(4, 14)
  } else {
    ctx.moveTo(0, -18)
    ctx.lineTo(-4, -14)
    ctx.lineTo(4, -14)
  }
  ctx.closePath()
  ctx.fill()

  // Treasure count indicator
  if (player.heldTreasures.length > 0) {
    ctx.fillStyle = '#FFD700'
    ctx.beginPath()
    ctx.arc(10, -5, 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#000'
    ctx.font = 'bold 10px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(player.heldTreasures.length.toString(), 10, -5)
  }

  ctx.restore()
}

// Render oxygen meter
function renderOxygenMeter(ctx: CanvasRenderingContext2D, oxygen: number): void {
  const x = 30
  const y = 100
  const width = 25
  const height = 200
  const maxOxygen = 25

  ctx.save()

  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
  ctx.fillRect(x - 5, y - 25, width + 10, height + 50)

  // Label
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 12px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('O2', x + width / 2, y - 10)

  // Meter background
  ctx.fillStyle = '#333'
  ctx.fillRect(x, y, width, height)

  // Meter fill
  const fillHeight = (oxygen / maxOxygen) * height
  const gradient = ctx.createLinearGradient(0, y + height - fillHeight, 0, y + height)

  if (oxygen > 15) {
    gradient.addColorStop(0, '#00FF00')
    gradient.addColorStop(1, '#008800')
  } else if (oxygen > 8) {
    gradient.addColorStop(0, '#FFFF00')
    gradient.addColorStop(1, '#888800')
  } else {
    gradient.addColorStop(0, '#FF0000')
    gradient.addColorStop(1, '#880000')
  }

  ctx.fillStyle = gradient
  ctx.fillRect(x, y + height - fillHeight, width, fillHeight)

  // Border
  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = 2
  ctx.strokeRect(x, y, width, height)

  // Value
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 16px Arial'
  ctx.fillText(oxygen.toString(), x + width / 2, y + height + 20)

  ctx.restore()
}

// Render round indicator
function renderRoundIndicator(ctx: CanvasRenderingContext2D, round: number): void {
  const x = CANVAS_WIDTH - 80
  const y = 30

  ctx.save()

  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
  ctx.fillRect(x - 10, y - 20, 80, 40)

  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 14px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(`Round ${round}/3`, x + 30, y + 5)

  ctx.restore()
}

// Render dice
function renderDice(ctx: CanvasRenderingContext2D, roll: DiceRoll): void {
  const x = CANVAS_WIDTH - 120
  const y = 100

  ctx.save()

  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
  ctx.fillRect(x - 10, y - 10, 100, 80)

  // Draw both dice
  renderSingleDie(ctx, roll.die1, x + 10, y + 10)
  renderSingleDie(ctx, roll.die2, x + 55, y + 10)

  // Total
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 14px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(`Move: ${roll.movement}`, x + 40, y + 60)

  ctx.restore()
}

// Render a single die
function renderSingleDie(
  ctx: CanvasRenderingContext2D,
  value: number,
  x: number,
  y: number
): void {
  const size = 30

  // Die background
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(x, y, size, size)
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 2
  ctx.strokeRect(x, y, size, size)

  // Dots
  ctx.fillStyle = '#000'
  const dotSize = 4
  const center = size / 2
  const offset = size / 4

  const dotPositions: Record<number, Array<[number, number]>> = {
    1: [[center, center]],
    2: [
      [offset, offset],
      [size - offset, size - offset],
    ],
    3: [
      [offset, offset],
      [center, center],
      [size - offset, size - offset],
    ],
  }

  for (const [dx, dy] of dotPositions[value] || []) {
    ctx.beginPath()
    ctx.arc(x + dx, y + dy, dotSize, 0, Math.PI * 2)
    ctx.fill()
  }
}

// Render bubble particles
function renderBubbles(ctx: CanvasRenderingContext2D, bubbles: BubbleParticle[]): void {
  for (const bubble of bubbles) {
    ctx.save()
    ctx.globalAlpha = bubble.opacity * (bubble.life / bubble.maxLife)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.beginPath()
    ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2)
    ctx.fill()

    // Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.beginPath()
    ctx.arc(bubble.x - bubble.size * 0.3, bubble.y - bubble.size * 0.3, bubble.size * 0.3, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }
}

// Render current player indicator
export function renderCurrentPlayerIndicator(
  ctx: CanvasRenderingContext2D,
  player: Player,
  x: number,
  y: number
): void {
  const colors = PLAYER_COLORS[player.color]

  ctx.save()

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.fillRect(x, y, 200, 60)

  ctx.fillStyle = colors.primary
  ctx.font = 'bold 16px Arial'
  ctx.textAlign = 'left'
  ctx.fillText(`${colors.name}'s Turn`, x + 10, y + 25)

  ctx.fillStyle = '#FFFFFF'
  ctx.font = '12px Arial'
  ctx.fillText(`Treasures: ${player.heldTreasures.length}`, x + 10, y + 45)

  ctx.restore()
}
