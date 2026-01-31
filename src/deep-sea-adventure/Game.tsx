import { useEffect, useRef, useState, useCallback } from 'react'
import { GameState, PathNode, BubbleParticle } from './types'
import {
  createGameState,
  getCurrentPlayer,
  handleTurnAround,
  handleRollDice,
  handleMove,
  handlePickUpTreasure,
  handleDropTreasure,
  handleSkipAction,
  nextTurn,
  handleRoundEnd,
  startNextRound,
  getAvailableActions,
  getFinalRankings,
} from './gameState'
import { render, generatePathNodes, CANVAS_WIDTH, CANVAS_HEIGHT, renderCurrentPlayerIndicator } from './render'
import { spawnBubbles, updateBubbles, resetBubbleSpawner } from './bubbles'
import { PLAYER_COLORS, calculateScore } from './player'
import { PlayerSetup } from './components/PlayerSetup'
import { GameControls } from './components/GameControls'
import { Scoreboard } from './components/Scoreboard'

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameStateRef = useRef<GameState | null>(null)
  const pathNodesRef = useRef<PathNode[]>([])
  const bubblesRef = useRef<BubbleParticle[]>([])

  const [gameStarted, setGameStarted] = useState(false)
  const [, forceUpdate] = useState({})

  // Start a new game with specified player count
  const startGame = useCallback((playerCount: number) => {
    gameStateRef.current = createGameState(playerCount)
    pathNodesRef.current = generatePathNodes(32)
    bubblesRef.current = []
    resetBubbleSpawner()
    setGameStarted(true)
  }, [])

  // Handle player actions
  const handleAction = useCallback((action: string, payload?: number) => {
    if (!gameStateRef.current) return

    const state = gameStateRef.current

    switch (action) {
      case 'turn_around':
        gameStateRef.current = handleTurnAround(state)
        break

      case 'roll':
        const { state: rolledState } = handleRollDice(state)
        gameStateRef.current = rolledState

        // After a short delay, handle the move
        setTimeout(() => {
          if (gameStateRef.current) {
            gameStateRef.current = handleMove(gameStateRef.current)
            forceUpdate({})

            // If player returned to submarine or turn ended, advance to next player
            if (gameStateRef.current.turnPhase === 'turn_end') {
              setTimeout(() => {
                if (gameStateRef.current) {
                  gameStateRef.current = nextTurn(gameStateRef.current)
                  forceUpdate({})
                }
              }, 300)
            }
          }
        }, 500)
        break

      case 'pick_up':
        gameStateRef.current = handlePickUpTreasure(state)
        // Move to next turn
        setTimeout(() => {
          if (gameStateRef.current) {
            gameStateRef.current = nextTurn(gameStateRef.current)
            forceUpdate({})
          }
        }, 300)
        break

      case 'drop':
        if (payload !== undefined) {
          gameStateRef.current = handleDropTreasure(state, payload)
          setTimeout(() => {
            if (gameStateRef.current) {
              gameStateRef.current = nextTurn(gameStateRef.current)
              forceUpdate({})
            }
          }, 300)
        }
        break

      case 'skip':
        gameStateRef.current = handleSkipAction(state)
        setTimeout(() => {
          if (gameStateRef.current) {
            gameStateRef.current = nextTurn(gameStateRef.current)
            forceUpdate({})
          }
        }, 300)
        break

      case 'end_round':
        gameStateRef.current = handleRoundEnd(state)
        break

      case 'next_round':
        const nextState = startNextRound(state)
        if (nextState) {
          gameStateRef.current = nextState
        }
        break

      case 'new_game':
        setGameStarted(false)
        gameStateRef.current = null
        break
    }

    forceUpdate({})
  }, [])

  // Render loop
  useEffect(() => {
    if (!gameStarted) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = CANVAS_WIDTH
    canvas.height = CANVAS_HEIGHT

    let animationId: number
    let lastTime = performance.now()

    const renderLoop = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000
      lastTime = currentTime

      // Update bubbles
      bubblesRef.current = spawnBubbles(bubblesRef.current, deltaTime)
      bubblesRef.current = updateBubbles(bubblesRef.current, deltaTime)

      // Render
      if (gameStateRef.current) {
        render(ctx, gameStateRef.current, pathNodesRef.current, bubblesRef.current)

        // Render current player indicator
        const player = getCurrentPlayer(gameStateRef.current)
        renderCurrentPlayerIndicator(ctx, player, CANVAS_WIDTH / 2 - 100, 10)
      }

      animationId = requestAnimationFrame(renderLoop)
    }

    animationId = requestAnimationFrame(renderLoop)

    return () => cancelAnimationFrame(animationId)
  }, [gameStarted])

  // Show setup screen if game not started
  if (!gameStarted) {
    return <PlayerSetup onStart={startGame} />
  }

  const state = gameStateRef.current
  if (!state) return null

  const currentPlayer = getCurrentPlayer(state)
  const actions = getAvailableActions(state)

  // Show round summary
  if (state.turnPhase === 'round_summary') {
    return (
      <div className="deep-sea-game">
        <canvas ref={canvasRef} />
        <div className="overlay">
          <div className="round-summary">
            <h2>Round {state.round.roundNumber} Complete!</h2>
            <div className="player-scores">
              {state.players.map(player => (
                <div key={player.id} className="player-score">
                  <span style={{ color: PLAYER_COLORS[player.color].primary }}>
                    {PLAYER_COLORS[player.color].name}
                  </span>
                  <span>
                    {player.drownedThisRound ? ' (Drowned!)' : ''}
                  </span>
                  <span>Score: {calculateScore(player)}</span>
                </div>
              ))}
            </div>
            <button onClick={() => handleAction('next_round')}>
              {state.round.roundNumber < 3 ? 'Start Next Round' : 'See Final Results'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Show game end
  if (state.turnPhase === 'game_end') {
    const rankings = getFinalRankings(state)

    return (
      <div className="deep-sea-game">
        <canvas ref={canvasRef} />
        <div className="overlay">
          <div className="game-end">
            <h2>Game Over!</h2>
            <Scoreboard rankings={rankings} />
            <button onClick={() => handleAction('new_game')}>Play Again</button>
          </div>
        </div>
      </div>
    )
  }

  // Show round end
  if (state.turnPhase === 'round_end') {
    return (
      <div className="deep-sea-game">
        <canvas ref={canvasRef} />
        <div className="overlay">
          <div className="round-end">
            <h2>Oxygen Depleted!</h2>
            <p>All divers still underwater drop their treasures.</p>
            <button onClick={() => handleAction('end_round')}>Continue</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="deep-sea-game">
      <canvas ref={canvasRef} />
      <GameControls
        player={currentPlayer}
        actions={actions}
        turnPhase={state.turnPhase}
        onAction={handleAction}
      />
    </div>
  )
}
