import { useEffect, useRef } from 'react'
import { useKeyboard } from './useKeyboard'
import { createBoat, updateBoat, renderBoat } from './boat'
import { createCourse, renderCourse, keepBoatInBounds, checkCheckpointCollision, createRaceState } from './course'
import { createConfetti, updateConfetti, renderConfetti } from './confetti'
import { spawnWakeParticles, updateWakeParticles, renderWake } from './wake'
import { Boat, Course, RaceState, ConfettiParticle, WakeParticle } from './types'

interface GameState {
  boat: Boat
  course: Course
  raceState: RaceState
  confetti: ConfettiParticle[]
  wake: WakeParticle[]
  wakeSpawnAccumulator: number
}

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameStateRef = useRef<GameState | null>(null)
  const { keys, onRestartRef } = useKeyboard()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Initialize game state
    const course = createCourse()
    const boat = createBoat(course)
    const raceState = createRaceState()
    gameStateRef.current = { boat, course, raceState, confetti: [], wake: [], wakeSpawnAccumulator: 0 }

    // Set canvas size
    canvas.width = course.width
    canvas.height = course.height

    // Restart handler
    const restartGame = () => {
      if (gameStateRef.current?.raceState.completed) {
        const course = createCourse()
        const boat = createBoat(course)
        const raceState = createRaceState()
        gameStateRef.current = { boat, course, raceState, confetti: [], wake: [], wakeSpawnAccumulator: 0 }
      }
    }
    onRestartRef.current = restartGame

    let lastTime = performance.now()
    let animationId: number

    const gameLoop = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000
      lastTime = currentTime

      if (!gameStateRef.current) return

      let { boat, course, raceState, confetti, wake, wakeSpawnAccumulator } = gameStateRef.current

      // Update boat
      boat = updateBoat(boat, keys, deltaTime)
      boat = keepBoatInBounds(boat, course)

      // Check checkpoint collisions
      const prevCompleted = raceState.completed
      raceState = checkCheckpointCollision(boat, course, raceState)

      // Spawn confetti when race completes
      if (!prevCompleted && raceState.completed) {
        confetti = createConfetti(course.width)
      }

      // Update confetti
      if (confetti.length > 0) {
        confetti = updateConfetti(confetti, deltaTime)
      }

      // Update wake particles
      const wakeResult = spawnWakeParticles(boat, wake, deltaTime, wakeSpawnAccumulator)
      wake = updateWakeParticles(wakeResult.particles, deltaTime)
      wakeSpawnAccumulator = wakeResult.accumulator

      gameStateRef.current = { boat, course, raceState, confetti, wake, wakeSpawnAccumulator }

      // Render
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      renderCourse(ctx, course, raceState)
      renderWake(ctx, wake)
      renderBoat(ctx, boat)

      // Render confetti on top
      if (confetti.length > 0) {
        renderConfetti(ctx, confetti)
      }

      // HUD
      const speed = Math.sqrt(boat.velocity.x ** 2 + boat.velocity.y ** 2)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(10, 10, 180, 70)
      ctx.fillStyle = '#FFFFFF'
      ctx.font = '14px Arial'
      ctx.textAlign = 'left'
      ctx.fillText(`Speed: ${Math.round(speed)}`, 20, 30)
      ctx.fillText('Arrows: Move & Turn', 20, 48)

      // Checkpoint progress
      const checkpointText = raceState.completed
        ? 'RACE COMPLETE!'
        : raceState.currentCheckpoint >= course.checkpoints.length
          ? 'Return to finish!'
          : `Checkpoint: ${raceState.currentCheckpoint + 1}/${course.checkpoints.length}`
      ctx.fillStyle = raceState.completed ? '#00FF00' : '#FFD700'
      ctx.fillText(checkpointText, 20, 66)

      // Restart prompt when race is complete
      if (raceState.completed) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
        ctx.fillRect(canvas.width / 2 - 150, canvas.height / 2 - 40, 300, 80)
        ctx.fillStyle = '#FFFFFF'
        ctx.font = 'bold 24px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('RACE COMPLETE!', canvas.width / 2, canvas.height / 2 - 10)
        ctx.font = '18px Arial'
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
  }, [keys, onRestartRef])

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
