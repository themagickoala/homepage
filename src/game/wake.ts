import { Boat, WakeParticle } from './types'

const PARTICLE_LIFETIME = 2.0 // How long particles live (seconds)
const MAX_PARTICLES = 200

export function spawnWakeParticles(
  boat: Boat,
  existingParticles: WakeParticle[],
  _deltaTime: number,
  _spawnAccumulator: number
): { particles: WakeParticle[]; accumulator: number } {
  const speed = Math.sqrt(boat.velocity.x ** 2 + boat.velocity.y ** 2)

  // Only spawn wake when moving
  if (speed < 5) {
    return { particles: existingParticles, accumulator: 0 }
  }

  let particles = [...existingParticles]

  // Spawn particles every frame based on speed
  // More speed = more particles per frame
  const particlesToSpawn = Math.ceil(speed / 30)

  for (let i = 0; i < particlesToSpawn && particles.length < MAX_PARTICLES; i++) {
    // Spawn position at the back corners of the boat (the wake source points)
    const backOffset = -12
    const sideOffset = 8

    // Perpendicular direction to boat facing
    const perpX = -Math.sin(boat.rotation)
    const perpY = Math.cos(boat.rotation)

    // Back center of boat
    const backX = boat.position.x + Math.cos(boat.rotation) * backOffset
    const backY = boat.position.y + Math.sin(boat.rotation) * backOffset

    // Spawn from left and right sides of the stern
    const sides = [-1, 1]
    for (const side of sides) {
      const spawnX = backX + perpX * sideOffset * side + (Math.random() - 0.5) * 3
      const spawnY = backY + perpY * sideOffset * side + (Math.random() - 0.5) * 3

      // Wake particles spread outward from the boat's path
      // They move slowly outward perpendicular to boat direction
      const spreadSpeed = 15 + Math.random() * 10
      const vx = perpX * side * spreadSpeed
      const vy = perpY * side * spreadSpeed

      particles.push({
        x: spawnX,
        y: spawnY,
        vx,
        vy,
        size: 2 + Math.random() * 2,
        opacity: 0.4 + Math.random() * 0.2,
        life: PARTICLE_LIFETIME * (0.8 + Math.random() * 0.4),
        maxLife: PARTICLE_LIFETIME,
      })
    }

    // Also spawn some foam particles directly behind the boat
    const foamX = backX + (Math.random() - 0.5) * 10
    const foamY = backY + (Math.random() - 0.5) * 10
    particles.push({
      x: foamX,
      y: foamY,
      vx: (Math.random() - 0.5) * 5,
      vy: (Math.random() - 0.5) * 5,
      size: 3 + Math.random() * 3,
      opacity: 0.6 + Math.random() * 0.3,
      life: PARTICLE_LIFETIME * 0.5,
      maxLife: PARTICLE_LIFETIME * 0.5,
    })
  }

  return { particles, accumulator: 0 }
}

export function updateWakeParticles(particles: WakeParticle[], deltaTime: number): WakeParticle[] {
  return particles
    .map(p => ({
      ...p,
      x: p.x + p.vx * deltaTime,
      y: p.y + p.vy * deltaTime,
      vx: p.vx * 0.95, // Slow down spread over time
      vy: p.vy * 0.95,
      size: p.size + deltaTime * 3, // Grow as ripples expand
      life: p.life - deltaTime,
    }))
    .filter(p => p.life > 0)
}

export function renderWake(ctx: CanvasRenderingContext2D, particles: WakeParticle[]) {
  // Sort by life so older (larger) particles render first
  const sorted = [...particles].sort((a, b) => a.life - b.life)

  sorted.forEach(p => {
    const lifeRatio = p.life / p.maxLife
    const alpha = p.opacity * lifeRatio * lifeRatio // Quadratic fade for smoother trail

    ctx.save()

    // Outer ripple ring
    ctx.globalAlpha = alpha * 0.5
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
    ctx.stroke()

    // Inner foam/splash fill
    ctx.globalAlpha = alpha * 0.7
    ctx.fillStyle = 'rgba(200, 230, 255, 0.6)'
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2)
    ctx.fill()

    // Bright center highlight
    ctx.globalAlpha = alpha
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size * 0.25, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  })
}
