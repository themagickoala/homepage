import { ConfettiParticle } from './types'

const COLORS = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#ff69b4']

export function createConfetti(width: number): ConfettiParticle[] {
  const particles: ConfettiParticle[] = []

  for (let i = 0; i < 150; i++) {
    particles.push({
      x: Math.random() * width,
      y: -20 - Math.random() * 100,
      vx: (Math.random() - 0.5) * 8,
      vy: Math.random() * 3 + 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: Math.random() * 8 + 4,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
    })
  }

  return particles
}

export function updateConfetti(particles: ConfettiParticle[], deltaTime: number): ConfettiParticle[] {
  return particles.map(p => ({
    ...p,
    x: p.x + p.vx * deltaTime * 60,
    y: p.y + p.vy * deltaTime * 60,
    vy: p.vy + 0.1 * deltaTime * 60,
    rotation: p.rotation + p.rotationSpeed,
  })).filter(p => p.y < 1000)
}

export function renderConfetti(ctx: CanvasRenderingContext2D, particles: ConfettiParticle[]) {
  particles.forEach(p => {
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(p.rotation)
    ctx.fillStyle = p.color
    ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
    ctx.restore()
  })
}
