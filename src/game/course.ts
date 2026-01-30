import { Course, Boat, RaceState, Vector2D } from './types'

const BUOY_RADIUS = 15
const FINISH_LINE_WIDTH = 30

export function createCourse(): Course {
  return {
    width: 1200,
    height: 800,
    checkpoints: [
      { x: 300, y: 200 },
      { x: 900, y: 200 },
      { x: 1000, y: 400 },
      { x: 900, y: 600 },
      { x: 300, y: 600 },
      { x: 200, y: 400 },
    ],
    startPosition: { x: 200, y: 400 },
    startRotation: 0,
  }
}

export function renderCourse(ctx: CanvasRenderingContext2D, course: Course, raceState: RaceState) {
  const { width, height, checkpoints } = course
  const { currentCheckpoint, completed } = raceState

  // Water background
  ctx.fillStyle = '#1E90FF'
  ctx.fillRect(0, 0, width, height)

  // Water texture/waves
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
  ctx.lineWidth = 1
  for (let y = 0; y < height; y += 30) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    for (let x = 0; x < width; x += 20) {
      ctx.lineTo(x, y + Math.sin(x * 0.05) * 5)
    }
    ctx.stroke()
  }

  // Course boundary
  ctx.strokeStyle = '#FFD700'
  ctx.lineWidth = 4
  ctx.setLineDash([20, 10])
  ctx.beginPath()
  ctx.moveTo(checkpoints[0].x, checkpoints[0].y)
  for (let i = 1; i < checkpoints.length; i++) {
    ctx.lineTo(checkpoints[i].x, checkpoints[i].y)
  }
  ctx.closePath()
  ctx.stroke()
  ctx.setLineDash([])

  // Checkpoint buoys
  checkpoints.forEach((point, index) => {
    // Determine buoy color based on race state
    let buoyColor: string
    if (completed) {
      buoyColor = '#FFD700' // Gold when race is complete
    } else if (index === currentCheckpoint) {
      buoyColor = '#00FF00' // Green for current target
    } else if (index < currentCheckpoint) {
      buoyColor = '#808080' // Gray for passed checkpoints
    } else {
      buoyColor = '#FF4500' // Orange for future checkpoints
    }

    // Outer buoy
    ctx.fillStyle = buoyColor
    ctx.beginPath()
    ctx.arc(point.x, point.y, BUOY_RADIUS, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 2
    ctx.stroke()

    // Buoy number
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 12px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText((index + 1).toString(), point.x, point.y)
  })

  // Start/Finish line
  const startLineLength = 60
  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.moveTo(course.startPosition.x, course.startPosition.y - startLineLength / 2)
  ctx.lineTo(course.startPosition.x, course.startPosition.y + startLineLength / 2)
  ctx.stroke()

  // Checkerboard pattern on start line
  const squareSize = 10
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#000000' : '#FFFFFF'
    ctx.fillRect(
      course.startPosition.x - 3,
      course.startPosition.y - startLineLength / 2 + i * squareSize,
      6,
      squareSize
    )
  }
}

export function keepBoatInBounds(boat: Boat, course: Course): Boat {
  const margin = 20
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

  if (dist < BUOY_RADIUS + 15) {
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
