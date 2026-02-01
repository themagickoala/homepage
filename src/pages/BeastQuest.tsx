import { Link } from 'react-router-dom'
import { Game } from '../beast-quest/Game'

export function BeastQuest() {
  return (
    <div className="beast-quest">
      <div className="page-header">
        <Link to="/" className="back-link">← Back to Games</Link>
        <h1>Beast Quest: Ferno's Cave</h1>
      </div>
      <Game />
    </div>
  )
}
