import { useEffect, useRef, useState, useCallback } from 'react'
import { GameState, PathNode, BubbleParticle, PlayerColor } from './types'
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
import { render, generatePathNodes, CANVAS_WIDTH, CANVAS_HEIGHT, renderCurrentPlayerIndicator, VisualPosition } from './render'
import { spawnBubbles, updateBubbles, resetBubbleSpawner } from './bubbles'
import { PLAYER_COLORS, calculateScore } from './player'
import { PlayerSetup } from './components/PlayerSetup'
import { GameControls } from './components/GameControls'
import { Scoreboard } from './components/Scoreboard'

// Animation state for smooth movement
interface MoveAnimation {
  playerId: number
  fromPosition: number
  toPosition: number
  startTime: number
  duration: number // ms
}

const HOP_ANIMATION_DURATION = 200 // ms per hop

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameStateRef = useRef<GameState | null>(null)
  const pathNodesRef = useRef<PathNode[]>([])
  const bubblesRef = useRef<BubbleParticle[]>([])
  const moveAnimationRef = useRef<MoveAnimation | null>(null)

  const [gameStarted, setGameStarted] = useState(false)
  const [, forceUpdate] = useState({})

  // Start a new game with selected player colors
  const startGame = useCallback((selectedColors: PlayerColor[]) => {
    gameStateRef.current = createGameState(selectedColors)
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
        const currentPlayer = getCurrentPlayer(state)
        const fromPosition = currentPlayer.position
        const { state: rolledState } = handleRollDice(state)
        gameStateRef.current = rolledState

        // After a short delay, handle the move with animation
        setTimeout(() => {
          if (gameStateRef.current) {
            const beforeMove = getCurrentPlayer(gameStateRef.current)
            gameStateRef.current = handleMove(gameStateRef.current)
            const afterMove = getCurrentPlayer(gameStateRef.current)

            // Start movement animation if position changed
            if (beforeMove.position !== afterMove.position || fromPosition !== afterMove.position) {
              const numSpaces = Math.abs(afterMove.position - fromPosition)
              moveAnimationRef.current = {
                playerId: afterMove.id,
                fromPosition: fromPosition,
                toPosition: afterMove.position,
                startTime: performance.now(),
                duration: Math.max(numSpaces * HOP_ANIMATION_DURATION, HOP_ANIMATION_DURATION),
              }
            }

            forceUpdate({})

            // If player returned to submarine or turn ended, advance to next player after animation
            if (gameStateRef.current.turnPhase === 'turn_end') {
              const animDuration = moveAnimationRef.current?.duration ?? HOP_ANIMATION_DURATION
              setTimeout(() => {
                if (gameStateRef.current) {
                  moveAnimationRef.current = null // Clear animation
                  gameStateRef.current = nextTurn(gameStateRef.current)
                  forceUpdate({})
                }
              }, animDuration + 100)
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

      // Calculate visual positions for animation
      let visualPositions: Map<number, VisualPosition> | undefined
      if (moveAnimationRef.current) {
        const anim = moveAnimationRef.current
        const elapsed = currentTime - anim.startTime
        const progress = Math.min(elapsed / anim.duration, 1)

        const numSpaces = Math.abs(anim.toPosition - anim.fromPosition)
        const direction = anim.toPosition > anim.fromPosition ? 1 : -1

        let visualPos: number
        let hopOffset = 0

        if (numSpaces === 0) {
          // No movement
          visualPos = anim.fromPosition
        } else {
          // Calculate which hop we're on (0-indexed)
          const totalHops = numSpaces
          const hopIndex = Math.min(Math.floor(progress * totalHops), totalHops - 1)
          const hopProgress = (progress * totalHops) - hopIndex

          // Easing for the hop within each space (ease-in-out for bouncy feel)
          const easedHopProgress = hopProgress < 0.5
            ? 2 * hopProgress * hopProgress
            : 1 - Math.pow(-2 * hopProgress + 2, 2) / 2

          // Current hop start and end positions
          const hopStart = anim.fromPosition + hopIndex * direction
          const hopEnd = hopStart + direction

          // Interpolate within the current hop
          visualPos = hopStart + (hopEnd - hopStart) * easedHopProgress

          // Calculate hop height (arc using sine) - negative for up
          hopOffset = -Math.sin(hopProgress * Math.PI) * 25
        }

        visualPositions = new Map()
        visualPositions.set(anim.playerId, { position: visualPos, hopOffset })

        // Clear animation when complete
        if (progress >= 1) {
          moveAnimationRef.current = null
        }
      }

      // Render
      if (gameStateRef.current) {
        render(ctx, gameStateRef.current, pathNodesRef.current, bubblesRef.current, visualPositions)

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
