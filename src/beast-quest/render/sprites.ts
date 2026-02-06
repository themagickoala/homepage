// ============================================
// Sprite Rendering Utilities
// ============================================
// Procedural sprite rendering for characters, enemies, and effects
// Uses simple shapes as placeholders until pixel art assets are added

import { Direction } from '../types'
import { TILE_HEIGHT, lerpedIsoToScreen } from './isometric'

// Character colors
export const CHARACTER_COLORS = {
  tom: { primary: '#4a7abc', secondary: '#2d5a8a', outline: '#1a3a5a', skin: '#e8c8a8' },
  elenna: { primary: '#7a5a3a', secondary: '#5a3a2a', outline: '#3a2a1a', skin: '#e8d0b8' },
  storm: { primary: '#8a7a6a', secondary: '#5a4a3a', outline: '#3a2a2a' },
  silver: { primary: '#aaaaaa', secondary: '#888888', outline: '#444444' },
}

// Enemy colors
export const ENEMY_COLORS: Record<string, { primary: string; secondary: string; outline: string }> = {
  cave_bat: { primary: '#4a4a4a', secondary: '#2a2a2a', outline: '#1a1a1a' },
  cave_spider: { primary: '#3a2a1a', secondary: '#2a1a0a', outline: '#1a1a0a' },
  rock_golem: { primary: '#6a6a6a', secondary: '#4a4a4a', outline: '#2a2a2a' },
  flame_bat: { primary: '#ff6a2a', secondary: '#cc4a1a', outline: '#992a0a' },
  magma_slime: { primary: '#ff4a1a', secondary: '#cc2a0a', outline: '#990a00' },
  fire_elemental: { primary: '#ff8a4a', secondary: '#ff5a2a', outline: '#cc3a1a' },
  ferno: { primary: '#ff2a00', secondary: '#cc1a00', outline: '#880000' },
  // Sepron dungeon enemies
  tide_crab: { primary: '#c45a3a', secondary: '#9a3a2a', outline: '#6a2a1a' },
  sea_slug: { primary: '#6a5aaa', secondary: '#4a3a8a', outline: '#2a2a5a' },
  reef_guard: { primary: '#2a8a7a', secondary: '#1a6a5a', outline: '#0a4a3a' },
  ice_jellyfish: { primary: '#8ac8ff', secondary: '#5aa8ee', outline: '#3a88cc' },
  frost_serpent: { primary: '#4a9acc', secondary: '#2a7aaa', outline: '#1a5a8a' },
  aqua_guardian: { primary: '#1a6a8a', secondary: '#0a4a6a', outline: '#0a3a5a' },
  sepron: { primary: '#0a5a9a', secondary: '#0a3a7a', outline: '#0a2a5a' },
}

// Sprite dimensions
export const SPRITE_WIDTH = 24
export const SPRITE_HEIGHT = 32

/**
 * Draw a character sprite (Tom or Elenna)
 */
export function drawCharacterSprite(
  ctx: CanvasRenderingContext2D,
  position: { col: number; row: number },
  characterId: 'tom' | 'elenna',
  direction: Direction,
  isMoving: boolean = false,
  animationFrame: number = 0
): void {
  const screenPos = lerpedIsoToScreen(position)
  const colors = CHARACTER_COLORS[characterId]

  // Offset to center sprite on tile and place feet on floor
  const x = screenPos.x - SPRITE_WIDTH / 2
  const y = screenPos.y - SPRITE_HEIGHT + TILE_HEIGHT / 4

  // Simple bounce animation when moving
  const bounce = isMoving ? Math.sin(animationFrame * 0.3) * 2 : 0

  ctx.save()

  // Body (rectangle)
  ctx.fillStyle = colors.primary
  ctx.fillRect(x + 6, y + 10 - bounce, 12, 14)

  // Head (circle)
  ctx.fillStyle = colors.skin
  ctx.beginPath()
  ctx.arc(x + 12, y + 6 - bounce, 6, 0, Math.PI * 2)
  ctx.fill()

  // Hair
  ctx.fillStyle = characterId === 'tom' ? '#5a4a3a' : '#8a5a3a'
  ctx.beginPath()
  ctx.arc(x + 12, y + 4 - bounce, 5, Math.PI, 0)
  ctx.fill()

  // Direction indicator (simple arrow or facing)
  ctx.fillStyle = colors.secondary
  if (direction === 'north') {
    ctx.fillRect(x + 10, y + 8 - bounce, 4, 2)
  } else if (direction === 'south') {
    ctx.fillRect(x + 10, y + 12 - bounce, 4, 2)
  } else if (direction === 'east') {
    ctx.fillRect(x + 14, y + 10 - bounce, 2, 4)
  } else {
    ctx.fillRect(x + 6, y + 10 - bounce, 2, 4)
  }

  // Legs
  ctx.fillStyle = colors.secondary
  const legOffset = isMoving ? Math.sin(animationFrame * 0.5) * 2 : 0
  ctx.fillRect(x + 7, y + 24 - bounce, 4, 8)
  ctx.fillRect(x + 13, y + 24 - bounce + legOffset, 4, 8)

  // Equipment indicator (Tom has sword, Elenna has bow)
  if (characterId === 'tom') {
    // Sword
    ctx.fillStyle = '#aaaaaa'
    ctx.fillRect(x + 18, y + 12 - bounce, 2, 12)
    ctx.fillStyle = '#8a6a3a'
    ctx.fillRect(x + 17, y + 12 - bounce, 4, 3)
  } else {
    // Bow
    ctx.strokeStyle = '#6a4a2a'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(x + 20, y + 16 - bounce, 8, -0.5, 0.5)
    ctx.stroke()
  }

  ctx.restore()
}

/**
 * Draw an enemy sprite
 */
export function drawEnemySprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  enemyId: string,
  animationFrame: number = 0
): void {
  const colors = ENEMY_COLORS[enemyId] || ENEMY_COLORS.cave_bat

  ctx.save()

  // Different shapes based on enemy type
  if (enemyId === 'cave_bat' || enemyId === 'flame_bat') {
    // Bat - triangular body with wings
    const wingFlap = Math.sin(animationFrame * 0.4) * 5

    ctx.fillStyle = colors.primary
    // Body
    ctx.beginPath()
    ctx.moveTo(x, y - 8)
    ctx.lineTo(x - 6, y + 4)
    ctx.lineTo(x + 6, y + 4)
    ctx.closePath()
    ctx.fill()

    // Wings
    ctx.fillStyle = colors.secondary
    ctx.beginPath()
    ctx.moveTo(x - 6, y)
    ctx.lineTo(x - 16, y - 4 + wingFlap)
    ctx.lineTo(x - 6, y + 4)
    ctx.closePath()
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(x + 6, y)
    ctx.lineTo(x + 16, y - 4 - wingFlap)
    ctx.lineTo(x + 6, y + 4)
    ctx.closePath()
    ctx.fill()

    // Eyes
    ctx.fillStyle = enemyId === 'flame_bat' ? '#ffff00' : '#ff0000'
    ctx.fillRect(x - 3, y - 4, 2, 2)
    ctx.fillRect(x + 1, y - 4, 2, 2)
  } else if (enemyId === 'cave_spider') {
    // Spider - round body with legs
    ctx.fillStyle = colors.primary
    ctx.beginPath()
    ctx.arc(x, y, 10, 0, Math.PI * 2)
    ctx.fill()

    // Legs
    ctx.strokeStyle = colors.secondary
    ctx.lineWidth = 2
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 4 + Math.sin(animationFrame * 0.2) * 0.1
      const legLength = 12 + Math.sin(animationFrame * 0.3 + i) * 2
      ctx.beginPath()
      ctx.moveTo(x - 8, y - 4 + i * 3)
      ctx.lineTo(x - 8 - Math.cos(angle) * legLength, y - 4 + i * 3 - Math.sin(angle) * legLength)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(x + 8, y - 4 + i * 3)
      ctx.lineTo(x + 8 + Math.cos(angle) * legLength, y - 4 + i * 3 - Math.sin(angle) * legLength)
      ctx.stroke()
    }

    // Eyes
    ctx.fillStyle = '#ff0000'
    ctx.beginPath()
    ctx.arc(x - 3, y - 4, 2, 0, Math.PI * 2)
    ctx.arc(x + 3, y - 4, 2, 0, Math.PI * 2)
    ctx.fill()
  } else if (enemyId === 'rock_golem') {
    // Golem - blocky humanoid
    ctx.fillStyle = colors.primary

    // Body
    ctx.fillRect(x - 12, y - 10, 24, 20)

    // Head
    ctx.fillStyle = colors.secondary
    ctx.fillRect(x - 8, y - 22, 16, 12)

    // Arms
    ctx.fillStyle = colors.primary
    ctx.fillRect(x - 20, y - 8, 8, 16)
    ctx.fillRect(x + 12, y - 8, 8, 16)

    // Eyes
    ctx.fillStyle = '#ffaa00'
    ctx.fillRect(x - 5, y - 18, 4, 4)
    ctx.fillRect(x + 1, y - 18, 4, 4)
  } else if (enemyId === 'magma_slime') {
    // Slime - blobby shape
    const wobble = Math.sin(animationFrame * 0.2) * 2

    ctx.fillStyle = colors.primary
    ctx.beginPath()
    ctx.ellipse(x, y, 14 + wobble, 10 - wobble / 2, 0, 0, Math.PI * 2)
    ctx.fill()

    // Glow effect
    ctx.fillStyle = colors.secondary
    ctx.beginPath()
    ctx.ellipse(x, y - 2, 8, 5, 0, 0, Math.PI * 2)
    ctx.fill()

    // Eyes
    ctx.fillStyle = '#000000'
    ctx.beginPath()
    ctx.arc(x - 4, y - 2, 2, 0, Math.PI * 2)
    ctx.arc(x + 4, y - 2, 2, 0, Math.PI * 2)
    ctx.fill()
  } else if (enemyId === 'fire_elemental') {
    // Elemental - flame shape
    const flicker = Math.sin(animationFrame * 0.3) * 3

    // Outer flame
    ctx.fillStyle = colors.outline
    ctx.beginPath()
    ctx.moveTo(x, y - 30 - flicker)
    ctx.quadraticCurveTo(x + 20, y - 10, x + 15, y + 10)
    ctx.quadraticCurveTo(x, y + 15, x - 15, y + 10)
    ctx.quadraticCurveTo(x - 20, y - 10, x, y - 30 - flicker)
    ctx.fill()

    // Inner flame
    ctx.fillStyle = colors.primary
    ctx.beginPath()
    ctx.moveTo(x, y - 22 - flicker / 2)
    ctx.quadraticCurveTo(x + 12, y - 5, x + 8, y + 5)
    ctx.quadraticCurveTo(x, y + 8, x - 8, y + 5)
    ctx.quadraticCurveTo(x - 12, y - 5, x, y - 22 - flicker / 2)
    ctx.fill()

    // Core
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.ellipse(x, y - 5, 4, 6, 0, 0, Math.PI * 2)
    ctx.fill()
  } else if (enemyId === 'ferno') {
    // Ferno - large dragon shape
    const breathe = Math.sin(animationFrame * 0.1) * 2

    // Body
    ctx.fillStyle = colors.primary
    ctx.beginPath()
    ctx.ellipse(x, y, 40 + breathe, 25, 0, 0, Math.PI * 2)
    ctx.fill()

    // Head
    ctx.fillStyle = colors.secondary
    ctx.beginPath()
    ctx.ellipse(x - 35, y - 15, 20, 15, -0.3, 0, Math.PI * 2)
    ctx.fill()

    // Snout
    ctx.fillStyle = colors.primary
    ctx.beginPath()
    ctx.moveTo(x - 50, y - 20)
    ctx.lineTo(x - 65, y - 15)
    ctx.lineTo(x - 50, y - 10)
    ctx.closePath()
    ctx.fill()

    // Wings
    ctx.fillStyle = colors.outline
    const wingFlap = Math.sin(animationFrame * 0.15) * 8
    ctx.beginPath()
    ctx.moveTo(x - 10, y - 20)
    ctx.lineTo(x + 20, y - 50 - wingFlap)
    ctx.lineTo(x + 40, y - 30 - wingFlap)
    ctx.lineTo(x + 30, y - 15)
    ctx.closePath()
    ctx.fill()

    // Tail
    ctx.strokeStyle = colors.secondary
    ctx.lineWidth = 8
    ctx.beginPath()
    ctx.moveTo(x + 35, y)
    ctx.quadraticCurveTo(x + 55, y + 10, x + 65, y - 5)
    ctx.stroke()

    // Eyes
    ctx.fillStyle = '#ffff00'
    ctx.beginPath()
    ctx.arc(x - 42, y - 20, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#000000'
    ctx.beginPath()
    ctx.arc(x - 42, y - 20, 2, 0, Math.PI * 2)
    ctx.fill()

    // Fire breath particles
    if (animationFrame % 20 < 10) {
      ctx.fillStyle = '#ff6a00'
      for (let i = 0; i < 3; i++) {
        const px = x - 70 - i * 8 + Math.random() * 4
        const py = y - 15 + Math.random() * 10 - 5
        ctx.beginPath()
        ctx.arc(px, py, 3 + Math.random() * 3, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  } else if (enemyId === 'tide_crab') {
    // Crab - rounded body with two claws
    const scuttle = Math.sin(animationFrame * 0.25) * 2

    // Body (oval)
    ctx.fillStyle = colors.primary
    ctx.beginPath()
    ctx.ellipse(x, y, 14, 10, 0, 0, Math.PI * 2)
    ctx.fill()

    // Shell pattern
    ctx.fillStyle = colors.secondary
    ctx.beginPath()
    ctx.ellipse(x, y - 2, 10, 6, 0, 0, Math.PI * 2)
    ctx.fill()

    // Left claw
    ctx.fillStyle = colors.primary
    ctx.beginPath()
    ctx.moveTo(x - 14, y - 2)
    ctx.lineTo(x - 24, y - 10 + scuttle)
    ctx.lineTo(x - 20, y - 4 + scuttle)
    ctx.lineTo(x - 26, y - 2 + scuttle)
    ctx.lineTo(x - 18, y + 2)
    ctx.closePath()
    ctx.fill()

    // Right claw
    ctx.beginPath()
    ctx.moveTo(x + 14, y - 2)
    ctx.lineTo(x + 24, y - 10 - scuttle)
    ctx.lineTo(x + 20, y - 4 - scuttle)
    ctx.lineTo(x + 26, y - 2 - scuttle)
    ctx.lineTo(x + 18, y + 2)
    ctx.closePath()
    ctx.fill()

    // Legs (3 per side)
    ctx.strokeStyle = colors.outline
    ctx.lineWidth = 2
    for (let i = 0; i < 3; i++) {
      const legY = y + 4 + i * 3
      const legWiggle = Math.sin(animationFrame * 0.3 + i) * 2
      ctx.beginPath()
      ctx.moveTo(x - 10, legY)
      ctx.lineTo(x - 18, legY + 4 + legWiggle)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(x + 10, legY)
      ctx.lineTo(x + 18, legY + 4 - legWiggle)
      ctx.stroke()
    }

    // Eyes (on stalks)
    ctx.fillStyle = '#000000'
    ctx.beginPath()
    ctx.arc(x - 5, y - 12, 2, 0, Math.PI * 2)
    ctx.arc(x + 5, y - 12, 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = colors.outline
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x - 5, y - 8)
    ctx.lineTo(x - 5, y - 12)
    ctx.moveTo(x + 5, y - 8)
    ctx.lineTo(x + 5, y - 12)
    ctx.stroke()
  } else if (enemyId === 'sea_slug') {
    // Sea slug - elongated blob with feathery appendages
    const pulse = Math.sin(animationFrame * 0.2) * 2

    // Body
    ctx.fillStyle = colors.primary
    ctx.beginPath()
    ctx.ellipse(x, y + 2, 16 + pulse, 8 - pulse / 2, 0, 0, Math.PI * 2)
    ctx.fill()

    // Dorsal frills
    ctx.fillStyle = colors.secondary
    for (let i = 0; i < 4; i++) {
      const frillX = x - 8 + i * 5
      const frillH = 6 + Math.sin(animationFrame * 0.3 + i) * 2
      ctx.beginPath()
      ctx.moveTo(frillX, y - 4)
      ctx.lineTo(frillX + 2, y - 4 - frillH)
      ctx.lineTo(frillX + 4, y - 4)
      ctx.closePath()
      ctx.fill()
    }

    // Slime trail
    ctx.fillStyle = colors.outline
    ctx.globalAlpha = 0.4
    ctx.beginPath()
    ctx.ellipse(x + 14, y + 6, 6, 3, 0.2, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1.0

    // Eye stalks
    ctx.fillStyle = '#ffcc00'
    ctx.beginPath()
    ctx.arc(x - 10, y - 8, 2, 0, Math.PI * 2)
    ctx.arc(x - 6, y - 9, 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = colors.primary
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x - 10, y - 4)
    ctx.lineTo(x - 10, y - 8)
    ctx.moveTo(x - 6, y - 4)
    ctx.lineTo(x - 6, y - 9)
    ctx.stroke()
  } else if (enemyId === 'reef_guard') {
    // Reef guard - coral-armored humanoid
    const sway = Math.sin(animationFrame * 0.15) * 1

    // Body (blocky, armored)
    ctx.fillStyle = colors.primary
    ctx.fillRect(x - 12, y - 8 + sway, 24, 20)

    // Head
    ctx.fillStyle = colors.secondary
    ctx.fillRect(x - 8, y - 20 + sway, 16, 12)

    // Coral crown
    ctx.fillStyle = '#ff6a5a'
    ctx.beginPath()
    ctx.moveTo(x - 8, y - 20 + sway)
    ctx.lineTo(x - 6, y - 28 + sway)
    ctx.lineTo(x - 2, y - 20 + sway)
    ctx.moveTo(x - 2, y - 20 + sway)
    ctx.lineTo(x + 1, y - 26 + sway)
    ctx.lineTo(x + 4, y - 20 + sway)
    ctx.moveTo(x + 4, y - 20 + sway)
    ctx.lineTo(x + 6, y - 28 + sway)
    ctx.lineTo(x + 8, y - 20 + sway)
    ctx.fill()

    // Arms
    ctx.fillStyle = colors.primary
    ctx.fillRect(x - 20, y - 6 + sway, 8, 14)
    ctx.fillRect(x + 12, y - 6 + sway, 8, 14)

    // Legs
    ctx.fillStyle = colors.secondary
    ctx.fillRect(x - 10, y + 12 + sway, 8, 10)
    ctx.fillRect(x + 2, y + 12 + sway, 8, 10)

    // Eyes
    ctx.fillStyle = '#00ffaa'
    ctx.fillRect(x - 5, y - 16 + sway, 4, 3)
    ctx.fillRect(x + 1, y - 16 + sway, 4, 3)
  } else if (enemyId === 'ice_jellyfish') {
    // Jellyfish - translucent dome with tentacles
    const bob = Math.sin(animationFrame * 0.2) * 4
    const tentacleWave = animationFrame * 0.15

    // Bell/dome
    ctx.fillStyle = colors.primary
    ctx.globalAlpha = 0.7
    ctx.beginPath()
    ctx.arc(x, y - 6 + bob, 14, Math.PI, 0)
    ctx.closePath()
    ctx.fill()

    // Inner glow
    ctx.fillStyle = '#ffffff'
    ctx.globalAlpha = 0.3
    ctx.beginPath()
    ctx.arc(x, y - 8 + bob, 8, Math.PI, 0)
    ctx.closePath()
    ctx.fill()
    ctx.globalAlpha = 1.0

    // Bell rim
    ctx.fillStyle = colors.secondary
    ctx.fillRect(x - 14, y - 6 + bob, 28, 3)

    // Tentacles
    ctx.strokeStyle = colors.primary
    ctx.globalAlpha = 0.6
    ctx.lineWidth = 2
    for (let i = 0; i < 5; i++) {
      const tx = x - 10 + i * 5
      ctx.beginPath()
      ctx.moveTo(tx, y - 3 + bob)
      for (let j = 1; j <= 4; j++) {
        const segX = tx + Math.sin(tentacleWave + i + j * 0.5) * 4
        const segY = y - 3 + bob + j * 6
        ctx.lineTo(segX, segY)
      }
      ctx.stroke()
    }
    ctx.globalAlpha = 1.0

    // Glow spots
    ctx.fillStyle = '#aaeeff'
    ctx.beginPath()
    ctx.arc(x - 4, y - 10 + bob, 2, 0, Math.PI * 2)
    ctx.arc(x + 4, y - 10 + bob, 2, 0, Math.PI * 2)
    ctx.fill()
  } else if (enemyId === 'frost_serpent') {
    // Frost serpent - sinuous snake with ice crystals
    const slither = animationFrame * 0.15

    // Body segments (sinuous curve)
    ctx.strokeStyle = colors.primary
    ctx.lineWidth = 10
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x - 20, y + Math.sin(slither) * 6)
    ctx.quadraticCurveTo(
      x - 8, y - 10 + Math.sin(slither + 1) * 6,
      x, y + Math.sin(slither + 2) * 4
    )
    ctx.quadraticCurveTo(
      x + 8, y + 10 + Math.sin(slither + 3) * 6,
      x + 22, y + Math.sin(slither + 4) * 4
    )
    ctx.stroke()

    // Belly stripe
    ctx.strokeStyle = colors.secondary
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.moveTo(x - 20, y + Math.sin(slither) * 6)
    ctx.quadraticCurveTo(
      x - 8, y - 10 + Math.sin(slither + 1) * 6,
      x, y + Math.sin(slither + 2) * 4
    )
    ctx.quadraticCurveTo(
      x + 8, y + 10 + Math.sin(slither + 3) * 6,
      x + 22, y + Math.sin(slither + 4) * 4
    )
    ctx.stroke()

    // Head
    ctx.fillStyle = colors.primary
    ctx.beginPath()
    ctx.ellipse(x - 20, y + Math.sin(slither) * 6, 8, 6, -0.3, 0, Math.PI * 2)
    ctx.fill()

    // Ice crystals on back
    ctx.fillStyle = '#aaddff'
    for (let i = 0; i < 3; i++) {
      const cx = x - 8 + i * 10
      const cy = y - 6 + Math.sin(slither + 1 + i) * 4
      ctx.beginPath()
      ctx.moveTo(cx, cy - 6)
      ctx.lineTo(cx + 3, cy)
      ctx.lineTo(cx, cy + 2)
      ctx.lineTo(cx - 3, cy)
      ctx.closePath()
      ctx.fill()
    }

    // Eyes
    ctx.fillStyle = '#00ffff'
    ctx.beginPath()
    ctx.arc(x - 23, y - 2 + Math.sin(slither) * 6, 2, 0, Math.PI * 2)
    ctx.fill()

    // Tail tip
    ctx.strokeStyle = colors.outline
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x + 22, y + Math.sin(slither + 4) * 4)
    ctx.lineTo(x + 30, y - 4 + Math.sin(slither + 5) * 3)
    ctx.stroke()
  } else if (enemyId === 'aqua_guardian') {
    // Aqua guardian - large armored water elemental
    const pulse = Math.sin(animationFrame * 0.15) * 2

    // Body (large, armored)
    ctx.fillStyle = colors.primary
    ctx.fillRect(x - 16, y - 12 + pulse, 32, 26)

    // Shoulder plates
    ctx.fillStyle = colors.secondary
    ctx.fillRect(x - 22, y - 14 + pulse, 10, 12)
    ctx.fillRect(x + 12, y - 14 + pulse, 10, 12)

    // Head
    ctx.fillStyle = colors.secondary
    ctx.beginPath()
    ctx.arc(x, y - 18 + pulse, 10, 0, Math.PI * 2)
    ctx.fill()

    // Helmet crest
    ctx.fillStyle = colors.outline
    ctx.beginPath()
    ctx.moveTo(x, y - 32 + pulse)
    ctx.lineTo(x - 6, y - 18 + pulse)
    ctx.lineTo(x + 6, y - 18 + pulse)
    ctx.closePath()
    ctx.fill()

    // Arms
    ctx.fillStyle = colors.primary
    ctx.fillRect(x - 26, y - 4 + pulse, 10, 18)
    ctx.fillRect(x + 16, y - 4 + pulse, 10, 18)

    // Water effect (swirling particles around body)
    ctx.fillStyle = '#4ac8ff'
    ctx.globalAlpha = 0.5
    for (let i = 0; i < 5; i++) {
      const angle = animationFrame * 0.05 + (i * Math.PI * 2) / 5
      const px = x + Math.cos(angle) * 22
      const py = y - 2 + Math.sin(angle) * 14
      ctx.beginPath()
      ctx.arc(px, py, 3, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1.0

    // Legs
    ctx.fillStyle = colors.secondary
    ctx.fillRect(x - 12, y + 14 + pulse, 10, 12)
    ctx.fillRect(x + 2, y + 14 + pulse, 10, 12)

    // Eyes
    ctx.fillStyle = '#00ffcc'
    ctx.beginPath()
    ctx.arc(x - 4, y - 20 + pulse, 3, 0, Math.PI * 2)
    ctx.arc(x + 4, y - 20 + pulse, 3, 0, Math.PI * 2)
    ctx.fill()
  } else if (enemyId === 'sepron') {
    // Sepron - large sea serpent boss
    const undulate = animationFrame * 0.1
    const breathe = Math.sin(animationFrame * 0.1) * 2

    // Coiled body segments
    ctx.strokeStyle = colors.primary
    ctx.lineWidth = 14
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x + 30, y + 20)
    ctx.quadraticCurveTo(x + 40, y, x + 25, y - 10 + Math.sin(undulate) * 4)
    ctx.quadraticCurveTo(x + 5, y - 20, x - 10, y - 8 + Math.sin(undulate + 1) * 4)
    ctx.quadraticCurveTo(x - 25, y + 5, x - 15, y + 18 + Math.sin(undulate + 2) * 4)
    ctx.stroke()

    // Body stripe
    ctx.strokeStyle = colors.secondary
    ctx.lineWidth = 7
    ctx.beginPath()
    ctx.moveTo(x + 30, y + 20)
    ctx.quadraticCurveTo(x + 40, y, x + 25, y - 10 + Math.sin(undulate) * 4)
    ctx.quadraticCurveTo(x + 5, y - 20, x - 10, y - 8 + Math.sin(undulate + 1) * 4)
    ctx.quadraticCurveTo(x - 25, y + 5, x - 15, y + 18 + Math.sin(undulate + 2) * 4)
    ctx.stroke()

    // Head
    ctx.fillStyle = colors.primary
    ctx.beginPath()
    ctx.ellipse(x - 35, y - 15 + breathe, 22, 16, -0.2, 0, Math.PI * 2)
    ctx.fill()

    // Jaw
    ctx.fillStyle = colors.secondary
    ctx.beginPath()
    ctx.ellipse(x - 40, y - 6 + breathe, 16, 8, -0.1, 0, Math.PI * 2)
    ctx.fill()

    // Snout
    ctx.fillStyle = colors.outline
    ctx.beginPath()
    ctx.moveTo(x - 52, y - 18 + breathe)
    ctx.lineTo(x - 68, y - 12 + breathe)
    ctx.lineTo(x - 52, y - 6 + breathe)
    ctx.closePath()
    ctx.fill()

    // Fangs
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.moveTo(x - 54, y - 8 + breathe)
    ctx.lineTo(x - 56, y - 2 + breathe)
    ctx.lineTo(x - 52, y - 6 + breathe)
    ctx.closePath()
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(x - 60, y - 8 + breathe)
    ctx.lineTo(x - 62, y - 2 + breathe)
    ctx.lineTo(x - 58, y - 6 + breathe)
    ctx.closePath()
    ctx.fill()

    // Crest/fins on head
    ctx.fillStyle = colors.outline
    ctx.beginPath()
    ctx.moveTo(x - 30, y - 25 + breathe)
    ctx.lineTo(x - 25, y - 40 + breathe)
    ctx.lineTo(x - 18, y - 25 + breathe)
    ctx.closePath()
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(x - 38, y - 22 + breathe)
    ctx.lineTo(x - 35, y - 35 + breathe)
    ctx.lineTo(x - 28, y - 22 + breathe)
    ctx.closePath()
    ctx.fill()

    // Tail fin
    ctx.fillStyle = colors.outline
    ctx.beginPath()
    ctx.moveTo(x + 30, y + 20)
    ctx.lineTo(x + 42, y + 12)
    ctx.lineTo(x + 45, y + 25)
    ctx.lineTo(x + 35, y + 28)
    ctx.closePath()
    ctx.fill()

    // Eyes
    ctx.fillStyle = '#00ffff'
    ctx.beginPath()
    ctx.arc(x - 42, y - 20 + breathe, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#000000'
    ctx.beginPath()
    ctx.arc(x - 42, y - 20 + breathe, 2, 0, Math.PI * 2)
    ctx.fill()

    // Water spray particles
    if (animationFrame % 24 < 12) {
      ctx.fillStyle = '#4ac8ff'
      ctx.globalAlpha = 0.6
      for (let i = 0; i < 4; i++) {
        const px = x - 72 - i * 6 + Math.random() * 4
        const py = y - 12 + breathe + Math.random() * 8 - 4
        ctx.beginPath()
        ctx.arc(px, py, 2 + Math.random() * 3, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1.0
    }
  }

  ctx.restore()
}

/**
 * Draw a companion sprite (Storm or Silver)
 */
export function drawCompanionSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  companionId: 'storm' | 'silver',
  animationFrame: number = 0
): void {
  const colors = CHARACTER_COLORS[companionId]

  ctx.save()

  if (companionId === 'storm') {
    // Horse shape
    const gallop = Math.sin(animationFrame * 0.2) * 3

    // Body
    ctx.fillStyle = colors.primary
    ctx.beginPath()
    ctx.ellipse(x, y, 25, 15, 0, 0, Math.PI * 2)
    ctx.fill()

    // Head
    ctx.fillStyle = colors.secondary
    ctx.beginPath()
    ctx.ellipse(x - 25, y - 10, 12, 8, -0.5, 0, Math.PI * 2)
    ctx.fill()

    // Legs
    ctx.fillStyle = colors.primary
    ctx.fillRect(x - 15, y + 10, 4, 15 + gallop)
    ctx.fillRect(x - 5, y + 10, 4, 15 - gallop)
    ctx.fillRect(x + 5, y + 10, 4, 15 + gallop)
    ctx.fillRect(x + 15, y + 10, 4, 15 - gallop)

    // Mane
    ctx.strokeStyle = '#3a2a1a'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(x - 20, y - 15)
    ctx.quadraticCurveTo(x - 10, y - 25, x, y - 15)
    ctx.stroke()
  } else {
    // Wolf shape
    const pant = Math.sin(animationFrame * 0.3) * 2

    // Body
    ctx.fillStyle = colors.primary
    ctx.beginPath()
    ctx.ellipse(x, y, 20, 12, 0, 0, Math.PI * 2)
    ctx.fill()

    // Head
    ctx.fillStyle = colors.secondary
    ctx.beginPath()
    ctx.ellipse(x - 18, y - 5, 10, 8, -0.3, 0, Math.PI * 2)
    ctx.fill()

    // Snout
    ctx.fillStyle = colors.primary
    ctx.beginPath()
    ctx.moveTo(x - 25, y - 8)
    ctx.lineTo(x - 35, y - 3 + pant)
    ctx.lineTo(x - 25, y + 2)
    ctx.closePath()
    ctx.fill()

    // Ears
    ctx.fillStyle = colors.secondary
    ctx.beginPath()
    ctx.moveTo(x - 22, y - 12)
    ctx.lineTo(x - 18, y - 22)
    ctx.lineTo(x - 14, y - 12)
    ctx.closePath()
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(x - 16, y - 12)
    ctx.lineTo(x - 12, y - 20)
    ctx.lineTo(x - 8, y - 12)
    ctx.closePath()
    ctx.fill()

    // Legs
    ctx.fillStyle = colors.primary
    const legMove = Math.sin(animationFrame * 0.25) * 3
    ctx.fillRect(x - 12, y + 8, 3, 12 + legMove)
    ctx.fillRect(x - 4, y + 8, 3, 12 - legMove)
    ctx.fillRect(x + 4, y + 8, 3, 12 + legMove)
    ctx.fillRect(x + 12, y + 8, 3, 12 - legMove)

    // Tail
    ctx.strokeStyle = colors.secondary
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(x + 18, y - 2)
    ctx.quadraticCurveTo(x + 28, y - 8, x + 32, y - 15 + pant)
    ctx.stroke()

    // Eye
    ctx.fillStyle = '#ffaa00'
    ctx.beginPath()
    ctx.arc(x - 22, y - 8, 2, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}

/**
 * Draw a damage number floating up
 */
export function drawDamageNumber(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  damage: number,
  isHeal: boolean = false,
  progress: number = 0 // 0 to 1
): void {
  ctx.save()

  const yOffset = progress * 30
  const alpha = 1 - progress

  ctx.globalAlpha = alpha
  ctx.font = 'bold 16px monospace'
  ctx.textAlign = 'center'

  // Outline
  ctx.fillStyle = '#000000'
  ctx.fillText(String(damage), x + 1, y - yOffset + 1)

  // Main color
  ctx.fillStyle = isHeal ? '#00ff00' : '#ff0000'
  ctx.fillText(String(damage), x, y - yOffset)

  ctx.restore()
}

/**
 * Draw a status effect icon
 */
export function drawStatusIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  statusType: string,
  size: number = 12
): void {
  ctx.save()

  const halfSize = size / 2

  switch (statusType) {
    case 'poison':
      ctx.fillStyle = '#00aa00'
      ctx.beginPath()
      ctx.arc(x, y, halfSize, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.font = `${size - 2}px monospace`
      ctx.textAlign = 'center'
      ctx.fillText('☠', x, y + 4)
      break

    case 'burn':
      ctx.fillStyle = '#ff4400'
      ctx.beginPath()
      ctx.moveTo(x, y - halfSize)
      ctx.lineTo(x + halfSize, y + halfSize)
      ctx.lineTo(x - halfSize, y + halfSize)
      ctx.closePath()
      ctx.fill()
      break

    case 'buff':
      ctx.fillStyle = '#00aaff'
      ctx.beginPath()
      ctx.moveTo(x, y - halfSize)
      ctx.lineTo(x + halfSize, y)
      ctx.lineTo(x, y + halfSize)
      ctx.lineTo(x - halfSize, y)
      ctx.closePath()
      ctx.fill()
      break

    case 'debuff':
      ctx.fillStyle = '#aa00aa'
      ctx.beginPath()
      ctx.moveTo(x, y + halfSize)
      ctx.lineTo(x + halfSize, y)
      ctx.lineTo(x, y - halfSize)
      ctx.lineTo(x - halfSize, y)
      ctx.closePath()
      ctx.fill()
      break

    default:
      ctx.fillStyle = '#888888'
      ctx.fillRect(x - halfSize, y - halfSize, size, size)
  }

  ctx.restore()
}
