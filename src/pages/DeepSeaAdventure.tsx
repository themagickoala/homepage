import { Link } from 'react-router-dom'
import { Game } from '../deep-sea-adventure/Game'

export function DeepSeaAdventure() {
  return (
    <div className="deep-sea-adventure">
      <div className="page-header">
        <Link to="/" className="back-link">← Back to Games</Link>
        <h1>Deep Sea Adventure</h1>
      </div>
      <Game />
    </div>
  )
}
