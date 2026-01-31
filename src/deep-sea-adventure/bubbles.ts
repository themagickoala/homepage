import { BubbleParticle } from './types'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './render'

const BUBBLE_LIFETIME = 4.0
const MAX_BUBBLES = 50
const SPAWN_RATE = 0.5 // Bubbles per second

let spawnAccumulator = 0

// Spawn new bubbles
export function spawnBubbles(
  existingBubbles: BubbleParticle[],
  deltaTime: number
): BubbleParticle[] {
  const bubbles = [...existingBubbles]

  spawnAccumulator += deltaTime * SPAWN_RATE

  while (spawnAccumulator >= 1 && bubbles.length < MAX_BUBBLES) {
    spawnAccumulator -= 1

    // Spawn from bottom of screen at random x position
    bubbles.push({
      x: Math.random() * CANVAS_WIDTH,
      y: CANVAS_HEIGHT + 10,
      vy: -(30 + Math.random() * 40), // Upward velocity
      size: 3 + Math.random() * 8,
      opacity: 0.3 + Math.random() * 0.4,
      life: BUBBLE_LIFETIME * (0.8 + Math.random() * 0.4),
      maxLife: BUBBLE_LIFETIME,
    })
  }

  return bubbles
}

// Update bubble positions and lifetimes
export function updateBubbles(
  bubbles: BubbleParticle[],
  deltaTime: number
): BubbleParticle[] {
  return bubbles
    .map(bubble => ({
      ...bubble,
      y: bubble.y + bubble.vy * deltaTime,
      x: bubble.x + Math.sin(bubble.y * 0.05) * 0.5, // Slight wobble
      life: bubble.life - deltaTime,
    }))
    .filter(bubble => bubble.life > 0 && bubble.y > -bubble.size)
}

// Spawn bubbles from a specific location (e.g., diver movement)
export function spawnBubblesAt(
  x: number,
  y: number,
  count: number
): BubbleParticle[] {
  const bubbles: BubbleParticle[] = []

  for (let i = 0; i < count; i++) {
    bubbles.push({
      x: x + (Math.random() - 0.5) * 20,
      y: y + (Math.random() - 0.5) * 10,
      vy: -(40 + Math.random() * 30),
      size: 2 + Math.random() * 5,
      opacity: 0.5 + Math.random() * 0.3,
      life: BUBBLE_LIFETIME * 0.5,
      maxLife: BUBBLE_LIFETIME * 0.5,
    })
  }

  return bubbles
}

// Reset accumulator (for new game)
export function resetBubbleSpawner(): void {
  spawnAccumulator = 0
}
