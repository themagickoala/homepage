import { Player, TurnPhase } from '../types'
import { PLAYER_COLORS } from '../player'
import { TREASURE_CONFIG } from '../treasure'

interface GameControlsProps {
  player: Player
  actions: {
    canTurnAround: boolean
    canRoll: boolean
    canPickUp: boolean
    canDrop: boolean
    canSkip: boolean
  }
  turnPhase: TurnPhase
  onAction: (action: string, payload?: number) => void
}

export function GameControls({
  player,
  actions,
  turnPhase,
  onAction,
}: GameControlsProps) {
  const colors = PLAYER_COLORS[player.color]

  const isWaiting = turnPhase === 'rolling' || turnPhase === 'moving'

  return (
    <div className="game-controls">
      <div className="current-player" style={{ borderColor: colors.primary }}>
        <div className="player-name" style={{ color: colors.primary }}>
          {colors.name}'s Turn
        </div>
        <div className="player-status">
          {player.isInSubmarine ? (
            <span>In Submarine</span>
          ) : (
            <>
              <span>Direction: {player.direction === 'down' ? '⬇️ Down' : '⬆️ Up'}</span>
              <span>Position: {player.position + 1}</span>
            </>
          )}
        </div>
      </div>

      {player.heldTreasures.length > 0 && (
        <div className="held-treasures">
          <div className="section-title">Held Treasures ({player.heldTreasures.length})</div>
          <div className="treasure-list">
            {player.heldTreasures.map((treasure, index) => (
              <div
                key={treasure.id}
                className="held-treasure"
                style={{ backgroundColor: TREASURE_CONFIG[treasure.level].color }}
              >
                <span>Lvl {treasure.level}</span>
                {actions.canDrop && (
                  <button
                    className="drop-btn"
                    onClick={() => onAction('drop', index)}
                  >
                    Drop
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="action-buttons">
        {turnPhase === 'pre_roll' && (
          <>
            {actions.canTurnAround && (
              <button
                className="action-btn turn-around"
                onClick={() => onAction('turn_around')}
              >
                ↩️ Turn Around
              </button>
            )}
            <button
              className="action-btn roll"
              onClick={() => onAction('roll')}
              disabled={isWaiting}
            >
              🎲 Roll Dice
            </button>
          </>
        )}

        {turnPhase === 'action' && (
          <>
            {actions.canPickUp && (
              <button
                className="action-btn pick-up"
                onClick={() => onAction('pick_up')}
              >
                💎 Pick Up Treasure
              </button>
            )}
            {actions.canSkip && (
              <button
                className="action-btn skip"
                onClick={() => onAction('skip')}
              >
                ➡️ Continue
              </button>
            )}
          </>
        )}

        {(turnPhase === 'rolling' || turnPhase === 'moving') && (
          <div className="waiting-message">
            {turnPhase === 'rolling' ? 'Rolling...' : 'Moving...'}
          </div>
        )}
      </div>
    </div>
  )
}
