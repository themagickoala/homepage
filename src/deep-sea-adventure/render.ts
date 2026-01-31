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

// Generate path node positions for rendering
export function generatePathNodes(pathLength: number): PathNode[] {
  const nodes: PathNode[] = []
  const spacesPerRow = 8
  const spaceWidth = (CANVAS_WIDTH - 2 * PATH_MARGIN_X) / (spacesPerRow - 1)

  for (let i = 0; i < pathLength; i++) {
    const row = Math.floor(i / spacesPerRow)
    const col = i % spacesPerRow
    const isReversed = row % 2 === 1

    const adjustedCol = isReversed ? spacesPerRow - 1 - col : col

    nodes.push({
      index: i,
      x: PATH_MARGIN_X + adjustedCol * spaceWidth,
      y: PATH_START_Y + row * PATH_ROW_HEIGHT,
    })
  }

  return nodes
}

// Main render function
export function render(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  pathNodes: PathNode[],
  bubbles: BubbleParticle[]
): void {
  // Clear canvas
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  // Render layers in order
  renderBackground(ctx)
  renderBubbles(ctx, bubbles)
  renderSubmarine(ctx)
  renderPath(ctx, state.round.path, pathNodes)
  renderPlayers(ctx, state.players, pathNodes)
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

  // Draw dots for level indicator
  drawLevelDots(ctx, treasure.level, config.dotColor)

  // Mega-treasure indicator
  if (treasure.isMegaTreasure) {
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 10px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(`x${treasure.componentCount}`, 0, size + 12)
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

// Render players/divers
function renderPlayers(
  ctx: CanvasRenderingContext2D,
  players: Player[],
  pathNodes: PathNode[]
): void {
  // Group players by position for stacking
  const playersByPosition = new Map<number, Player[]>()

  for (const player of players) {
    const pos = player.position
    if (!playersByPosition.has(pos)) {
      playersByPosition.set(pos, [])
    }
    playersByPosition.get(pos)!.push(player)
  }

  // Render each group
  for (const [position, playersAtPos] of playersByPosition) {
    let x: number, y: number

    if (position === -1) {
      // In submarine
      x = CANVAS_WIDTH / 2
      y = SUBMARINE_Y + 30
    } else if (position < pathNodes.length) {
      x = pathNodes[position].x
      y = pathNodes[position].y
    } else {
      continue
    }

    // Stack players horizontally with slight offset
    const totalWidth = (playersAtPos.length - 1) * 15
    let offsetX = -totalWidth / 2

    for (const player of playersAtPos) {
      renderDiver(ctx, player, x + offsetX, y - 20)
      offsetX += 15
    }
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
