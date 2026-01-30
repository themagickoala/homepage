import { Boat, KeyState, Course } from './types'

const ACCELERATION = 200
const DECELERATION = 100
const DRAG = 0.98
const TURN_SPEED = 3
const MAX_SPEED = 300

export function createBoat(course: Course): Boat {
  return {
    position: { ...course.startPosition },
    velocity: { x: 0, y: 0 },
    rotation: course.startRotation,
    angularVelocity: 0,
  }
}

export function updateBoat(boat: Boat, keys: KeyState, deltaTime: number): Boat {
  let { position, velocity, rotation, angularVelocity } = boat

  // Turning - only effective when moving
  const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y)
  const turnFactor = Math.min(speed / 50, 1) // Turn better at higher speeds

  if (keys.left) {
    angularVelocity = -TURN_SPEED * turnFactor
  } else if (keys.right) {
    angularVelocity = TURN_SPEED * turnFactor
  } else {
    angularVelocity = 0
  }

  rotation += angularVelocity * deltaTime

  // Acceleration/Deceleration
  const direction = {
    x: Math.cos(rotation),
    y: Math.sin(rotation),
  }

  if (keys.up) {
    velocity.x += direction.x * ACCELERATION * deltaTime
    velocity.y += direction.y * ACCELERATION * deltaTime
  }

  if (keys.down) {
    velocity.x -= direction.x * DECELERATION * deltaTime
    velocity.y -= direction.y * DECELERATION * deltaTime
  }

  // Apply drag (water resistance)
  velocity.x *= DRAG
  velocity.y *= DRAG

  // Clamp speed
  const currentSpeed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y)
  if (currentSpeed > MAX_SPEED) {
    const scale = MAX_SPEED / currentSpeed
    velocity.x *= scale
    velocity.y *= scale
  }

  // Update position
  position = {
    x: position.x + velocity.x * deltaTime,
    y: position.y + velocity.y * deltaTime,
  }

  return {
    position,
    velocity: { ...velocity },
    rotation,
    angularVelocity,
  }
}

export function renderBoat(ctx: CanvasRenderingContext2D, boat: Boat) {
  const { position, rotation } = boat

  ctx.save()
  ctx.translate(position.x, position.y)
  ctx.rotate(rotation)

  // Boat body
  ctx.fillStyle = '#8B4513'
  ctx.beginPath()
  ctx.moveTo(20, 0) // Bow (front)
  ctx.lineTo(-15, -10) // Back left
  ctx.lineTo(-10, 0) // Back center
  ctx.lineTo(-15, 10) // Back right
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = '#5D3A1A'
  ctx.lineWidth = 2
  ctx.stroke()

  // Deck detail
  ctx.fillStyle = '#A0522D'
  ctx.beginPath()
  ctx.ellipse(0, 0, 8, 5, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}
