// ============================================
// Dungeon Exploration Component
// ============================================
// Handles isometric dungeon rendering and movement

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ExplorationState,
  IsoPosition,
  Direction,
  DungeonRoom,
  MapEntity,
} from '../types'
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  TILE_WIDTH,
  TILE_HEIGHT,
  isoToScreen,
  getVisibleTiles,
  drawIsometricTile,
  drawIsometricCube,
} from '../render/isometric'
import { TILE_COLORS, getTileHeight, isWalkable } from './tiles'
import { drawCharacterSprite } from '../render/sprites'
import { drawExplorationHUD, drawControlHints } from '../render/ui'
import { getRoomFromFloor, getEncounterZone } from '../data/floor-registry'
import { canInteract, DUNGEON_PUZZLES, checkPuzzleSolved, getPuzzleHint } from './puzzles'
import { getRandomEncounter } from '../combat/enemies'

interface DungeonProps {
  explorationState: ExplorationState
  party: { id: string; name: string; stats: { currentHp: number; maxHp: number; currentMp: number; maxMp: number } }[]
  onMove: (newState: ExplorationState) => void
  onEncounter: (enemyIds: string[]) => void
  onInteract: (entity: MapEntity) => void
  onRoomChange: (roomId: string, position: IsoPosition) => void
}

// Movement animation duration in milliseconds
const MOVE_DURATION = 150

export function Dungeon({
  explorationState,
  party,
  onMove,
  onEncounter,
  onInteract,
  onRoomChange,
}: DungeonProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [animationFrame, setAnimationFrame] = useState(0)
  const [isMoving, setIsMoving] = useState(false)
  const [currentRoom, setCurrentRoom] = useState<DungeonRoom | null>(null)
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null)

  // Movement animation state
  const [visualPosition, setVisualPosition] = useState<{ col: number; row: number }>(
    explorationState.playerPosition
  )
  const moveStartTime = useRef<number | null>(null)
  const moveStartPos = useRef<IsoPosition | null>(null)
  const moveEndPos = useRef<IsoPosition | null>(null)

  // Load current room
  useEffect(() => {
    const room = getRoomFromFloor(explorationState.currentFloorId, explorationState.currentRoomId)
    setCurrentRoom(room || null)
    // Reset visual position immediately on room change (no animation)
    setVisualPosition(explorationState.playerPosition)
    moveStartTime.current = null
    moveStartPos.current = null
    moveEndPos.current = null
  }, [explorationState.currentFloorId, explorationState.currentRoomId])

  // Sync visual position when player position changes outside of movement
  // (e.g., after returning from combat)
  useEffect(() => {
    if (!moveStartTime.current) {
      setVisualPosition(explorationState.playerPosition)
    }
  }, [explorationState.playerPosition])

  // Animation loop
  useEffect(() => {
    let frameId: number
    const animate = (timestamp: number) => {
      setAnimationFrame((f) => f + 1)

      // Update movement animation
      if (moveStartTime.current !== null && moveStartPos.current && moveEndPos.current) {
        const elapsed = timestamp - moveStartTime.current
        const progress = Math.min(1, elapsed / MOVE_DURATION)

        // Ease out cubic for smooth deceleration
        const eased = 1 - Math.pow(1 - progress, 3)

        // Animation complete - snap to exact end position
        if (progress >= 1) {
          setVisualPosition({ col: moveEndPos.current.col, row: moveEndPos.current.row })
          moveStartTime.current = null
          moveStartPos.current = null
          moveEndPos.current = null
        } else {
          // Interpolate position during animation
          const newCol = moveStartPos.current.col + (moveEndPos.current.col - moveStartPos.current.col) * eased
          const newRow = moveStartPos.current.row + (moveEndPos.current.row - moveStartPos.current.row) * eased
          setVisualPosition({ col: newCol, row: newRow })
        }
      }

      frameId = requestAnimationFrame(animate)
    }
    frameId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameId)
  }, [])

  // Check for random encounter
  const checkEncounter = useCallback(
    (position: IsoPosition) => {
      if (!currentRoom) return

      const zone = getEncounterZone(currentRoom, position)
      if (!zone) return

      // Roll for encounter
      if (Math.random() < zone.encounterRate) {
        // Get zone ID for encounter table
        const zoneMap: Record<string, string> = {
          // Ferno's dungeon
          entrance: 'cave_entrance',
          main_cavern: 'cave_depths',
          puzzle_room: 'cave_depths',
          volcanic_passage: 'volcanic_passage',
          ferno_lair: 'volcanic_passage',
          // Sepron's dungeon
          grotto: 'coastal_grotto',
          tidal_cavern: 'tidal_cavern',
          submerged_passage: 'submerged_passage',
          coral_tunnel: 'coral_tunnel',
          sepron_depths: 'coral_tunnel',
        }
        const zoneId = zoneMap[currentRoom.id] || 'cave_entrance'

        const enemies = getRandomEncounter(zoneId)
        onEncounter(enemies)
      }
    },
    [currentRoom, onEncounter, explorationState.currentFloorId]
  )

  // Handle movement
  const handleMove = useCallback(
    (direction: Direction) => {
      if (isMoving || !currentRoom) return

      const { col, row } = explorationState.playerPosition
      let newCol = col
      let newRow = row

      switch (direction) {
        case 'north':
          newRow--
          break
        case 'south':
          newRow++
          break
        case 'east':
          newCol++
          break
        case 'west':
          newCol--
          break
      }

      // Check bounds
      if (newCol < 0 || newRow < 0 || newRow >= currentRoom.height || newCol >= currentRoom.width) {
        // Check for room connections
        const connection = currentRoom.connections.find((c) => c.direction === direction)
        if (connection) {
          // Check if connection requires a puzzle to be solved
          if (connection.requiredPuzzle) {
            const puzzle = DUNGEON_PUZZLES[connection.requiredPuzzle]
            if (puzzle && !checkPuzzleSolved(puzzle, explorationState.activatedSwitches)) {
              // Show blocked message
              setBlockedMessage(getPuzzleHint(connection.requiredPuzzle))
              setTimeout(() => setBlockedMessage(null), 3000)
              return
            }
          }
          onRoomChange(connection.targetRoomId, connection.targetPosition)
        }
        return
      }

      // Check walkable
      const targetTile = currentRoom.tiles[newRow][newCol]
      if (!isWalkable(targetTile)) return

      // Check for entities blocking the path
      const blockingEntity = currentRoom.entities.find(
        (e) => e.position.col === newCol && e.position.row === newRow && !['trigger'].includes(e.type)
      )
      if (blockingEntity && blockingEntity.type !== 'trigger') return

      // Start movement animation
      setIsMoving(true)
      moveStartTime.current = performance.now()
      moveStartPos.current = { col, row }
      moveEndPos.current = { col: newCol, row: newRow }

      const newState: ExplorationState = {
        ...explorationState,
        playerPosition: { col: newCol, row: newRow },
        playerDirection: direction,
        stepsSinceLastEncounter: explorationState.stepsSinceLastEncounter + 1,
        stepsForMpRecovery: explorationState.stepsForMpRecovery + 1,
      }

      onMove(newState)

      // Trigger healing pool when stepping onto it
      if (targetTile === 'healing_pool') {
        onInteract({
          id: 'healing_pool',
          type: 'trigger',
          position: { col: newCol, row: newRow },
          sprite: 'healing_pool',
          direction: 'south',
          interactable: true,
          metadata: { action: 'heal' },
        })
      }

      // Check for encounter after movement animation completes
      setTimeout(() => {
        setIsMoving(false)
        checkEncounter({ col: newCol, row: newRow })
      }, MOVE_DURATION)
    },
    [explorationState, currentRoom, isMoving, onMove, checkEncounter, onRoomChange]
  )

  // Handle interaction
  const handleInteraction = useCallback(() => {
    if (!currentRoom || isMoving) return

    const { playerPosition, playerDirection } = explorationState

    // Ensure position values are integers (defensive against any floating point issues)
    const col = Math.round(playerPosition.col)
    const row = Math.round(playerPosition.row)

    // Get position in front of player
    let targetCol = col
    let targetRow = row

    switch (playerDirection) {
      case 'north':
        targetRow--
        break
      case 'south':
        targetRow++
        break
      case 'east':
        targetCol++
        break
      case 'west':
        targetCol--
        break
    }

    // Find entity at target position
    const entity = currentRoom.entities.find(
      (e) => e.position.col === targetCol && e.position.row === targetRow
    )

    // Use the rounded position for the adjacency check
    const roundedPosition = { col, row }
    if (entity && canInteract(entity, roundedPosition, explorationState)) {
      onInteract(entity)
    }

    // Check for tile interactions (healing pool, stairs)
    if (targetRow >= 0 && targetRow < currentRoom.height && targetCol >= 0 && targetCol < currentRoom.width) {
      const tile = currentRoom.tiles[targetRow][targetCol]
      if (tile === 'healing_pool') {
        // Trigger healing
        onInteract({
          id: 'healing_pool',
          type: 'trigger',
          position: { col: targetCol, row: targetRow },
          sprite: 'healing_pool',
          direction: 'south',
          interactable: true,
          metadata: { action: 'heal' },
        })
      } else if (tile === 'stairs_up' || tile === 'stairs_down') {
        // Find room connection
        const connection = currentRoom.connections.find((c) => {
          const connDir = tile === 'stairs_up' ? 'north' : 'south' // Simplified
          return c.direction === connDir
        })
        if (connection) {
          onRoomChange(connection.targetRoomId, connection.targetPosition)
        }
      }
    }
  }, [currentRoom, explorationState, onInteract, onRoomChange, isMoving])

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          handleMove('north')
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          handleMove('south')
          break
        case 'ArrowLeft':
        case 'a':
        case 'A':
          handleMove('west')
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          handleMove('east')
          break
        case 'Enter':
        case ' ':
          handleInteraction()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleMove, handleInteraction])

  // Render dungeon
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !currentRoom) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas with dark background
    ctx.fillStyle = '#0a0a1a'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Center the room on the canvas
    const midCol = currentRoom.width / 2
    const midRow = currentRoom.height / 2
    const roomCenterX = CANVAS_WIDTH / 2 + (midCol - midRow) * (TILE_WIDTH / 2)
    const roomCenterY = 100 + (midCol + midRow) * (TILE_HEIGHT / 2)
    const offsetX = CANVAS_WIDTH / 2 - roomCenterX
    const offsetY = CANVAS_HEIGHT / 2 - roomCenterY
    ctx.save()
    ctx.translate(offsetX, offsetY)

    // Get visible tiles
    const visibleTiles = getVisibleTiles(currentRoom.width, currentRoom.height)
    // Use visual position for depth calculation during animation
    const playerDepth = visualPosition.row + visualPosition.col
    let playerDrawn = false
    const drawnEntities = new Set<string>()

    // Helper to draw an entity
    const drawEntity = (entity: MapEntity) => {
      if (drawnEntities.has(entity.id)) return
      drawnEntities.add(entity.id)

      const screenPos = isoToScreen(entity.position)

      if (entity.type === 'chest') {
        const isOpened = explorationState.openedChests.includes(entity.id)
        // Draw chest body
        ctx.fillStyle = isOpened ? '#5a4a3a' : '#8B4513'
        ctx.fillRect(screenPos.x - 12, screenPos.y - 12, 24, 14)
        // Draw chest lid
        ctx.fillStyle = isOpened ? '#4a3a2a' : '#A0522D'
        ctx.fillRect(screenPos.x - 14, screenPos.y - 18, 28, 6)
        // Draw gold trim
        ctx.fillStyle = '#FFD700'
        ctx.fillRect(screenPos.x - 3, screenPos.y - 10, 6, 4)
        if (isOpened) {
          // Draw open lid
          ctx.fillStyle = '#A0522D'
          ctx.fillRect(screenPos.x - 14, screenPos.y - 28, 28, 10)
        }
      } else if (entity.type === 'switch') {
        const isActive = explorationState.activatedSwitches.includes(entity.id)
        ctx.fillStyle = isActive ? '#00ff00' : '#666666'
        ctx.beginPath()
        ctx.arc(screenPos.x, screenPos.y - 5, 8, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#333333'
        ctx.lineWidth = 2
        ctx.stroke()
      } else if (entity.type === 'npc') {
        ctx.fillStyle = '#aa8866'
        ctx.beginPath()
        ctx.arc(screenPos.x, screenPos.y - 12, 8, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#664422'
        ctx.fillRect(screenPos.x - 6, screenPos.y - 4, 12, 16)
      } else if (entity.type === 'enemy') {
        ctx.fillStyle = '#ff4444'
        ctx.beginPath()
        ctx.moveTo(screenPos.x, screenPos.y - 30)
        ctx.lineTo(screenPos.x - 15, screenPos.y)
        ctx.lineTo(screenPos.x + 15, screenPos.y)
        ctx.closePath()
        ctx.fill()
        const pulse = Math.sin(animationFrame * 0.1) * 0.3 + 0.7
        ctx.globalAlpha = pulse
        ctx.strokeStyle = '#ffaa00'
        ctx.lineWidth = 3
        ctx.stroke()
        ctx.globalAlpha = 1
      }

      // Draw interaction indicator if player can interact with this entity
      const roundedPlayerPos = {
        col: Math.round(visualPosition.col),
        row: Math.round(visualPosition.row),
      }
      if (canInteract(entity, roundedPlayerPos, explorationState)) {
        const indicatorPulse = 0.7 + Math.sin(animationFrame * 0.15) * 0.3
        const indicatorBob = Math.sin(animationFrame * 0.1) * 3

        // Draw floating "!" indicator
        ctx.globalAlpha = indicatorPulse
        ctx.fillStyle = '#ffcc00'
        ctx.beginPath()
        ctx.arc(screenPos.x, screenPos.y - 35 + indicatorBob, 10, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#aa8800'
        ctx.lineWidth = 2
        ctx.stroke()

        // Draw "!" text
        ctx.fillStyle = '#000000'
        ctx.font = 'bold 14px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('!', screenPos.x, screenPos.y - 35 + indicatorBob)
        ctx.globalAlpha = 1
      }
    }

    // First pass: Draw all floor tiles
    for (const tilePos of visibleTiles) {
      const tileType = currentRoom.tiles[tilePos.row]?.[tilePos.col]
      if (!tileType) continue

      const colors = TILE_COLORS[tileType]
      const height = getTileHeight(tileType)

      if (height === 0) {
        drawIsometricTile(ctx, tilePos, colors.top, colors.left)

        // Door directional indicator
        if (tileType === 'door') {
          // Determine direction from door position on room edge
          let arrowDx = 0
          let arrowDy = 0
          if (tilePos.col === 0) {
            // West edge → arrow points left (iso west)
            arrowDx = -TILE_WIDTH / 2
            arrowDy = 0
          } else if (tilePos.col === currentRoom.width - 1) {
            // East edge → arrow points right (iso east)
            arrowDx = TILE_WIDTH / 2
            arrowDy = 0
          } else if (tilePos.row === 0) {
            // North edge → arrow points up (iso north)
            arrowDx = 0
            arrowDy = -TILE_HEIGHT / 2
          } else {
            // South edge → arrow points down (iso south)
            arrowDx = 0
            arrowDy = TILE_HEIGHT / 2
          }

          const center = isoToScreen(tilePos)
          const pulse = 0.5 + Math.sin(animationFrame * 0.08) * 0.3

          ctx.save()
          ctx.globalAlpha = pulse

          // Normalize direction and draw chevron arrows
          const len = Math.sqrt(arrowDx * arrowDx + arrowDy * arrowDy)
          const nx = arrowDx / len
          const ny = arrowDy / len
          // Perpendicular
          const px = -ny
          const py = nx

          const arrowSize = 6
          const spacing = 5

          // Draw two chevrons pointing in the direction
          for (let i = -1; i <= 1; i += 2) {
            const ox = nx * spacing * i
            const oy = ny * spacing * i
            ctx.beginPath()
            ctx.moveTo(
              center.x + ox - nx * arrowSize + px * arrowSize,
              center.y + oy - ny * arrowSize + py * arrowSize
            )
            ctx.lineTo(center.x + ox + nx * arrowSize, center.y + oy + ny * arrowSize)
            ctx.lineTo(
              center.x + ox - nx * arrowSize - px * arrowSize,
              center.y + oy - ny * arrowSize - py * arrowSize
            )
            ctx.strokeStyle = '#ccaa66'
            ctx.lineWidth = 2
            ctx.stroke()
          }

          ctx.restore()
        }

        // Special tile effects
        if (tileType === 'lava') {
          // Bubbling effect — slow, viscous lava bubbles seeded by tile position
          const center = isoToScreen(tilePos)
          const seed = tilePos.col * 7 + tilePos.row * 13
          for (let b = 0; b < 2; b++) {
            const bubbleSeed = seed + b * 37
            // Long cycle for slow, heavy bubbling
            const period = 300 + (bubbleSeed % 120)
            const phase = (animationFrame + bubbleSeed * 3) % period
            const t = phase / period // 0..1 through the bubble lifecycle

            if (t > 0.7) continue // long gap between bubbles

            // Position: offset within the tile diamond, slow upward drift
            const offsetX = ((bubbleSeed * 13) % 17 - 8) * 1.2
            const offsetY = ((bubbleSeed * 7) % 13 - 6) * 0.8
            const riseAmount = t * 4
            const bx = center.x + offsetX
            const by = center.y + offsetY - riseAmount

            // Size: slowly swells then pops
            const growT = t < 0.5 ? t / 0.5 : 1 - (t - 0.5) / 0.2
            const radius = Math.max(0.5, 1.5 + growT * 2.5)

            // Fade out as it pops
            const alpha = t < 0.55 ? 0.5 : 0.5 * (1 - (t - 0.55) / 0.15)

            ctx.globalAlpha = Math.max(0, alpha)
            ctx.fillStyle = '#cc8822'
            ctx.beginPath()
            ctx.arc(bx, by, radius, 0, Math.PI * 2)
            ctx.fill()

            // Bright highlight on the bubble
            if (radius > 1.5) {
              ctx.fillStyle = '#dd9933'
              ctx.beginPath()
              ctx.arc(bx - radius * 0.3, by - radius * 0.3, radius * 0.35, 0, Math.PI * 2)
              ctx.fill()
            }
          }
          ctx.globalAlpha = 1
        }
        if (tileType === 'healing_pool') {
          const glowIntensity = 0.5 + Math.sin(animationFrame * 0.08) * 0.3
          ctx.globalAlpha = glowIntensity
          const screenPos = isoToScreen(tilePos)
          ctx.fillStyle = '#6aaa8a'
          ctx.beginPath()
          ctx.arc(screenPos.x, screenPos.y, 10, 0, Math.PI * 2)
          ctx.fill()
          ctx.globalAlpha = 1
        }
      }
    }

    // Second pass: Draw walls, entities, and player in correct z-order
    for (const tilePos of visibleTiles) {
      const tileType = currentRoom.tiles[tilePos.row]?.[tilePos.col]
      if (!tileType) continue

      const tileDepth = tilePos.row + tilePos.col
      const colors = TILE_COLORS[tileType]
      const height = getTileHeight(tileType)

      if (height > 0) {
        // Draw player before this wall if player is behind it
        if (!playerDrawn && playerDepth <= tileDepth) {
          drawCharacterSprite(
            ctx,
            visualPosition,
            'tom',
            explorationState.playerDirection,
            isMoving,
            animationFrame
          )
          playerDrawn = true
        }

        // Draw entities that should appear before this wall
        for (const entity of currentRoom.entities) {
          const entityDepth = entity.position.row + entity.position.col
          if (entityDepth <= tileDepth) {
            drawEntity(entity)
          }
        }

        // Draw the elevated tile
        drawIsometricCube(ctx, tilePos, height, colors.top, colors.left, colors.right)
      }
    }

    // Draw any remaining entities that are in front of all walls
    for (const entity of currentRoom.entities) {
      drawEntity(entity)
    }

    // Draw player if not yet drawn (player is in front of all walls)
    if (!playerDrawn) {
      drawCharacterSprite(
        ctx,
        visualPosition,
        'tom',
        explorationState.playerDirection,
        isMoving,
        animationFrame
      )
    }

    // Restore transform before drawing screen-space UI
    ctx.restore()

    // Draw HUD
    drawExplorationHUD(ctx, party as any, currentRoom.name)

    // Draw control hints
    drawControlHints(ctx, ['Arrow Keys: Move', 'Enter: Interact', 'Esc: Menu'])

    // Draw blocked message if present
    if (blockedMessage) {
      ctx.save()
      // Draw message box
      const boxWidth = 400
      const boxHeight = 60
      const boxX = (CANVAS_WIDTH - boxWidth) / 2
      const boxY = CANVAS_HEIGHT / 2 - boxHeight / 2

      // Background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
      ctx.fillRect(boxX, boxY, boxWidth, boxHeight)

      // Border
      ctx.strokeStyle = '#aa6622'
      ctx.lineWidth = 3
      ctx.strokeRect(boxX, boxY, boxWidth, boxHeight)

      // Text
      ctx.fillStyle = '#ffcc88'
      ctx.font = 'bold 16px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(blockedMessage, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
      ctx.restore()
    }
  }, [currentRoom, explorationState, party, animationFrame, isMoving, blockedMessage, visualPosition])

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      style={{ display: 'block', margin: '0 auto' }}
    />
  )
}
