// ============================================
// World Map Component
// ============================================
// Canvas-based overworld map with location selection and travel

import { useEffect, useRef, useState } from 'react'
import { WorldMapState } from '../types'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../render/isometric'
import { drawPanel, drawControlHints, UI_COLORS, FONTS } from '../render/ui'
import { WORLD_MAP_LOCATIONS, getVisibleLocations } from '../data/world-map'
import avantiaMap from '../assets/avantia.png'

interface WorldMapProps {
  worldMapState: WorldMapState
  flags: Record<string, boolean>
  onTravel: (locationId: string) => void
  onOpenMenu: () => void
}

// Preload the map image
const mapImage = new Image()
mapImage.src = avantiaMap

export function WorldMap({ worldMapState, flags, onTravel, onOpenMenu }: WorldMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selectedLocationId, setSelectedLocationId] = useState(worldMapState.currentLocationId)
  const [animationFrame, setAnimationFrame] = useState(0)
  const [travelConfirm, setTravelConfirm] = useState(false)

  const visibleLocations = getVisibleLocations(worldMapState.discoveredLocations)
  const currentLocation = WORLD_MAP_LOCATIONS[worldMapState.currentLocationId]
  const selectedLocation = WORLD_MAP_LOCATIONS[selectedLocationId]

  // Get selectable locations (current + connected unlocked ones)
  const selectableIds = [
    worldMapState.currentLocationId,
    ...(currentLocation?.connectedTo || []).filter((id) => {
      const loc = WORLD_MAP_LOCATIONS[id]
      return loc && (!loc.unlockCondition || flags[loc.unlockCondition])
    }),
  ]

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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (travelConfirm) {
        if (e.key === 'Enter' || e.key === ' ') {
          onTravel(selectedLocationId)
          setTravelConfirm(false)
        } else if (e.key === 'Escape') {
          setTravelConfirm(false)
        }
        return
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight': {
          if (!selectedLocation) break
          const sel = selectedLocation
          let bestId: string | null = null
          let bestDist = Infinity

          for (const id of selectableIds) {
            if (id === selectedLocationId) continue
            const loc = WORLD_MAP_LOCATIONS[id]
            if (!loc) continue

            const dx = loc.x - sel.x
            const dy = loc.y - sel.y

            let matches = false
            switch (e.key) {
              case 'ArrowUp':
                matches = dy < -20
                break
              case 'ArrowDown':
                matches = dy > 20
                break
              case 'ArrowLeft':
                matches = dx < -20
                break
              case 'ArrowRight':
                matches = dx > 20
                break
            }
            if (!matches) continue

            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist < bestDist) {
              bestDist = dist
              bestId = id
            }
          }

          if (bestId) {
            setSelectedLocationId(bestId)
          }
          break
        }
        case 'Enter':
        case ' ':
          if (selectedLocationId !== worldMapState.currentLocationId) {
            setTravelConfirm(true)
          }
          break
        case 'Escape':
          onOpenMenu()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    selectedLocationId,
    selectedLocation,
    selectableIds,
    travelConfirm,
    worldMapState.currentLocationId,
    onTravel,
    onOpenMenu,
  ])

  // Render
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Background: draw avantia map image
    ctx.fillStyle = '#1a1008'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    if (mapImage.complete && mapImage.naturalWidth > 0) {
      ctx.drawImage(mapImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      // Dark tint overlay for atmosphere
      ctx.fillStyle = 'rgba(10, 5, 0, 0.3)'
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    }

    // Draw paths between connected locations
    for (const loc of visibleLocations) {
      for (const connId of loc.connectedTo) {
        const conn = WORLD_MAP_LOCATIONS[connId]
        if (!conn) continue
        // Only draw each path once
        if (loc.id > connId) continue

        const bothDiscovered =
          worldMapState.discoveredLocations.includes(loc.id) &&
          worldMapState.discoveredLocations.includes(connId)

        ctx.strokeStyle = bothDiscovered ? 'rgba(180, 150, 100, 0.7)' : 'rgba(80, 60, 40, 0.4)'
        ctx.lineWidth = bothDiscovered ? 3 : 1
        ctx.setLineDash(bothDiscovered ? [] : [5, 5])
        ctx.beginPath()
        ctx.moveTo(loc.x, loc.y)
        ctx.lineTo(conn.x, conn.y)
        ctx.stroke()
        ctx.setLineDash([])
      }
    }

    // Draw location icons
    for (const loc of visibleLocations) {
      const isDiscovered = worldMapState.discoveredLocations.includes(loc.id)
      const isAccessible = !loc.unlockCondition || flags[loc.unlockCondition]
      const isCurrent = loc.id === worldMapState.currentLocationId
      const isSelected = loc.id === selectedLocationId

      // Undiscovered locations
      if (!isDiscovered) {
        ctx.globalAlpha = 0.4
        ctx.fillStyle = '#444'
        ctx.beginPath()
        ctx.arc(loc.x, loc.y, 12, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#888'
        ctx.font = FONTS.small
        ctx.textAlign = 'center'
        ctx.fillText('???', loc.x, loc.y + 25)
        ctx.globalAlpha = 1
        continue
      }

      const iconSize = isSelected ? 16 : 12
      ctx.globalAlpha = isAccessible ? 1 : 0.5

      // Draw shadow under icon
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
      ctx.beginPath()
      ctx.ellipse(loc.x, loc.y + iconSize / 2 + 4, iconSize * 0.8, 4, 0, 0, Math.PI * 2)
      ctx.fill()

      switch (loc.type) {
        case 'village': {
          // House icon
          ctx.fillStyle = '#8a6a3a'
          ctx.fillRect(loc.x - iconSize / 2, loc.y - iconSize / 2, iconSize, iconSize)
          // Roof
          ctx.fillStyle = '#aa4a2a'
          ctx.beginPath()
          ctx.moveTo(loc.x - iconSize / 2 - 4, loc.y - iconSize / 2)
          ctx.lineTo(loc.x, loc.y - iconSize)
          ctx.lineTo(loc.x + iconSize / 2 + 4, loc.y - iconSize / 2)
          ctx.fill()
          // Door
          ctx.fillStyle = '#5a3a1a'
          ctx.fillRect(loc.x - 3, loc.y, 6, iconSize / 2)
          break
        }
        case 'dungeon': {
          // Skull/cave icon
          ctx.fillStyle = '#aa2222'
          ctx.beginPath()
          ctx.arc(loc.x, loc.y - 2, iconSize / 2, 0, Math.PI * 2)
          ctx.fill()
          ctx.strokeStyle = '#661111'
          ctx.lineWidth = 2
          ctx.stroke()
          // Eyes
          ctx.fillStyle = '#000'
          ctx.beginPath()
          ctx.arc(loc.x - 3, loc.y - 4, 2, 0, Math.PI * 2)
          ctx.arc(loc.x + 3, loc.y - 4, 2, 0, Math.PI * 2)
          ctx.fill()
          break
        }
        case 'landmark': {
          // Star
          ctx.fillStyle = '#ddaa22'
          ctx.beginPath()
          for (let i = 0; i < 10; i++) {
            const radius = i % 2 === 0 ? iconSize / 2 : iconSize / 4
            const angle = (i * Math.PI) / 5 - Math.PI / 2
            const sx = loc.x + Math.cos(angle) * radius
            const sy = loc.y + Math.sin(angle) * radius
            if (i === 0) ctx.moveTo(sx, sy)
            else ctx.lineTo(sx, sy)
          }
          ctx.fill()
          break
        }
      }

      ctx.globalAlpha = 1

      // Selection highlight (pulsing ring)
      if (isSelected) {
        const pulse = 0.5 + Math.sin(animationFrame * 0.1) * 0.3
        ctx.globalAlpha = pulse
        ctx.strokeStyle = '#ffdd44'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(loc.x, loc.y, iconSize + 8, 0, Math.PI * 2)
        ctx.stroke()
        ctx.globalAlpha = 1
      }

      // Current location marker (bobbing dot above)
      if (isCurrent) {
        const bob = Math.sin(animationFrame * 0.08) * 3
        ctx.fillStyle = '#44aaff'
        ctx.beginPath()
        ctx.arc(loc.x, loc.y - iconSize - 10 + bob, 5, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#2288dd'
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // Location name label
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
      ctx.font = isSelected ? FONTS.heading : FONTS.small
      const textWidth = ctx.measureText(loc.name).width
      ctx.fillRect(loc.x - textWidth / 2 - 4, loc.y + iconSize + 6, textWidth + 8, 18)

      ctx.fillStyle = isSelected ? '#ffffff' : '#ccaa88'
      ctx.textAlign = 'center'
      ctx.fillText(loc.name, loc.x, loc.y + iconSize + 19)
    }

    // Title banner
    drawPanel(ctx, CANVAS_WIDTH / 2 - 130, 5, 260, 30)
    ctx.fillStyle = UI_COLORS.textPrimary
    ctx.font = FONTS.heading
    ctx.textAlign = 'center'
    ctx.fillText('World Map of Avantia', CANVAS_WIDTH / 2, 25)

    // Selected location info panel
    if (
      selectedLocation &&
      worldMapState.discoveredLocations.includes(selectedLocationId)
    ) {
      const panelW = 300
      const panelH = 80
      const panelX = CANVAS_WIDTH - panelW - 10
      const panelY = CANVAS_HEIGHT - panelH - 30
      drawPanel(ctx, panelX, panelY, panelW, panelH)

      ctx.fillStyle = UI_COLORS.textPrimary
      ctx.font = FONTS.heading
      ctx.textAlign = 'left'
      ctx.fillText(selectedLocation.name, panelX + 10, panelY + 22)

      // Type badge
      ctx.fillStyle = selectedLocation.type === 'village' ? '#88aa55' : '#aa5555'
      ctx.font = FONTS.small
      ctx.fillText(
        selectedLocation.type.charAt(0).toUpperCase() + selectedLocation.type.slice(1),
        panelX + 10,
        panelY + 38
      )

      // Description (word wrap)
      ctx.fillStyle = UI_COLORS.textSecondary
      ctx.font = FONTS.small
      const words = selectedLocation.description.split(' ')
      let line = ''
      let ly = panelY + 54
      for (const word of words) {
        const test = line + word + ' '
        if (ctx.measureText(test).width > panelW - 20) {
          ctx.fillText(line, panelX + 10, ly)
          line = word + ' '
          ly += 16
        } else {
          line = test
        }
      }
      ctx.fillText(line, panelX + 10, ly)

      // Travel prompt
      if (selectedLocationId !== worldMapState.currentLocationId) {
        ctx.fillStyle = '#88ff88'
        ctx.font = FONTS.small
        ctx.fillText('Press Enter to travel', panelX + 10, panelY + panelH - 8)
      } else {
        ctx.fillStyle = '#88aaff'
        ctx.font = FONTS.small
        ctx.fillText('You are here', panelX + 10, panelY + panelH - 8)
      }
    }

    // Travel confirmation dialog
    if (travelConfirm && selectedLocation) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      const dlgW = 350
      const dlgH = 100
      const dlgX = (CANVAS_WIDTH - dlgW) / 2
      const dlgY = (CANVAS_HEIGHT - dlgH) / 2
      drawPanel(ctx, dlgX, dlgY, dlgW, dlgH, true)

      ctx.fillStyle = UI_COLORS.textPrimary
      ctx.font = FONTS.heading
      ctx.textAlign = 'center'
      ctx.fillText(`Travel to ${selectedLocation.name}?`, CANVAS_WIDTH / 2, dlgY + 35)

      ctx.fillStyle = UI_COLORS.textSecondary
      ctx.font = FONTS.normal
      ctx.fillText('Enter: Confirm  |  Esc: Cancel', CANVAS_WIDTH / 2, dlgY + 70)
    }

    // Control hints
    drawControlHints(ctx, ['Arrow Keys: Select', 'Enter: Travel', 'Esc: Menu'])
  }, [
    visibleLocations,
    worldMapState,
    selectedLocationId,
    selectedLocation,
    flags,
    animationFrame,
    travelConfirm,
  ])

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      style={{ display: 'block', margin: '0 auto' }}
    />
  )
}
