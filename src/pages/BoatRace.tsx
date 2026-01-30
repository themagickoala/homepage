import { Link } from 'react-router-dom'
import { Game } from '../game/Game'

export function BoatRace() {
  return (
    <div className="boat-race">
      <div className="page-header">
        <Link to="/" className="back-link">← Back to Games</Link>
        <h1>Boat Racing</h1>
      </div>
      <Game />
    </div>
  )
}
