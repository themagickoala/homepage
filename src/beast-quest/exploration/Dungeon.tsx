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
  isoToScreen,
  getVisibleTiles,
  drawIsometricTile,
  drawIsometricCube,
} from '../render/isometric'
import { TILE_COLORS, getTileHeight, isWalkable } from './tiles'
import { drawCharacterSprite } from '../render/sprites'
import { drawExplorationHUD, drawControlHints } from '../render/ui'
import { getRoom, getEncounterZone } from '../data/ferno-dungeon'
import { canInteract } from './puzzles'
import { getRandomEncounter } from '../combat/enemies'

interface DungeonProps {
  explorationState: ExplorationState
  party: { id: string; name: string; stats: { currentHp: number; maxHp: number; currentMp: number; maxMp: number } }[]
  onMove: (newState: ExplorationState) => void
  onEncounter: (enemyIds: string[]) => void
  onInteract: (entity: MapEntity) => void
  onRoomChange: (roomId: string, position: IsoPosition) => void
}

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

  // Load current room
  useEffect(() => {
    const room = getRoom(explorationState.currentRoomId)
    setCurrentRoom(room || null)
  }, [explorationState.currentRoomId])

  // Animation loop
  useEffect(() => {
    let frameId: number
    const animate = () => {
      setAnimationFrame((f) => f + 1)
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
        let zoneId = 'cave_entrance'
        if (currentRoom.id === 'volcanic_passage' || currentRoom.id === 'ferno_lair') {
          zoneId = 'volcanic_passage'
        } else if (currentRoom.id === 'main_cavern' || currentRoom.id === 'puzzle_room') {
          zoneId = 'cave_depths'
        }

        const enemies = getRandomEncounter(zoneId)
        onEncounter(enemies)
      }
    },
    [currentRoom, onEncounter]
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

      // Move
      setIsMoving(true)
      const newState: ExplorationState = {
        ...explorationState,
        playerPosition: { col: newCol, row: newRow },
        playerDirection: direction,
        stepsSinceLastEncounter: explorationState.stepsSinceLastEncounter + 1,
      }

      onMove(newState)

      // Check for encounter after movement
      setTimeout(() => {
        setIsMoving(false)
        checkEncounter({ col: newCol, row: newRow })
      }, 150)
    },
    [explorationState, currentRoom, isMoving, onMove, checkEncounter, onRoomChange]
  )

  // Handle interaction
  const handleInteraction = useCallback(() => {
    if (!currentRoom) return

    const { playerPosition, playerDirection } = explorationState

    // Get position in front of player
    let targetCol = playerPosition.col
    let targetRow = playerPosition.row

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

    if (entity && canInteract(entity, playerPosition, explorationState)) {
      onInteract(entity)
    }

    // Check for tile interactions (save point, stairs)
    if (targetRow >= 0 && targetRow < currentRoom.height && targetCol >= 0 && targetCol < currentRoom.width) {
      const tile = currentRoom.tiles[targetRow][targetCol]
      if (tile === 'save_point') {
        // Trigger save menu
        onInteract({
          id: 'save_point',
          type: 'trigger',
          position: { col: targetCol, row: targetRow },
          sprite: 'save_point',
          direction: 'south',
          interactable: true,
          metadata: { action: 'save' },
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
  }, [currentRoom, explorationState, onInteract, onRoomChange])

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

    // Get visible tiles
    const visibleTiles = getVisibleTiles(currentRoom.width, currentRoom.height)

    // Draw tiles in render order
    for (const tilePos of visibleTiles) {
      const tileType = currentRoom.tiles[tilePos.row]?.[tilePos.col]
      if (!tileType) continue

      const colors = TILE_COLORS[tileType]
      const height = getTileHeight(tileType)

      if (height > 0) {
        // Draw as cube (wall, chest, etc.)
        drawIsometricCube(ctx, tilePos, height, colors.top, colors.left, colors.right)
      } else {
        // Draw as flat tile
        drawIsometricTile(ctx, tilePos, colors.top, colors.left)
      }

      // Add highlight effect for special tiles
      if (colors.highlight && tileType === 'lava') {
        // Animated lava glow
        const glowIntensity = 0.3 + Math.sin(animationFrame * 0.1) * 0.2
        ctx.globalAlpha = glowIntensity
        drawIsometricTile(ctx, tilePos, colors.highlight)
        ctx.globalAlpha = 1
      }

      if (tileType === 'save_point') {
        // Animated save point glow
        const glowIntensity = 0.5 + Math.sin(animationFrame * 0.08) * 0.3
        ctx.globalAlpha = glowIntensity
        const screenPos = isoToScreen(tilePos)
        ctx.fillStyle = '#6a8aaa'
        ctx.beginPath()
        ctx.arc(screenPos.x, screenPos.y, 10, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
      }
    }

    // Draw entities
    for (const entity of currentRoom.entities) {
      const screenPos = isoToScreen(entity.position)

      // Check if entity should be visible
      if (entity.type === 'chest' && explorationState.openedChests.includes(entity.id)) {
        // Draw opened chest differently
        ctx.fillStyle = '#5a4a3a'
        ctx.fillRect(screenPos.x - 10, screenPos.y - 15, 20, 12)
      } else if (entity.type === 'switch') {
        // Draw switch state
        const isActive = explorationState.activatedSwitches.includes(entity.id)
        ctx.fillStyle = isActive ? '#00ff00' : '#666666'
        ctx.beginPath()
        ctx.arc(screenPos.x, screenPos.y - 5, 8, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#333333'
        ctx.lineWidth = 2
        ctx.stroke()
      } else if (entity.type === 'npc') {
        // Simple NPC representation
        ctx.fillStyle = '#aa8866'
        ctx.beginPath()
        ctx.arc(screenPos.x, screenPos.y - 12, 8, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#664422'
        ctx.fillRect(screenPos.x - 6, screenPos.y - 4, 12, 16)
      } else if (entity.type === 'enemy') {
        // Boss indicator
        ctx.fillStyle = '#ff4444'
        ctx.beginPath()
        ctx.moveTo(screenPos.x, screenPos.y - 30)
        ctx.lineTo(screenPos.x - 15, screenPos.y)
        ctx.lineTo(screenPos.x + 15, screenPos.y)
        ctx.closePath()
        ctx.fill()

        // Pulsing effect for boss
        const pulse = Math.sin(animationFrame * 0.1) * 0.3 + 0.7
        ctx.globalAlpha = pulse
        ctx.strokeStyle = '#ffaa00'
        ctx.lineWidth = 3
        ctx.stroke()
        ctx.globalAlpha = 1
      }
    }

    // Draw player character
    drawCharacterSprite(
      ctx,
      explorationState.playerPosition,
      'tom',
      explorationState.playerDirection,
      isMoving,
      animationFrame
    )

    // Draw HUD
    drawExplorationHUD(ctx, party as any, currentRoom.name)

    // Draw control hints
    drawControlHints(ctx, ['Arrow Keys: Move', 'Enter: Interact', 'Esc: Menu'])
  }, [currentRoom, explorationState, party, animationFrame, isMoving])

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      style={{ display: 'block', margin: '0 auto' }}
    />
  )
}
