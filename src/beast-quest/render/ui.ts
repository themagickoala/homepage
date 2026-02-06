// ============================================
// UI Rendering Utilities
// ============================================
// Drawing functions for menus, HUD, and overlays

import { PartyMember, CombatEntity } from '../types'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './isometric'
import { drawAvatar } from '../data/avatars'

// UI Colors
export const UI_COLORS = {
  panelBg: 'rgba(20, 20, 40, 0.9)',
  panelBorder: '#4a4a6a',
  panelHighlight: '#6a6a8a',
  textPrimary: '#ffffff',
  textSecondary: '#aaaacc',
  textDisabled: '#666688',
  hpBar: '#22aa22',
  hpBarBg: '#442222',
  mpBar: '#2266dd',
  mpBarBg: '#222244',
  expBar: '#ddaa22',
  expBarBg: '#443322',
  selectionHighlight: 'rgba(100, 100, 200, 0.3)',
  selectionBorder: '#aaaaff',
}

// Standard font settings
export const FONTS = {
  title: 'bold 24px monospace',
  heading: 'bold 16px monospace',
  normal: '14px monospace',
  small: '12px monospace',
}

/**
 * Draw a panel background with border
 */
export function drawPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  selected: boolean = false
): void {
  ctx.save()

  // Background
  ctx.fillStyle = UI_COLORS.panelBg
  ctx.fillRect(x, y, width, height)

  // Border
  ctx.strokeStyle = selected ? UI_COLORS.selectionBorder : UI_COLORS.panelBorder
  ctx.lineWidth = selected ? 2 : 1
  ctx.strokeRect(x, y, width, height)

  // Highlight on top edge
  ctx.strokeStyle = UI_COLORS.panelHighlight
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(x + 1, y + 1)
  ctx.lineTo(x + width - 1, y + 1)
  ctx.stroke()

  ctx.restore()
}

/**
 * Draw a horizontal bar (HP, MP, EXP)
 */
export function drawBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  current: number,
  max: number,
  fillColor: string,
  bgColor: string
): void {
  ctx.save()

  // Background
  ctx.fillStyle = bgColor
  ctx.fillRect(x, y, width, height)

  // Fill
  const fillWidth = max > 0 ? (current / max) * width : 0
  ctx.fillStyle = fillColor
  ctx.fillRect(x, y, fillWidth, height)

  // Border
  ctx.strokeStyle = UI_COLORS.panelBorder
  ctx.lineWidth = 1
  ctx.strokeRect(x, y, width, height)

  ctx.restore()
}

/**
 * Draw character stats panel (used in combat and menus)
 */
export function drawCharacterStats(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  character: PartyMember | CombatEntity,
  showExp: boolean = false
): void {
  const panelWidth = 180
  const panelHeight = showExp ? 80 : 65

  drawPanel(ctx, x, y, panelWidth, panelHeight)

  ctx.save()
  ctx.textAlign = 'left'

  // Name
  ctx.fillStyle = UI_COLORS.textPrimary
  ctx.font = FONTS.heading
  ctx.fillText(character.name, x + 10, y + 20)

  // Level (if available)
  if ('level' in character.stats) {
    ctx.fillStyle = UI_COLORS.textSecondary
    ctx.font = FONTS.small
    ctx.fillText(`Lv.${character.stats.level}`, x + panelWidth - 40, y + 20)
  }

  // HP Bar
  ctx.fillStyle = UI_COLORS.textSecondary
  ctx.font = FONTS.small
  ctx.fillText('HP', x + 10, y + 38)
  drawBar(
    ctx,
    x + 30,
    y + 28,
    100,
    12,
    character.stats.currentHp,
    character.stats.maxHp,
    UI_COLORS.hpBar,
    UI_COLORS.hpBarBg
  )
  ctx.fillStyle = UI_COLORS.textPrimary
  ctx.fillText(
    `${character.stats.currentHp}/${character.stats.maxHp}`,
    x + 135,
    y + 38
  )

  // MP Bar
  ctx.fillStyle = UI_COLORS.textSecondary
  ctx.fillText('MP', x + 10, y + 55)
  drawBar(
    ctx,
    x + 30,
    y + 45,
    100,
    12,
    character.stats.currentMp,
    character.stats.maxMp,
    UI_COLORS.mpBar,
    UI_COLORS.mpBarBg
  )
  ctx.fillStyle = UI_COLORS.textPrimary
  ctx.fillText(
    `${character.stats.currentMp}/${character.stats.maxMp}`,
    x + 135,
    y + 55
  )

  // EXP Bar (optional)
  if (showExp && 'experienceToNextLevel' in character.stats) {
    ctx.fillStyle = UI_COLORS.textSecondary
    ctx.fillText('EXP', x + 10, y + 72)
    drawBar(
      ctx,
      x + 30,
      y + 62,
      100,
      10,
      character.stats.experience,
      character.stats.experienceToNextLevel,
      UI_COLORS.expBar,
      UI_COLORS.expBarBg
    )
  }

  ctx.restore()
}

/**
 * Draw a menu with selectable options
 */
export function drawMenu(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  options: { label: string; enabled: boolean }[],
  selectedIndex: number
): void {
  const itemHeight = 24
  const padding = 10

  // Set font before measuring text width
  ctx.save()
  ctx.font = FONTS.normal
  const maxWidth = Math.max(...options.map((o) => ctx.measureText(o.label).width)) + padding * 2 + 20
  const panelWidth = Math.max(120, maxWidth)
  const panelHeight = options.length * itemHeight + padding * 2

  drawPanel(ctx, x, y, panelWidth, panelHeight)

  ctx.textAlign = 'left'

  options.forEach((option, index) => {
    const itemY = y + padding + index * itemHeight + 16

    // Selection highlight
    if (index === selectedIndex) {
      ctx.fillStyle = UI_COLORS.selectionHighlight
      ctx.fillRect(x + 2, y + padding + index * itemHeight, panelWidth - 4, itemHeight)

      // Selection cursor
      ctx.fillStyle = UI_COLORS.selectionBorder
      ctx.fillText('▶', x + 8, itemY)
    }

    // Option text
    ctx.fillStyle = option.enabled
      ? index === selectedIndex
        ? UI_COLORS.textPrimary
        : UI_COLORS.textSecondary
      : UI_COLORS.textDisabled
    ctx.fillText(option.label, x + 24, itemY)
  })

  ctx.restore()
}

/**
 * Draw battle command menu
 */
export function drawBattleMenu(
  ctx: CanvasRenderingContext2D,
  selectedIndex: number,
  canFlee: boolean = true
): void {
  const commands = [
    { label: 'Attack', enabled: true },
    { label: 'Skills', enabled: true },
    { label: 'Items', enabled: true },
    { label: 'Defend', enabled: true },
    { label: 'Flee', enabled: canFlee },
  ]

  drawMenu(ctx, 20, CANVAS_HEIGHT - 150, commands, selectedIndex)
}

/**
 * Draw the exploration HUD
 */
export function drawExplorationHUD(
  ctx: CanvasRenderingContext2D,
  party: PartyMember[],
  locationName: string
): void {
  ctx.save()

  // Location name at top
  ctx.fillStyle = UI_COLORS.panelBg
  ctx.fillRect(0, 0, CANVAS_WIDTH, 30)
  ctx.strokeStyle = UI_COLORS.panelBorder
  ctx.strokeRect(0, 0, CANVAS_WIDTH, 30)

  ctx.fillStyle = UI_COLORS.textPrimary
  ctx.font = FONTS.heading
  ctx.textAlign = 'center'
  ctx.fillText(locationName, CANVAS_WIDTH / 2, 20)

  // Party stats at bottom
  const avatarSize = 48
  const statsWidth = 160
  const panelWidth = avatarSize + statsWidth
  const statsHeight = 50
  const startX = 10
  const startY = CANVAS_HEIGHT - statsHeight - 10

  party.forEach((member, index) => {
    const x = startX + index * (panelWidth + 10)
    drawAvatar(ctx, x, startY + (statsHeight - avatarSize) / 2, avatarSize, member.id)

    const textX = x + avatarSize
    drawPanel(ctx, textX, startY, statsWidth, statsHeight)

    ctx.fillStyle = UI_COLORS.textPrimary
    ctx.font = FONTS.small
    ctx.textAlign = 'left'
    ctx.fillText(member.name, textX + 8, startY + 16)

    // Mini HP bar
    drawBar(
      ctx,
      textX + 8,
      startY + 22,
      statsWidth - 16,
      8,
      member.stats.currentHp,
      member.stats.maxHp,
      UI_COLORS.hpBar,
      UI_COLORS.hpBarBg
    )

    // Mini MP bar
    drawBar(
      ctx,
      textX + 8,
      startY + 34,
      statsWidth - 16,
      8,
      member.stats.currentMp,
      member.stats.maxMp,
      UI_COLORS.mpBar,
      UI_COLORS.mpBarBg
    )
  })

  ctx.restore()
}

/**
 * Draw dialogue box
 */
export function drawDialogueBox(
  ctx: CanvasRenderingContext2D,
  speaker: string,
  text: string,
  showContinuePrompt: boolean = true
): void {
  const boxHeight = 100
  const boxY = CANVAS_HEIGHT - boxHeight - 20
  const padding = 15

  // Main box
  drawPanel(ctx, 20, boxY, CANVAS_WIDTH - 40, boxHeight)

  ctx.save()
  ctx.textAlign = 'left'

  // Speaker name
  if (speaker) {
    ctx.fillStyle = UI_COLORS.panelBg
    ctx.fillRect(30, boxY - 12, ctx.measureText(speaker).width + 20, 24)
    ctx.strokeStyle = UI_COLORS.panelBorder
    ctx.strokeRect(30, boxY - 12, ctx.measureText(speaker).width + 20, 24)

    ctx.fillStyle = UI_COLORS.textPrimary
    ctx.font = FONTS.heading
    ctx.fillText(speaker, 40, boxY + 5)
  }

  // Dialogue text (with word wrap)
  ctx.fillStyle = UI_COLORS.textPrimary
  ctx.font = FONTS.normal
  const maxWidth = CANVAS_WIDTH - 80
  const words = text.split(' ')
  let line = ''
  let y = boxY + padding + 20

  for (const word of words) {
    const testLine = line + word + ' '
    if (ctx.measureText(testLine).width > maxWidth) {
      ctx.fillText(line, 35, y)
      line = word + ' '
      y += 20
    } else {
      line = testLine
    }
  }
  ctx.fillText(line, 35, y)

  // Continue prompt
  if (showContinuePrompt) {
    ctx.fillStyle = UI_COLORS.textSecondary
    ctx.font = FONTS.small
    ctx.textAlign = 'right'
    ctx.fillText('Press Enter to continue ▼', CANVAS_WIDTH - 40, boxY + boxHeight - 10)
  }

  ctx.restore()
}

/**
 * Draw battle log
 */
export function drawBattleLog(
  ctx: CanvasRenderingContext2D,
  messages: { message: string; type: string }[],
  maxMessages: number = 6
): void {
  const logX = CANVAS_WIDTH - 340
  const logY = 10
  const logWidth = 330
  const lineHeight = 18
  const visibleMessages = messages.slice(-maxMessages)
  const logHeight = lineHeight * maxMessages + 16

  drawPanel(ctx, logX, logY, logWidth, logHeight)

  ctx.save()
  ctx.font = FONTS.small
  ctx.textAlign = 'left'

  visibleMessages.forEach((entry, index) => {
    const y = logY + 16 + index * lineHeight

    switch (entry.type) {
      case 'damage':
        ctx.fillStyle = '#ff6666'
        break
      case 'heal':
        ctx.fillStyle = '#66ff66'
        break
      case 'status':
        ctx.fillStyle = '#ffff66'
        break
      default:
        ctx.fillStyle = UI_COLORS.textSecondary
    }

    // Truncate long messages
    let msg = entry.message
    while (ctx.measureText(msg).width > logWidth - 20 && msg.length > 0) {
      msg = msg.slice(0, -1)
    }
    if (msg !== entry.message) msg += '...'

    ctx.fillText(msg, logX + 10, y)
  })

  ctx.restore()
}

/**
 * Draw screen overlay (for transitions, menus)
 */
export function drawOverlay(
  ctx: CanvasRenderingContext2D,
  alpha: number = 0.5,
  color: string = '#000000'
): void {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = color
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  ctx.restore()
}

/**
 * Draw centered text (for titles, game over, etc.)
 */
export function drawCenteredText(
  ctx: CanvasRenderingContext2D,
  text: string,
  y: number,
  font: string = FONTS.title,
  color: string = UI_COLORS.textPrimary
): void {
  ctx.save()
  ctx.font = font
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.fillText(text, CANVAS_WIDTH / 2, y)
  ctx.restore()
}

/**
 * Draw control hints at bottom of screen
 */
export function drawControlHints(
  ctx: CanvasRenderingContext2D,
  hints: string[]
): void {
  ctx.save()

  const hintText = hints.join('  |  ')
  ctx.font = FONTS.small
  ctx.fillStyle = UI_COLORS.textSecondary
  ctx.textAlign = 'center'
  ctx.fillText(hintText, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 5)

  ctx.restore()
}
