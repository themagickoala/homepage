import { Player } from '../types'
import { PLAYER_COLORS } from '../player'
import { TREASURE_CONFIG } from '../treasure'

interface ScoreboardProps {
  rankings: Array<{
    player: Player
    score: number
    rank: number
  }>
}

export function Scoreboard({ rankings }: ScoreboardProps) {
  return (
    <div className="scoreboard">
      <h3>Final Scores</h3>
      <div className="rankings">
        {rankings.map(({ player, score, rank }) => {
          const colors = PLAYER_COLORS[player.color]
          const isWinner = rank === 1

          return (
            <div
              key={player.id}
              className={`ranking-row ${isWinner ? 'winner' : ''}`}
            >
              <div className="ranking-header">
                <span className="rank">
                  {rank === 1 && '🏆 '}
                  #{rank}
                </span>
                <span
                  className="player-name"
                  style={{ color: colors.primary }}
                >
                  {colors.name}
                </span>
                <span className="score">{score} points</span>
              </div>
              {player.scoredTreasures.length > 0 && (
                <div className="treasure-breakdown">
                  {player.scoredTreasures.map((treasure) => (
                    <div
                      key={treasure.id}
                      className="treasure-item"
                      style={{ backgroundColor: TREASURE_CONFIG[treasure.level].color }}
                    >
                      <span className="treasure-level">Lvl {treasure.level}</span>
                      <span className="treasure-points">{treasure.points}</span>
                      {treasure.isMegaTreasure && (
                        <span className="mega-badge">x{treasure.componentCount}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
