import { Boat, KeyState, Course } from './types'

const ACCELERATION = 120
const DECELERATION = 60
const DRAG = 0.98
const TURN_SPEED = 2.5
const MAX_SPEED = 180

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

export interface BoatColors {
  hull: string
  hullStroke: string
  deck: string
}

export const BOAT_COLORS: { player1: BoatColors; player2: BoatColors } = {
  player1: {
    hull: '#8B4513',      // Brown
    hullStroke: '#5D3A1A',
    deck: '#A0522D',
  },
  player2: {
    hull: '#2E5A88',      // Blue
    hullStroke: '#1A3A5C',
    deck: '#4A7AB0',
  },
}

const BOAT_COLLISION_RADIUS = 8

export function handleBoatCollision(boat1: Boat, boat2: Boat): { boat1: Boat; boat2: Boat } {
  const dx = boat2.position.x - boat1.position.x
  const dy = boat2.position.y - boat1.position.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  const minDistance = BOAT_COLLISION_RADIUS * 2

  if (distance >= minDistance || distance === 0) {
    return { boat1, boat2 }
  }

  // Normalize the collision vector
  const nx = dx / distance
  const ny = dy / distance

  // Calculate overlap and push boats apart equally
  const overlap = minDistance - distance
  const pushX = (nx * overlap) / 2
  const pushY = (ny * overlap) / 2

  const newPos1 = {
    x: boat1.position.x - pushX,
    y: boat1.position.y - pushY,
  }
  const newPos2 = {
    x: boat2.position.x + pushX,
    y: boat2.position.y + pushY,
  }

  // Calculate relative velocity along collision normal
  const relVelX = boat1.velocity.x - boat2.velocity.x
  const relVelY = boat1.velocity.y - boat2.velocity.y
  const relVelDotNormal = relVelX * nx + relVelY * ny

  // Only apply impulse if boats are moving toward each other
  if (relVelDotNormal > 0) {
    // Elastic collision with some energy loss (restitution)
    const restitution = 0.6
    const impulse = relVelDotNormal * restitution

    return {
      boat1: {
        ...boat1,
        position: newPos1,
        velocity: {
          x: boat1.velocity.x - impulse * nx,
          y: boat1.velocity.y - impulse * ny,
        },
      },
      boat2: {
        ...boat2,
        position: newPos2,
        velocity: {
          x: boat2.velocity.x + impulse * nx,
          y: boat2.velocity.y + impulse * ny,
        },
      },
    }
  }

  return {
    boat1: { ...boat1, position: newPos1 },
    boat2: { ...boat2, position: newPos2 },
  }
}

export function renderBoat(ctx: CanvasRenderingContext2D, boat: Boat, colors: BoatColors = BOAT_COLORS.player1) {
  const { position, rotation } = boat

  ctx.save()
  ctx.translate(position.x, position.y)
  ctx.rotate(rotation)

  // Boat body
  ctx.fillStyle = colors.hull
  ctx.beginPath()
  ctx.moveTo(10, 0) // Bow (front)
  ctx.lineTo(-7, -5) // Back left
  ctx.lineTo(-5, 0) // Back center
  ctx.lineTo(-7, 5) // Back right
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = colors.hullStroke
  ctx.lineWidth = 1
  ctx.stroke()

  // Deck detail
  ctx.fillStyle = colors.deck
  ctx.beginPath()
  ctx.ellipse(0, 0, 4, 2.5, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}
