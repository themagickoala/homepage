// ============================================
// Character Avatar Images
// ============================================
// Loads face art from the Beast Quest Wiki

const AVATAR_URLS: Record<string, string> = {
  tom: 'https://static.wikia.nocookie.net/beastquestbooks/images/2/2d/Wiki_About.jpeg/revision/latest/scale-to-width-down/80?cb=20171022141227',
  elenna: 'https://static.wikia.nocookie.net/beastquestbooks/images/6/6a/Archer.jpg/revision/latest/scale-to-width-down/80?cb=20210316172123',
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
    // Draw circular clipped avatar
    ctx.save()
    ctx.beginPath()
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()
    ctx.drawImage(img, x, y, size, size)
    ctx.restore()

    // Border
    ctx.strokeStyle = '#aaaaff'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2)
    ctx.stroke()
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

  // Background circle
  ctx.fillStyle = characterId === 'tom' ? '#4a7abc' : '#7a5a3a'
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()

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
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()

  ctx.restore()
}
