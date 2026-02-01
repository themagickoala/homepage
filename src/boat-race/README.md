# Boat Race - Developer Documentation

A real-time 2-player boat racing game where players navigate through checkpoints on a procedurally generated water course.

## File Structure

```
boat-race/
├── Game.tsx        # Main game component with render loop
├── types.ts        # TypeScript interfaces
├── boat.ts         # Boat physics, rendering, and collisions
├── course.ts       # Course generation and checkpoint logic
├── wake.ts         # Wake particle effects behind boats
├── confetti.ts     # Victory confetti animation
└── useKeyboard.ts  # Keyboard input handling hook
```

## Key Files

### types.ts

Core interfaces used throughout the game:

| Interface | Purpose |
|-----------|---------|
| `Vector2D` | 2D coordinates (x, y) |
| `Boat` | Boat state: position, velocity, rotation, angular velocity |
| `Course` | Course dimensions, checkpoints, start position/rotation |
| `KeyState` | Keyboard input state (up, down, left, right) |
| `RaceState` | Player progress: current checkpoint, completed flag |
| `WakeParticle` | Wake effect particle data |
| `ConfettiParticle` | Victory confetti particle data |

### Game.tsx

The main component that orchestrates everything:

```tsx
interface PlayerState {
  boat: Boat
  raceState: RaceState
  wake: WakeParticle[]
  wakeSpawnAccumulator: number
}

interface GameState {
  player1: PlayerState
  player2: PlayerState
  course: Course
  confetti: ConfettiParticle[]
  winner: 1 | 2 | null
}
```

**Key sections:**
- **Lines 29-60**: Game initialization - creates course and positions boats
- **Lines 62-150**: Main render loop with physics updates
- **Lines 152-180**: Checkpoint collision and win detection
- **Lines 182-220**: Canvas rendering order

**Render order:**
1. Water background (blue gradient)
2. Wake particles (behind boats)
3. Course (checkpoints, start line)
4. Boats
5. Confetti (when game won)
6. UI text (controls, winner message)

### boat.ts

Boat physics and rendering:

**Exports:**
- `BOAT_COLORS` - Color configs for player boats (player 1: red, player 2: blue)
- `createBoat(course)` - Creates boat at course start position
- `updateBoat(boat, keys, deltaTime)` - Applies physics based on input
- `renderBoat(ctx, boat, colorKey)` - Draws the boat
- `handleBoatCollision(boat1, boat2)` - Handles boat-to-boat collisions

**Physics constants (adjust these to tune feel):**
```ts
const THRUST = 200        // Forward acceleration
const REVERSE_THRUST = 100 // Backward acceleration
const TURN_SPEED = 3      // Rotation speed (radians/sec)
const DRAG = 0.98         // Velocity decay per frame
const ANGULAR_DRAG = 0.9  // Rotation decay per frame
```

### course.ts

Procedural course generation:

**Exports:**
- `createCourse()` - Generates a new random course
- `renderCourse(ctx, course, raceStates)` - Draws checkpoints and start line
- `keepBoatInBounds(boat, course)` - Constrains boat to course area
- `checkCheckpointCollision(boat, course, raceState)` - Detects checkpoint passes
- `createRaceState()` - Creates initial race progress state

**Course generation algorithm:**
1. Places checkpoints in a rough circle around the center
2. Adds randomness to positions
3. Ensures minimum distance from edges
4. Start position is at the first checkpoint

### wake.ts

Wake particle system for visual feedback:

**Exports:**
- `spawnWakeParticles(wake, boat, accumulator, deltaTime)` - Creates particles behind moving boats
- `updateWakeParticles(wake, deltaTime)` - Updates particle positions and fades
- `renderWake(ctx, wake)` - Draws wake particles

### useKeyboard.ts

Keyboard input handling:

**Controls:**
- Player 1: WASD keys
- Player 2: Arrow keys
- Restart: R key (when game over)

**Returns:**
```ts
{
  keys1: KeyState,      // Player 1 input
  keys2: KeyState,      // Player 2 input
  onRestartRef: Ref     // Callback ref for restart
}
```

## Common Modifications

### Adding a New Boat Color

In `boat.ts`, add to `BOAT_COLORS`:
```ts
export const BOAT_COLORS = {
  player1: { hull: '#e74c3c', deck: '#c0392b' },
  player2: { hull: '#3498db', deck: '#2980b9' },
  player3: { hull: '#2ecc71', deck: '#27ae60' }, // New color
}
```

### Changing Physics Feel

In `boat.ts`, adjust the constants at the top:
- Increase `THRUST` for faster acceleration
- Decrease `DRAG` for more sliding/drifting
- Adjust `TURN_SPEED` for tighter/wider turning

### Changing Course Difficulty

In `course.ts`:
- `CHECKPOINT_COUNT` - Number of checkpoints (default: 5)
- Adjust the randomness multipliers in `createCourse()`

### Adding More Players

1. Add more key bindings in `useKeyboard.ts`
2. Add more `PlayerState` entries in `Game.tsx`
3. Add boat colors in `boat.ts`
4. Update collision detection loop in `Game.tsx`

## Rendering Details

The game renders at the canvas's natural resolution. Key dimensions:
- Canvas: 800x600 pixels
- Boat size: ~20x10 pixels
- Checkpoint radius: 30 pixels
- Wake particle size: 2-5 pixels
