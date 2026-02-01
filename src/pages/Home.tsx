import { Link } from 'react-router-dom'

export function Home() {
  return (
    <div className="home">
      <h1>Game Arcade</h1>
      <p>Choose a game to play:</p>
      <nav className="game-list">
        <Link to="/boat-race" className="game-link">
          <div className="game-card">
            <h2>🚤 Boat Race</h2>
            <p>Race through checkpoints on the water!</p>
          </div>
        </Link>
        <Link to="/deep-sea-adventure" className="game-link">
          <div className="game-card">
            <h2>🤿 Deep Sea Adventure</h2>
            <p>Dive for treasure before the oxygen runs out!</p>
          </div>
        </Link>
        <Link to="/beast-quest" className="game-link">
          <div className="game-card">
            <h2>🐉 Beast Quest</h2>
            <p>Battle Ferno the Fire Dragon in this isometric RPG demo!</p>
          </div>
        </Link>
      </nav>
    </div>
  )
}
