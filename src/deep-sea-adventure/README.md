# Deep Sea Adventure - Developer Documentation

A turn-based multiplayer board game where 2-6 players dive for treasure while managing shared oxygen. Based on the board game "Deep Sea Adventure" - see [RULES.md](RULES.md) for game rules.

## File Structure

```
deep-sea-adventure/
├── Game.tsx           # Main component with game loop and UI orchestration
├── types.ts           # TypeScript interfaces and type definitions
├── gameState.ts       # Core game logic and state transitions
├── player.ts          # Player creation, colors, and helper functions
├── treasure.ts        # Treasure and path generation
├── dice.ts            # Dice rolling logic
├── render.ts          # Canvas rendering functions
├── bubbles.ts         # Bubble particle effects
├── RULES.md           # Game rules reference
├── README.md          # This file
└── components/
    ├── PlayerSetup.tsx   # Pre-game player/color selection
    ├── GameControls.tsx  # In-game action buttons
    └── Scoreboard.tsx    # End-game rankings display
```

## Key Files

### types.ts

Core interfaces:

| Interface | Purpose |
|-----------|---------|
| `Vector2D` | 2D coordinates |
| `Treasure` | Treasure token: id, level (1-4), points, mega-treasure flag |
| `PathSpace` | Union type: treasure, empty, or removed space |
| `PlayerColor` | Union: 'blue' \| 'green' \| 'yellow' \| 'orange' \| 'purple' \| 'red' |
| `Player` | Player state: position, direction, treasures, status flags |
| `DiceRoll` | Dice result: die values, total, movement after penalty |
| `TurnPhase` | State machine phase (see below) |
| `RoundState` | Round number, oxygen level, path array |
| `GameState` | Complete game state |
| `BubbleParticle` | Decorative bubble effect data |

**Turn Phases (state machine):**
```
setup → pre_roll → rolling → moving → action → turn_end → (next player)
                                         ↓
                              round_end → round_summary → (next round or game_end)
```

### gameState.ts

Core game logic - the heart of the game:

**Key exports:**
- `createGameState(selectedColors)` - Initialize new game
- `getCurrentPlayer(state)` - Get active player
- `depleteOxygen(state)` - Reduce oxygen by held treasures
- `handleTurnAround(state)` - Player turns around
- `handleRollDice(state)` - Roll dice and get result
- `handleMove(state)` - Process movement after roll
- `handlePickUpTreasure(state)` - Pick up treasure at position
- `handleDropTreasure(state, index)` - Drop held treasure
- `handleSkipAction(state)` - Skip action phase
- `nextTurn(state)` - Advance to next player
- `handleRoundEnd(state)` - Process round end (drowning)
- `startNextRound(state)` - Set up next round
- `getFinalRankings(state)` - Calculate winner
- `getAvailableActions(state)` - Get valid actions for UI

**Important state transitions:**
- Lines 100-190: `handleMove()` - Calculates new position, handles submarine return
- Lines 264-308: `nextTurn()` - Finds next active player, checks round end
- Lines 310-325: `handleRoundEnd()` - Drowns players not in submarine
- Lines 327-366: `startNextRound()` - Resets players, prepares path

### player.ts

Player management:

**Key exports:**
- `PLAYER_COLORS` - Color definitions with primary/secondary/name
- `ALL_COLORS` - Array of all available colors
- `createPlayer(id, color)` - Create new player
- `createPlayers(colors)` - Create players from color array
- `resetPlayerForNewRound(player)` - Reset for new round (keep score)
- `isPlayerActive(player)` - Check if player can take turns
- `calculateScore(player)` - Sum scored treasure points
- `drownPlayer(player)` - Handle drowning

**Player state flags:**
- `isInSubmarine` - Currently in submarine
- `hasReturnedToSubmarine` - Returned safely this round (no more turns)
- `drownedThisRound` - Drowned when oxygen ran out

### treasure.ts

Treasure and path generation:

**Key exports:**
- `TREASURE_CONFIG` - Level configurations (count, point range, color)
- `createInitialPath()` - Generate 32-treasure path
- `preparePathForNextRound(path, droppedTreasures)` - Remove empty spaces, add mega-treasures

**Treasure levels:**
| Level | Count | Points | Shape |
|-------|-------|--------|-------|
| 1 | 8 | 0-3 | Triangle |
| 2 | 8 | 4-7 | Square |
| 3 | 8 | 8-11 | Hexagon |
| 4 | 8 | 12-15 | Octagon |

### dice.ts

Simple dice rolling:

```ts
export function rollDice(treasuresHeld: number): DiceRoll
```

- Rolls 2d3 (each die: 1,1,2,2,3,3)
- Movement = total - treasures held (minimum 0)

### render.ts

Canvas rendering:

**Key exports:**
- `CANVAS_WIDTH`, `CANVAS_HEIGHT` - Canvas dimensions (800x700)
- `generatePathNodes(count)` - Calculate treasure positions on winding path
- `render(ctx, state, pathNodes, bubbles)` - Main render function
- `renderCurrentPlayerIndicator(ctx, player, x, y)` - HUD element

**Render layers (bottom to top):**
1. Deep blue gradient background
2. Bubble particles
3. Submarine at top
4. Path with treasures
5. Player divers on path
6. Oxygen meter
7. Dice display (when rolling)

### Game.tsx

Main component orchestrating everything:

**Key sections:**
- Lines 35-41: `startGame()` - Initialize from selected colors
- Lines 44-118: `handleAction()` - Process all player actions
- Lines 121-159: Render loop for canvas animation
- Lines 162-246: React UI rendering (overlays, controls)

**Action handling:**
```tsx
handleAction(action: string, payload?: number)
// Actions: 'turn_around', 'roll', 'pick_up', 'drop', 'skip',
//          'end_round', 'next_round', 'new_game'
```

### components/PlayerSetup.tsx

Pre-game setup screen:

- Select 2-6 players
- Each player selects their color
- Colors swap when selecting one already taken
- Displays quick rules summary

### components/GameControls.tsx

In-game UI overlay:

- Shows current player name/color
- Displays direction and position
- Lists held treasures with drop buttons
- Action buttons based on turn phase

### components/Scoreboard.tsx

End-game results display:

- Rankings with trophy for winner
- Score and treasure count per player

## Common Modifications

### Adding a New Player Color

1. In `types.ts`, add to `PlayerColor` union:
```ts
export type PlayerColor = 'blue' | 'green' | ... | 'newcolor'
```

2. In `player.ts`, add to `PLAYER_COLORS` and `ALL_COLORS`:
```ts
export const PLAYER_COLORS = {
  // ...existing colors
  newcolor: { primary: '#hex', secondary: '#hex', name: 'New Color' },
}

export const ALL_COLORS: PlayerColor[] = [..., 'newcolor']
```

### Adjusting Game Balance

In `gameState.ts`:
- `INITIAL_OXYGEN = 25` - Starting oxygen per round

In `treasure.ts`:
- Adjust `TREASURE_CONFIG` point ranges
- Change treasure counts per level

### Changing Path Layout

In `render.ts`, modify `generatePathNodes()`:
- `SPACES_PER_ROW` - Treasures per row
- Adjust the serpentine pattern calculation

### Adding New Turn Phases

1. Add phase to `TurnPhase` in `types.ts`
2. Handle the phase in `getAvailableActions()` in `gameState.ts`
3. Add UI for the phase in `GameControls.tsx` or `Game.tsx`

### Modifying Dice

In `dice.ts`:
- Change `DIE_FACES` array for different probabilities
- Modify `rollDice()` for different dice mechanics

## State Flow Diagram

```
┌─────────────┐
│   setup     │ ← PlayerSetup.tsx
└──────┬──────┘
       ↓
┌─────────────┐
│  pre_roll   │ ← Can turn around, then roll
└──────┬──────┘
       ↓
┌─────────────┐
│   rolling   │ ← Dice animation (500ms)
└──────┬──────┘
       ↓
┌─────────────┐
│   moving    │ ← Movement animation
└──────┬──────┘
       ↓
┌─────────────┐     ┌─────────────┐
│   action    │ or  │  turn_end   │ ← If returned to sub
└──────┬──────┘     └──────┬──────┘
       ↓                   ↓
   (pick/drop/skip)   nextTurn()
       ↓                   ↓
┌─────────────┐     ┌─────────────┐
│  turn_end   │     │  pre_roll   │ ← Next player
└──────┬──────┘     └─────────────┘
       ↓
   nextTurn() ──────→ round_end (if no active players)
                           ↓
                    round_summary
                           ↓
                    (next round or game_end)
```
