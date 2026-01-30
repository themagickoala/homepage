import { Course, Boat, RaceState, Vector2D } from './types'

const BUOY_RADIUS = 8
const FINISH_LINE_WIDTH = 15

// Check if a point is in a HUD exclusion zone (top left or top right corners)
function isInHudZone(point: Vector2D, width: number): boolean {
  const hudPadding = 20 // Extra padding around HUD
  const hudWidth = 160 + hudPadding
  const hudHeight = 70 + hudPadding

  // Top left HUD zone (Player 1)
  if (point.x <= 10 + hudWidth && point.y <= 10 + hudHeight) {
    return true
  }

  // Top right HUD zone (Player 2)
  if (point.x >= width - 170 - hudPadding && point.y <= 10 + hudHeight) {
    return true
  }

  return false
}

function generateCheckpoints(width: number, height: number): Vector2D[] {
  const margin = 30 // Reduced margin to allow points closer to edges
  const leftMargin = 60 // Extra margin on left for boat spawn area (boats start behind the leftmost checkpoint)
  const minDistance = 80 // Minimum distance between checkpoints
  const edgeThreshold = 0.1 // 10% from each edge

  // Generate 8-12 random checkpoints
  const numCheckpoints = 8 + Math.floor(Math.random() * 5)

  for (let attempts = 0; attempts < 100; attempts++) {
    const points: Vector2D[] = []

    // Generate random points with minimum distance constraint
    let pointAttempts = 0
    while (points.length < numCheckpoints && pointAttempts < 1000) {
      pointAttempts++
      const point = {
        x: leftMargin + Math.random() * (width - leftMargin - margin),
        y: margin + Math.random() * (height - 2 * margin),
      }

      // Check minimum distance from existing points and HUD zones
      const tooClose = points.some(p => distance(p, point) < minDistance)
      const inHudZone = isInHudZone(point, width)
      if (!tooClose && !inHudZone) {
        points.push(point)
      }
    }

    if (points.length < numCheckpoints) continue

    // Check if points are spread to within 10% of each edge
    const minX = Math.min(...points.map(p => p.x))
    const maxX = Math.max(...points.map(p => p.x))
    const minY = Math.min(...points.map(p => p.y))
    const maxY = Math.max(...points.map(p => p.y))

    const leftOk = minX <= leftMargin + width * edgeThreshold
    const rightOk = maxX >= width * (1 - edgeThreshold)
    const topOk = minY <= height * edgeThreshold
    const bottomOk = maxY >= height * (1 - edgeThreshold)

    if (leftOk && rightOk && topOk && bottomOk) {
      return points
    }
  }

  // Fallback: generate points forced to cover edges (avoiding HUD zones)
  const points: Vector2D[] = [
    { x: leftMargin, y: height * 0.5 },  // Left edge (with room for boat spawn)
    { x: width * 0.92, y: height * 0.5 },  // Right edge (middle, avoids top-right HUD)
    { x: width * 0.5, y: height * 0.08 },  // Top edge (center, between HUDs)
    { x: width * 0.5, y: height * 0.92 },  // Bottom edge
  ]

  // Add more random points
  const targetCount = 8 + Math.floor(Math.random() * 5)
  let fallbackAttempts = 0
  while (points.length < targetCount && fallbackAttempts < 1000) {
    fallbackAttempts++
    const point = {
      x: leftMargin + Math.random() * (width - leftMargin - margin),
      y: margin + Math.random() * (height - 2 * margin),
    }
    const tooClose = points.some(p => distance(p, point) < minDistance)
    const inHudZone = isInHudZone(point, width)
    if (!tooClose && !inHudZone) {
      points.push(point)
    }
  }

  return points
}

export function createCourse(): Course {
  const width = 1200
  const height = 800

  const points = generateCheckpoints(width, height)

  // Sort points by angle from centroid to create non-crossing path
  const centroid = {
    x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
    y: points.reduce((sum, p) => sum + p.y, 0) / points.length,
  }

  const checkpoints = points.sort((a, b) => {
    const angleA = Math.atan2(a.y - centroid.y, a.x - centroid.x)
    const angleB = Math.atan2(b.y - centroid.y, b.x - centroid.x)
    return angleA - angleB
  })

  // Find the leftmost checkpoint for start position
  const startIndex = checkpoints.reduce((minIdx, point, idx, arr) =>
    point.x < arr[minIdx].x ? idx : minIdx, 0)

  // Rotate array so start is first
  const rotatedCheckpoints = [
    ...checkpoints.slice(startIndex),
    ...checkpoints.slice(0, startIndex),
  ]

  const firstCheckpoint = rotatedCheckpoints[0]
  const secondCheckpoint = rotatedCheckpoints[1]

  // Calculate direction from first to second checkpoint
  const dirX = secondCheckpoint.x - firstCheckpoint.x
  const dirY = secondCheckpoint.y - firstCheckpoint.y
  const dirLength = Math.sqrt(dirX * dirX + dirY * dirY)
  const normDirX = dirX / dirLength
  const normDirY = dirY / dirLength

  // Start rotation faces toward second checkpoint
  const startRotation = Math.atan2(normDirY, normDirX)

  // Position start line at the first checkpoint (intersecting it)
  const startPosition = {
    x: firstCheckpoint.x,
    y: firstCheckpoint.y,
  }

  return {
    width,
    height,
    checkpoints: rotatedCheckpoints,
    startPosition,
    startRotation,
  }
}

// Player colors for buoys
const PLAYER1_BUOY_COLOR = '#8B4513' // Brown
const PLAYER2_BUOY_COLOR = '#2E5A88' // Blue

export function renderCourse(
  ctx: CanvasRenderingContext2D,
  course: Course,
  raceState1: RaceState,
  raceState2: RaceState
) {
  const { width, height, checkpoints } = course

  // Water background
  ctx.fillStyle = '#1E90FF'
  ctx.fillRect(0, 0, width, height)

  // Water texture/waves
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
  ctx.lineWidth = 1
  for (let y = 0; y < height; y += 20) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    for (let x = 0; x < width; x += 15) {
      ctx.lineTo(x, y + Math.sin(x * 0.08) * 3)
    }
    ctx.stroke()
  }

  // Course boundary
  ctx.strokeStyle = '#FFD700'
  ctx.lineWidth = 2
  ctx.setLineDash([10, 5])
  ctx.beginPath()
  ctx.moveTo(checkpoints[0].x, checkpoints[0].y)
  for (let i = 1; i < checkpoints.length; i++) {
    ctx.lineTo(checkpoints[i].x, checkpoints[i].y)
  }
  ctx.closePath()
  ctx.stroke()
  ctx.setLineDash([])

  // Find the first checkpoint that both players still need (the shared target)
  const sharedTargetIndex = checkpoints.findIndex((_, index) => {
    const p1NeedsIt = !raceState1.completed && index >= raceState1.currentCheckpoint
    const p2NeedsIt = !raceState2.completed && index >= raceState2.currentCheckpoint
    return p1NeedsIt && p2NeedsIt
  })

  // Checkpoint buoys
  checkpoints.forEach((point, index) => {
    // Check which players still need this checkpoint
    const p1NeedsIt = !raceState1.completed && index >= raceState1.currentCheckpoint
    const p2NeedsIt = !raceState2.completed && index >= raceState2.currentCheckpoint
    const bothPassed = !p1NeedsIt && !p2NeedsIt

    if (bothPassed) {
      // Gray for passed by both
      ctx.fillStyle = '#808080'
      ctx.beginPath()
      ctx.arc(point.x, point.y, BUOY_RADIUS, 0, Math.PI * 2)
      ctx.fill()
    } else if (index === sharedTargetIndex) {
      // Green for the first checkpoint both players still need
      ctx.fillStyle = '#00FF00'
      ctx.beginPath()
      ctx.arc(point.x, point.y, BUOY_RADIUS, 0, Math.PI * 2)
      ctx.fill()
    } else if (p1NeedsIt && p2NeedsIt) {
      // Split color: left half P1, right half P2 (future checkpoint for both)
      ctx.save()
      ctx.beginPath()
      ctx.arc(point.x, point.y, BUOY_RADIUS, 0, Math.PI * 2)
      ctx.clip()

      // Left half (P1 brown)
      ctx.fillStyle = PLAYER1_BUOY_COLOR
      ctx.fillRect(point.x - BUOY_RADIUS, point.y - BUOY_RADIUS, BUOY_RADIUS, BUOY_RADIUS * 2)

      // Right half (P2 blue)
      ctx.fillStyle = PLAYER2_BUOY_COLOR
      ctx.fillRect(point.x, point.y - BUOY_RADIUS, BUOY_RADIUS, BUOY_RADIUS * 2)

      ctx.restore()
    } else if (p1NeedsIt) {
      // Only P1 needs it - brown
      ctx.fillStyle = PLAYER1_BUOY_COLOR
      ctx.beginPath()
      ctx.arc(point.x, point.y, BUOY_RADIUS, 0, Math.PI * 2)
      ctx.fill()
    } else {
      // Only P2 needs it - blue
      ctx.fillStyle = PLAYER2_BUOY_COLOR
      ctx.beginPath()
      ctx.arc(point.x, point.y, BUOY_RADIUS, 0, Math.PI * 2)
      ctx.fill()
    }

    // White outline
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(point.x, point.y, BUOY_RADIUS, 0, Math.PI * 2)
    ctx.stroke()

    // Buoy number
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 8px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText((index + 1).toString(), point.x, point.y)
  })

  // Start/Finish line (perpendicular to race direction)
  const startLineLength = 40
  // Perpendicular direction to start rotation
  const perpX = -Math.sin(course.startRotation)
  const perpY = Math.cos(course.startRotation)

  const lineStart = {
    x: course.startPosition.x + perpX * startLineLength / 2,
    y: course.startPosition.y + perpY * startLineLength / 2,
  }
  const lineEnd = {
    x: course.startPosition.x - perpX * startLineLength / 2,
    y: course.startPosition.y - perpY * startLineLength / 2,
  }

  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(lineStart.x, lineStart.y)
  ctx.lineTo(lineEnd.x, lineEnd.y)
  ctx.stroke()

  // Checkerboard pattern on start line
  const numSquares = 8
  for (let i = 0; i < numSquares; i++) {
    const t = i / numSquares
    const x = lineStart.x + (lineEnd.x - lineStart.x) * t
    const y = lineStart.y + (lineEnd.y - lineStart.y) * t
    ctx.fillStyle = i % 2 === 0 ? '#000000' : '#FFFFFF'

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(course.startRotation)
    ctx.fillRect(-1.5, 0, 3, startLineLength / numSquares)
    ctx.restore()
  }
}

export function keepBoatInBounds(boat: Boat, course: Course): Boat {
  const margin = 10
  let { position, velocity } = boat

  if (position.x < margin) {
    position = { ...position, x: margin }
    velocity = { ...velocity, x: Math.abs(velocity.x) * 0.5 }
  }
  if (position.x > course.width - margin) {
    position = { ...position, x: course.width - margin }
    velocity = { ...velocity, x: -Math.abs(velocity.x) * 0.5 }
  }
  if (position.y < margin) {
    position = { ...position, y: margin }
    velocity = { ...velocity, y: Math.abs(velocity.y) * 0.5 }
  }
  if (position.y > course.height - margin) {
    position = { ...position, y: course.height - margin }
    velocity = { ...velocity, y: -Math.abs(velocity.y) * 0.5 }
  }

  return { ...boat, position, velocity }
}

function distance(a: Vector2D, b: Vector2D): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

export function checkCheckpointCollision(boat: Boat, course: Course, raceState: RaceState): RaceState {
  const { currentCheckpoint, completed } = raceState

  if (completed) {
    return raceState
  }

  const { checkpoints, startPosition } = course

  // Check if all checkpoints are done
  if (currentCheckpoint >= checkpoints.length) {
    // Check if boat crossed finish line
    const distToFinish = distance(boat.position, startPosition)
    if (distToFinish < FINISH_LINE_WIDTH) {
      return { ...raceState, completed: true }
    }
    return raceState
  }

  // Check collision with current checkpoint
  const checkpoint = checkpoints[currentCheckpoint]
  const dist = distance(boat.position, checkpoint)

  if (dist < BUOY_RADIUS + 8) {
    return { ...raceState, currentCheckpoint: currentCheckpoint + 1 }
  }

  return raceState
}

export function createRaceState(): RaceState {
  return {
    currentCheckpoint: 0,
    completed: false,
  }
}
