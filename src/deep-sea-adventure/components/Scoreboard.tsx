import { Player } from '../types'
import { PLAYER_COLORS } from '../player'

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
              <div className="scored-treasures">
                {player.scoredTreasures.length} treasures collected
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
