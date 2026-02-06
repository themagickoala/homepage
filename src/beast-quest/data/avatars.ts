// ============================================
// Character Avatar Images
// ============================================

import tomAvatar from '../assets/tom.png'
import elennaAvatar from '../assets/elenna.png'

const AVATAR_URLS: Record<string, string> = {
  tom: tomAvatar,
  elenna: elennaAvatar,
}

const loadedAvatars: Record<string, HTMLImageElement> = {}
const loadingState: Record<string, 'loading' | 'loaded' | 'failed'> = {}

/**
 * Preload all avatar images. Call once at startup.
 */
export function preloadAvatars(): void {
  for (const [id, url] of Object.entries(AVATAR_URLS)) {
    if (loadingState[id]) continue
    loadingState[id] = 'loading'

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      loadedAvatars[id] = img
      loadingState[id] = 'loaded'
    }
    img.onerror = () => {
      loadingState[id] = 'failed'
    }
    img.src = url
  }
}

/**
 * Get a loaded avatar image, or null if not yet loaded / failed.
 */
export function getAvatar(characterId: string): HTMLImageElement | null {
  return loadedAvatars[characterId] || null
}

/**
 * Draw a character avatar on canvas. Falls back to a procedural icon if the image isn't loaded.
 */
export function drawAvatar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  characterId: string
): void {
  const img = getAvatar(characterId)

  if (img) {
    // Draw square avatar
    ctx.drawImage(img, x, y, size, size)

    // Border
    ctx.strokeStyle = '#aaaaff'
    ctx.lineWidth = 2
    ctx.strokeRect(x, y, size, size)
  } else {
    // Fallback: procedural avatar
    drawFallbackAvatar(ctx, x, y, size, characterId)
  }
}

function drawFallbackAvatar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  characterId: string
): void {
  ctx.save()
  const cx = x + size / 2
  const cy = y + size / 2
  const r = size / 2

  // Background square
  ctx.fillStyle = characterId === 'tom' ? '#4a7abc' : '#7a5a3a'
  ctx.fillRect(x, y, size, size)

  // Face
  ctx.fillStyle = characterId === 'tom' ? '#e8c8a8' : '#e8d0b8'
  ctx.beginPath()
  ctx.arc(cx, cy - r * 0.05, r * 0.55, 0, Math.PI * 2)
  ctx.fill()

  // Hair
  ctx.fillStyle = characterId === 'tom' ? '#5a4a3a' : '#8a5a3a'
  ctx.beginPath()
  ctx.arc(cx, cy - r * 0.25, r * 0.45, Math.PI, 0)
  ctx.fill()

  // Initial letter
  ctx.fillStyle = '#ffffff'
  ctx.font = `bold ${Math.floor(size * 0.3)}px monospace`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(characterId === 'tom' ? 'T' : 'E', cx, cy + r * 0.35)

  // Border
  ctx.strokeStyle = '#aaaaff'
  ctx.lineWidth = 2
  ctx.strokeRect(x, y, size, size)

  ctx.restore()
}
