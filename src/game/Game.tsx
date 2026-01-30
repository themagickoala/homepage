import { useEffect, useRef } from 'react'
import { useKeyboard } from './useKeyboard'
import { createBoat, updateBoat, renderBoat, BOAT_COLORS, handleBoatCollision } from './boat'
import { createCourse, renderCourse, keepBoatInBounds, checkCheckpointCollision, createRaceState } from './course'
import { createConfetti, updateConfetti, renderConfetti } from './confetti'
import { spawnWakeParticles, updateWakeParticles, renderWake } from './wake'
import { Boat, Course, RaceState, ConfettiParticle, WakeParticle } from './types'

interface PlayerState {
  boat: Boat
  raceState: RaceState
  wake: WakeParticle[]
  wakeSpawnAccumulator: number
}

interface GameState {
  player1: PlayerState
  player2: PlayerState
  course: Course
  confetti: ConfettiParticle[]
  winner: 1 | 2 | null
}

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameStateRef = useRef<GameState | null>(null)
  const { keys1, keys2, onRestartRef } = useKeyboard()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Initialize game state
    const course = createCourse()

    // Calculate side-by-side start positions behind the line
    const sideOffset = 15 // Distance from center for each boat
    const behindOffset = 30 // Distance behind the start line
    const perpX = -Math.sin(course.startRotation)
    const perpY = Math.cos(course.startRotation)
    const dirX = Math.cos(course.startRotation)
    const dirY = Math.sin(course.startRotation)

    const initPlayerState = (offsetMultiplier: number): PlayerState => {
      const boat = createBoat(course)
      // Offset boat position perpendicular to start direction and behind the line
      boat.position = {
        x: course.startPosition.x + perpX * sideOffset * offsetMultiplier - dirX * behindOffset,
        y: course.startPosition.y + perpY * sideOffset * offsetMultiplier - dirY * behindOffset,
      }
      return {
        boat,
        raceState: createRaceState(),
        wake: [],
        wakeSpawnAccumulator: 0,
      }
    }

    gameStateRef.current = {
      player1: initPlayerState(-1), // Left side
      player2: initPlayerState(1),  // Right side
      course,
      confetti: [],
      winner: null,
    }

    // Set canvas size
    canvas.width = course.width
    canvas.height = course.height

    // Restart handler
    const restartGame = () => {
      if (gameStateRef.current?.winner !== null) {
        const course = createCourse()

        // Calculate side-by-side start positions behind the line
        const sideOffset = 15
        const behindOffset = 30
        const perpX = -Math.sin(course.startRotation)
        const perpY = Math.cos(course.startRotation)
        const dirX = Math.cos(course.startRotation)
        const dirY = Math.sin(course.startRotation)

        const initPlayerState = (offsetMultiplier: number): PlayerState => {
          const boat = createBoat(course)
          boat.position = {
            x: course.startPosition.x + perpX * sideOffset * offsetMultiplier - dirX * behindOffset,
            y: course.startPosition.y + perpY * sideOffset * offsetMultiplier - dirY * behindOffset,
          }
          return {
            boat,
            raceState: createRaceState(),
            wake: [],
            wakeSpawnAccumulator: 0,
          }
        }

        gameStateRef.current = {
          player1: initPlayerState(-1),
          player2: initPlayerState(1),
          course,
          confetti: [],
          winner: null,
        }
      }
    }
    onRestartRef.current = restartGame

    let lastTime = performance.now()
    let animationId: number

    const gameLoop = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000
      lastTime = currentTime

      if (!gameStateRef.current) return

      let { player1, player2, course, confetti, winner } = gameStateRef.current

      // Update player 1
      player1.boat = updateBoat(player1.boat, keys1, deltaTime)
      player1.boat = keepBoatInBounds(player1.boat, course)

      // Update player 2
      player2.boat = updateBoat(player2.boat, keys2, deltaTime)
      player2.boat = keepBoatInBounds(player2.boat, course)

      // Handle boat-to-boat collision
      const collisionResult = handleBoatCollision(player1.boat, player2.boat)
      player1.boat = keepBoatInBounds(collisionResult.boat1, course)
      player2.boat = keepBoatInBounds(collisionResult.boat2, course)

      // Check checkpoint collisions for both players
      const prevCompleted1 = player1.raceState.completed
      const prevCompleted2 = player2.raceState.completed

      player1.raceState = checkCheckpointCollision(player1.boat, course, player1.raceState)
      player2.raceState = checkCheckpointCollision(player2.boat, course, player2.raceState)

      // Check for winner
      if (winner === null) {
        if (!prevCompleted1 && player1.raceState.completed) {
          winner = 1
          confetti = createConfetti(course.width)
        } else if (!prevCompleted2 && player2.raceState.completed) {
          winner = 2
          confetti = createConfetti(course.width)
        }
      }

      // Update confetti
      if (confetti.length > 0) {
        confetti = updateConfetti(confetti, deltaTime)
      }

      // Update wake particles for both players
      const wake1Result = spawnWakeParticles(player1.boat, player1.wake, deltaTime, player1.wakeSpawnAccumulator)
      player1.wake = updateWakeParticles(wake1Result.particles, deltaTime)
      player1.wakeSpawnAccumulator = wake1Result.accumulator

      const wake2Result = spawnWakeParticles(player2.boat, player2.wake, deltaTime, player2.wakeSpawnAccumulator)
      player2.wake = updateWakeParticles(wake2Result.particles, deltaTime)
      player2.wakeSpawnAccumulator = wake2Result.accumulator

      gameStateRef.current = { player1, player2, course, confetti, winner }

      // Render
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      renderCourse(ctx, course, player1.raceState, player2.raceState)

      // Render wakes
      renderWake(ctx, player1.wake)
      renderWake(ctx, player2.wake)

      // Render boats
      renderBoat(ctx, player1.boat, BOAT_COLORS.player1)
      renderBoat(ctx, player2.boat, BOAT_COLORS.player2)

      // Render confetti on top
      if (confetti.length > 0) {
        renderConfetti(ctx, confetti)
      }

      // HUD - Player 1 (left side)
      const speed1 = Math.sqrt(player1.boat.velocity.x ** 2 + player1.boat.velocity.y ** 2)
      ctx.fillStyle = 'rgba(139, 69, 19, 0.8)'
      ctx.fillRect(10, 10, 160, 70)
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 12px Arial'
      ctx.textAlign = 'left'
      ctx.fillText('Player 1 (Arrows)', 20, 28)
      ctx.font = '12px Arial'
      ctx.fillText(`Speed: ${Math.round(speed1)}`, 20, 46)
      const checkpoint1Text = player1.raceState.completed
        ? 'FINISHED!'
        : player1.raceState.currentCheckpoint >= course.checkpoints.length
          ? 'Return to finish!'
          : `Checkpoint: ${player1.raceState.currentCheckpoint + 1}/${course.checkpoints.length}`
      ctx.fillStyle = player1.raceState.completed ? '#00FF00' : '#FFD700'
      ctx.fillText(checkpoint1Text, 20, 64)

      // HUD - Player 2 (right side)
      const speed2 = Math.sqrt(player2.boat.velocity.x ** 2 + player2.boat.velocity.y ** 2)
      ctx.fillStyle = 'rgba(46, 90, 136, 0.8)'
      ctx.fillRect(canvas.width - 170, 10, 160, 70)
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 12px Arial'
      ctx.textAlign = 'left'
      ctx.fillText('Player 2 (WASD)', canvas.width - 160, 28)
      ctx.font = '12px Arial'
      ctx.fillText(`Speed: ${Math.round(speed2)}`, canvas.width - 160, 46)
      const checkpoint2Text = player2.raceState.completed
        ? 'FINISHED!'
        : player2.raceState.currentCheckpoint >= course.checkpoints.length
          ? 'Return to finish!'
          : `Checkpoint: ${player2.raceState.currentCheckpoint + 1}/${course.checkpoints.length}`
      ctx.fillStyle = player2.raceState.completed ? '#00FF00' : '#FFD700'
      ctx.fillText(checkpoint2Text, canvas.width - 160, 64)

      // Winner announcement
      if (winner !== null) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
        ctx.fillRect(canvas.width / 2 - 150, canvas.height / 2 - 50, 300, 100)
        ctx.fillStyle = '#FFFFFF'
        ctx.font = 'bold 28px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(`Player ${winner} Wins!`, canvas.width / 2, canvas.height / 2 - 15)
        ctx.font = '16px Arial'
        ctx.fillStyle = '#FFD700'
        ctx.fillText('Press SPACE to restart', canvas.width / 2, canvas.height / 2 + 20)
      }

      animationId = requestAnimationFrame(gameLoop)
    }

    animationId = requestAnimationFrame(gameLoop)

    return () => {
      cancelAnimationFrame(animationId)
      onRestartRef.current = null
    }
  }, [keys1, keys2, onRestartRef])

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        margin: '0 auto',
        border: '2px solid #333',
      }}
    />
  )
}
