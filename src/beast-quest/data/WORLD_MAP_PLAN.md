# World Map Plan

## Overview

The world map is a top-level navigation layer that connects all explorable areas in Beast Quest. Players access it after leaving a dungeon or village, and use it to travel between locations. It follows the book series' progression through Avantia.

## Architecture

### New Types

```typescript
// A point on the world map
interface WorldMapLocation {
  id: string
  name: string
  description: string
  position: { x: number; y: number }  // pixel position on map canvas
  type: 'village' | 'dungeon' | 'landmark' | 'crossroads'
  floorId: string                      // links to DungeonFloor for entering
  isDiscovered: boolean
  isAccessible: boolean                // gated by story flags
  requiredFlag?: string                // flag needed to unlock
  connections: string[]                // IDs of connected locations (for path drawing)
}

// State tracked in GameState
interface WorldMapState {
  currentLocationId: string
  discoveredLocations: string[]
  travelingTo: string | null           // used during travel animation
}
```

### New GamePhase

Add `'world_map'` to the `GamePhase` union type. The Game component renders a `WorldMap` component when in this phase.

### Floor Registry

Replace the hardcoded `getRoom()` in `ferno-dungeon.ts` with a central floor registry:

```typescript
// data/floor-registry.ts
const FLOORS: Record<string, DungeonFloor> = {}

export function registerFloor(floor: DungeonFloor) {
  FLOORS[floor.id] = floor
}

export function getFloor(floorId: string): DungeonFloor | undefined {
  return FLOORS[floorId]
}

export function getRoomFromFloor(floorId: string, roomId: string): DungeonRoom | undefined {
  return FLOORS[floorId]?.rooms.find(r => r.id === roomId)
}
```

All dungeon/village files call `registerFloor()` at import time. The `Dungeon` component uses `getRoomFromFloor(explorationState.currentFloorId, explorationState.currentRoomId)` instead of the current `getRoom()`.

### WorldMap Component

A new canvas-based component (`components/WorldMap.tsx`) that renders:

1. **Background**: A parchment-style map of Avantia drawn procedurally with terrain (forests, mountains, rivers)
2. **Locations**: Icons at fixed positions - villages (house icon), dungeons (skull icon), landmarks (star icon)
3. **Paths**: Lines connecting accessible locations
4. **Player marker**: Animated token showing current position
5. **Fog of war**: Undiscovered locations shown as `???` with dimmed icons

### Navigation

- Arrow keys move a cursor between connected locations
- Enter/Space travels to the selected location (triggers a brief travel animation, then enters the floor)
- Escape opens the game menu
- Locations can be locked behind story flags (e.g., must defeat Ferno before Sepron's area unlocks)

## Locations (Planned)

| ID | Name | Type | Unlock Condition |
|----|------|------|------------------|
| `errinel_village` | Errinel Village | village | Start of game |
| `ferno_cave` | Ferno's Cave | dungeon | Game start |
| `western_ocean` | Western Ocean | dungeon | `ferno_defeated` |
| `kings_city` | King Hugo's City | village | `ferno_defeated` |
| `dark_jungle` | The Dark Jungle | dungeon | `sepron_defeated` |
| `stonewin` | Stonewin Volcano | dungeon | `arcta_defeated` |

## Transition Flow

```
Village/Dungeon exit
    → GameState.phase = 'world_map'
    → WorldMap component renders
    → Player selects destination
    → GameState.exploration updated with new floorId/roomId
    → GameState.phase = 'exploring'
    → Dungeon component loads the target floor
```

### Exit Points

Each dungeon/village floor declares an `exitPosition` and `exitRoomId`. When the player steps on the exit tile, a confirmation prompt appears. Accepting transitions to the world map.

A new tile type `'exit'` is added (rendered as a road/path leading off-screen).

## Implementation Order

1. **Floor Registry** - Centralize floor/room lookup (required for multi-area support)
2. **Errinel Village** - Tom's home village with shops and NPCs (implemented below)
3. **Exit tiles** - Add exit tile type and transition logic in Dungeon component
4. **WorldMap component** - Canvas rendering, location data, navigation
5. **WorldMapState** - Add to GameState, save/load support
6. **Travel animation** - Brief screen transition between areas
7. **Fog of war** - Track discovered locations
8. **Story gating** - Lock locations behind flags

## Shop System (needed for villages)

### Types

```typescript
interface ShopInventory {
  itemId: string
  price: number       // buy price (sell = 50% of item.value)
  stock: number | null // null = unlimited
}

interface Shop {
  id: string
  name: string
  keeperName: string
  inventory: ShopInventory[]
  dialogue: { greeting: string; noMoney: string; thanks: string }
}
```

### UI

A new `ShopUI` component rendered when interacting with a shop NPC. Split panel:
- Left: Shop items with prices
- Right: Player inventory (for selling)
- Bottom: Gold display, Buy/Sell buttons

Keyboard: ↑↓ navigate, ←→ switch buy/sell, Enter confirm, Esc close.

### Integration

Shop NPCs have `metadata: { shopId: 'weapon_shop' }`. The `handleInteract` function in `Game.tsx` checks for `shopId` and opens the shop UI.
