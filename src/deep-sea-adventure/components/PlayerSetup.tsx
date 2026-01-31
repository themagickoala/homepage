import { useState } from 'react'
import { PLAYER_COLORS } from '../player'
import { PlayerColor } from '../types'

interface PlayerSetupProps {
  onStart: (playerCount: number) => void
}

export function PlayerSetup({ onStart }: PlayerSetupProps) {
  const [playerCount, setPlayerCount] = useState(2)

  const colors: PlayerColor[] = ['blue', 'green', 'yellow', 'orange', 'purple']

  return (
    <div className="player-setup">
      <h2>Deep Sea Adventure</h2>
      <p>Dive for treasure, but don't run out of oxygen!</p>

      <div className="player-count-section">
        <h3>Select Number of Players</h3>
        <div className="player-count-buttons">
          {[2, 3, 4, 5].map(count => (
            <button
              key={count}
              className={`player-count-btn ${playerCount === count ? 'selected' : ''}`}
              onClick={() => setPlayerCount(count)}
            >
              {count}
            </button>
          ))}
        </div>
      </div>

      <div className="player-preview">
        <h3>Players</h3>
        <div className="player-colors">
          {colors.slice(0, playerCount).map(color => (
            <div
              key={color}
              className="player-color-preview"
              style={{ backgroundColor: PLAYER_COLORS[color].primary }}
            >
              {PLAYER_COLORS[color].name}
            </div>
          ))}
        </div>
      </div>

      <button className="start-btn" onClick={() => onStart(playerCount)}>
        Start Game
      </button>

      <div className="rules-summary">
        <h3>Quick Rules</h3>
        <ul>
          <li>Roll dice to move along the path</li>
          <li>Pick up treasures (but they slow you down!)</li>
          <li>Each treasure you hold costs 1 oxygen per turn</li>
          <li>Return to the submarine before oxygen runs out</li>
          <li>Highest score after 3 rounds wins!</li>
        </ul>
      </div>
    </div>
  )
}
