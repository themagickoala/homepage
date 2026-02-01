# Game Arcade - Developer Documentation

This document explains how games are structured in this arcade application to help developers add new games or modify existing ones.

## Project Structure

```
src/
├── App.tsx              # Main router - add routes for new games here
├── index.css            # Global styles including game-specific CSS
├── pages/
│   ├── Home.tsx         # Game selection menu - add cards for new games here
│   ├── BoatRace.tsx     # Page wrapper for Boat Race
│   └── DeepSeaAdventure.tsx  # Page wrapper for Deep Sea Adventure
├── boat-race/           # Boat racing game module
└── deep-sea-adventure/  # Deep sea diving game module
```

## Adding a New Game

### 1. Create the Game Directory

Create a new directory under `src/` for your game:
```
src/your-game-name/
├── Game.tsx          # Main component (required)
├── types.ts          # TypeScript interfaces
├── [other modules]   # Game-specific logic
└── README.md         # Documentation (recommended)
```

### 2. Create the Page Wrapper

Add a page component in `src/pages/YourGame.tsx`:

```tsx
import { Link } from 'react-router-dom'
import { Game } from '../your-game-name/Game'

export function YourGame() {
  return (
    <div className="your-game">
      <div className="page-header">
        <Link to="/" className="back-link">← Back to Games</Link>
        <h1>Your Game Title</h1>
      </div>
      <Game />
    </div>
  )
}
```

### 3. Add the Route

In `src/App.tsx`, import your page and add a route:

```tsx
import { YourGame } from './pages/YourGame'

// Inside Routes:
<Route path="/your-game" element={<YourGame />} />
```

### 4. Add to Home Menu

In `src/pages/Home.tsx`, add a game card:

```tsx
<Link to="/your-game" className="game-link">
  <div className="game-card">
    <h2>🎮 Your Game</h2>
    <p>Brief description of the game</p>
  </div>
</Link>
```

### 5. Add CSS Styles

Add game-specific styles to `src/index.css`. Use a namespace comment and prefix your classes:

```css
/* Your Game styles */
.your-game-class {
  /* styles */
}
```

## Common Patterns

### Canvas-Based Games

Both existing games use HTML Canvas for rendering. The typical pattern is:

```tsx
export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameStateRef = useRef<GameState | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Initialize game state
    gameStateRef.current = createInitialState()

    // Render loop
    let animationId: number
    const renderLoop = (currentTime: number) => {
      // Update game logic
      // Render to canvas
      animationId = requestAnimationFrame(renderLoop)
    }

    animationId = requestAnimationFrame(renderLoop)
    return () => cancelAnimationFrame(animationId)
  }, [])

  return <canvas ref={canvasRef} />
}
```

### React Overlays on Canvas

For UI elements like buttons, menus, and scoreboards, render React components as overlays:

```tsx
return (
  <div className="game-container">
    <canvas ref={canvasRef} />
    {showMenu && <MenuOverlay />}
    <GameControls onAction={handleAction} />
  </div>
)
```

### State Management

Games typically use:
- `useRef` for game state that changes every frame (avoids re-renders)
- `useState` for UI state that should trigger re-renders
- A `forceUpdate` pattern when you need to re-render after ref changes:

```tsx
const [, forceUpdate] = useState({})
// Later: forceUpdate({}) to trigger re-render
```

### Type Definitions

Keep all TypeScript interfaces in a `types.ts` file:

```ts
export interface Vector2D {
  x: number
  y: number
}

export interface GameState {
  // game-specific state
}
```

## Game-Specific Documentation

See the README.md files in each game directory for detailed documentation:

- [Boat Race](src/boat-race/README.md) - Real-time 2-player racing game
- [Deep Sea Adventure](src/deep-sea-adventure/README.md) - Turn-based multiplayer diving game

## Build & Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Deployment

The app includes a `public/_redirects` file for Netlify SPA routing. If deploying elsewhere, configure your server to redirect all routes to `index.html`.
