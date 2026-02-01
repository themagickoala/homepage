import { useState } from 'react'
import { PLAYER_COLORS, ALL_COLORS } from '../player'
import { PlayerColor } from '../types'

interface PlayerSetupProps {
  onStart: (selectedColors: PlayerColor[]) => void
}

export function PlayerSetup({ onStart }: PlayerSetupProps) {
  const [playerCount, setPlayerCount] = useState(2)
  const [selectedColors, setSelectedColors] = useState<PlayerColor[]>(['blue', 'green'])

  const handlePlayerCountChange = (count: number) => {
    setPlayerCount(count)
    // Adjust selected colors to match new count
    if (count > selectedColors.length) {
      // Add more colors from available ones
      const availableColors = ALL_COLORS.filter(c => !selectedColors.includes(c))
      const newColors = [...selectedColors]
      for (let i = selectedColors.length; i < count && availableColors.length > 0; i++) {
        newColors.push(availableColors.shift()!)
      }
      setSelectedColors(newColors)
    } else if (count < selectedColors.length) {
      // Remove excess colors
      setSelectedColors(selectedColors.slice(0, count))
    }
  }

  const handleColorChange = (playerIndex: number, newColor: PlayerColor) => {
    // Check if color is already taken by another player
    const existingIndex = selectedColors.indexOf(newColor)
    if (existingIndex !== -1 && existingIndex !== playerIndex) {
      // Swap colors
      const newColors = [...selectedColors]
      newColors[existingIndex] = selectedColors[playerIndex]
      newColors[playerIndex] = newColor
      setSelectedColors(newColors)
    } else {
      const newColors = [...selectedColors]
      newColors[playerIndex] = newColor
      setSelectedColors(newColors)
    }
  }

  return (
    <div className="player-setup">
      <h2>Deep Sea Adventure</h2>
      <p>Dive for treasure, but don't run out of oxygen!</p>

      <div className="player-count-section">
        <h3>Select Number of Players</h3>
        <div className="player-count-buttons">
          {[2, 3, 4, 5, 6].map(count => (
            <button
              key={count}
              className={`player-count-btn ${playerCount === count ? 'selected' : ''}`}
              onClick={() => handlePlayerCountChange(count)}
            >
              {count}
            </button>
          ))}
        </div>
      </div>

      <div className="player-preview">
        <h3>Select Player Colors</h3>
        <div className="color-selection-grid">
          {selectedColors.map((color, index) => (
            <div key={index} className="player-color-selector">
              <span className="player-label">Player {index + 1}</span>
              <div className="color-options">
                {ALL_COLORS.map(c => (
                  <button
                    key={c}
                    className={`color-option ${color === c ? 'selected' : ''}`}
                    style={{
                      backgroundColor: PLAYER_COLORS[c].primary,
                      opacity: selectedColors.includes(c) && color !== c ? 0.3 : 1
                    }}
                    onClick={() => handleColorChange(index, c)}
                    title={PLAYER_COLORS[c].name}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button className="start-btn" onClick={() => onStart(selectedColors)}>
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
