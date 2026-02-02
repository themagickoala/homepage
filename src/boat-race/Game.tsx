import { useEffect, useRef, useState, useCallback } from 'react'
import { useKeyboard } from './useKeyboard'
import { createBoat, updateBoat, renderBoat, BOAT_COLORS, handleBoatCollision } from './boat'
import {
  createCourse,
  renderCourse,
  keepBoatInBounds,
  checkCheckpointCollision,
  createRaceState,
} from './course'
import { createConfetti, updateConfetti, renderConfetti } from './confetti'
import { spawnWakeParticles, updateWakeParticles, renderWake } from './wake'
import { Boat, Course, RaceState, ConfettiParticle, WakeParticle, GameMode } from './types'
import { Menu } from './Menu'
import { getPresetCourse } from './presetCourses'
import { saveBestTime, getBestTime, formatTime } from './storage'

interface PlayerState {
  boat: Boat
  raceState: RaceState
  wake: WakeParticle[]
  wakeSpawnAccumulator: number
}

interface BaseGameState {
  course: Course
  confetti: ConfettiParticle[]
}

interface TwoPlayerGameState extends BaseGameState {
  mode: 'two-player'
  player1: PlayerState
  player2: PlayerState
  winner: 1 | 2 | null
}

interface SinglePlayerGameState extends BaseGameState {
  mode: 'single-player'
  courseId: string
  player: PlayerState
  startTime: number | null
  finishTime: number | null
  isNewBestTime: boolean
}

type ActiveGameState = TwoPlayerGameState | SinglePlayerGameState

// Render single-player course (buoys only show player progress)
function renderSinglePlayerCourse(
  ctx: CanvasRenderingContext2D,
  course: Course,
  raceState: RaceState
) {
  const { width, height, checkpoints } = course
  const BUOY_RADIUS = 8

  // Water background
  ctx.fillStyle = '#1E90FF'
  ctx.fillRect(0, 0, width, height)

  // Water texture/waves
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
  ctx.lineWidth = 1
  for (let y = 0; y < height; y += 20) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    for (let x = 0; x < width; x += 15) {
      ctx.lineTo(x, y + Math.sin(x * 0.08) * 3)
    }
    ctx.stroke()
  }

  // Course boundary
  ctx.strokeStyle = '#FFD700'
  ctx.lineWidth = 2
  ctx.setLineDash([10, 5])
  ctx.beginPath()
  ctx.moveTo(checkpoints[0].x, checkpoints[0].y)
  for (let i = 1; i < checkpoints.length; i++) {
    ctx.lineTo(checkpoints[i].x, checkpoints[i].y)
  }
  ctx.closePath()
  ctx.stroke()
  ctx.setLineDash([])

  // Checkpoint buoys
  checkpoints.forEach((point, index) => {
    const isPassed = raceState.completed || index < raceState.currentCheckpoint
    const isNext = !raceState.completed && index === raceState.currentCheckpoint

    if (isPassed) {
      ctx.fillStyle = '#808080' // Gray for passed
    } else if (isNext) {
      ctx.fillStyle = '#00FF00' // Green for next target
    } else {
      ctx.fillStyle = '#FFD700' // Gold for future
    }

    ctx.beginPath()
    ctx.arc(point.x, point.y, BUOY_RADIUS, 0, Math.PI * 2)
    ctx.fill()

    // White outline
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(point.x, point.y, BUOY_RADIUS, 0, Math.PI * 2)
    ctx.stroke()

    // Buoy number
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 8px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText((index + 1).toString(), point.x, point.y)
  })

  // Start/Finish line
  const startLineLength = 40
  const perpX = -Math.sin(course.startRotation)
  const perpY = Math.cos(course.startRotation)

  const lineStart = {
    x: course.startPosition.x + (perpX * startLineLength) / 2,
    y: course.startPosition.y + (perpY * startLineLength) / 2,
  }
  const lineEnd = {
    x: course.startPosition.x - (perpX * startLineLength) / 2,
    y: course.startPosition.y - (perpY * startLineLength) / 2,
  }

  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(lineStart.x, lineStart.y)
  ctx.lineTo(lineEnd.x, lineEnd.y)
  ctx.stroke()

  // Checkerboard pattern
  const numSquares = 8
  for (let i = 0; i < numSquares; i++) {
    const t = i / numSquares
    const x = lineStart.x + (lineEnd.x - lineStart.x) * t
    const y = lineStart.y + (lineEnd.y - lineStart.y) * t
    ctx.fillStyle = i % 2 === 0 ? '#000000' : '#FFFFFF'

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(course.startRotation)
    ctx.fillRect(-1.5, 0, 3, startLineLength / numSquares)
    ctx.restore()
  }
}

// Render pause menu overlay
function renderPauseMenu(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  selectedIndex: number,
  isSinglePlayer: boolean
) {
  // Darken background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.fillRect(0, 0, width, height)

  // Menu box
  const boxWidth = 300
  const boxHeight = 220
  const boxX = (width - boxWidth) / 2
  const boxY = (height - boxHeight) / 2

  ctx.fillStyle = 'rgba(30, 30, 50, 0.95)'
  ctx.fillRect(boxX, boxY, boxWidth, boxHeight)
  ctx.strokeStyle = '#FFD700'
  ctx.lineWidth = 3
  ctx.strokeRect(boxX, boxY, boxWidth, boxHeight)

  // Title
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 28px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('PAUSED', width / 2, boxY + 40)

  // Menu options
  const options = [
    'Restart Race',
    isSinglePlayer ? 'Change Course' : 'Change Mode',
    'Main Menu',
  ]

  options.forEach((option, index) => {
    const y = boxY + 90 + index * 45
    const isSelected = index === selectedIndex

    if (isSelected) {
      ctx.fillStyle = 'rgba(255, 215, 0, 0.3)'
      ctx.fillRect(boxX + 20, y - 18, boxWidth - 40, 36)
    }

    ctx.fillStyle = isSelected ? '#FFD700' : '#FFFFFF'
    ctx.font = isSelected ? 'bold 20px Arial' : '18px Arial'
    ctx.fillText(option, width / 2, y)
  })

  // Instructions
  ctx.fillStyle = '#888888'
  ctx.font = '12px Arial'
  ctx.fillText('↑↓ Navigate | Enter Select | ESC Resume', width / 2, boxY + boxHeight - 20)
}

export function Game() {
  const [gameMode, setGameMode] = useState<GameMode>('menu')
  const [isPaused, setIsPaused] = useState(false)
  const [pauseMenuIndex, setPauseMenuIndex] = useState(0)
  const [menuInitialMode, setMenuInitialMode] = useState<'single-player' | 'two-player' | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameStateRef = useRef<ActiveGameState | null>(null)
  const { keys1, keys2, onRestartRef } = useKeyboard()

  const initPlayerState = useCallback((course: Course, offsetMultiplier: number): PlayerState => {
    const sideOffset = 15
    const behindOffset = 30
    const perpX = -Math.sin(course.startRotation)
    const perpY = Math.cos(course.startRotation)
    const dirX = Math.cos(course.startRotation)
    const dirY = Math.sin(course.startRotation)

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
  }, [])

  const handleStartGame = useCallback(
    (mode: GameMode, courseId?: string) => {
      if (mode === 'menu') {
        setGameMode('menu')
        setIsPaused(false)
        setPauseMenuIndex(0)
        gameStateRef.current = null
        return
      }

      if (mode === 'single-player' && courseId) {
        const presetCourse = getPresetCourse(courseId)
        if (!presetCourse) return

        // Deep copy the course to avoid mutations
        const course: Course = {
          ...presetCourse.course,
          checkpoints: presetCourse.course.checkpoints.map((cp) => ({ ...cp })),
          startPosition: { ...presetCourse.course.startPosition },
        }

        gameStateRef.current = {
          mode: 'single-player',
          courseId,
          course,
          player: initPlayerState(course, 0), // Center position for single player
          confetti: [],
          startTime: null,
          finishTime: null,
          isNewBestTime: false,
        }
        setGameMode('single-player')
      } else if (mode === 'two-player') {
        const course = createCourse()
        gameStateRef.current = {
          mode: 'two-player',
          course,
          player1: initPlayerState(course, -1),
          player2: initPlayerState(course, 1),
          confetti: [],
          winner: null,
        }
        setGameMode('two-player')
      }
      setIsPaused(false)
      setPauseMenuIndex(0)
      setMenuInitialMode(null)
    },
    [initPlayerState]
  )

  const returnToMenu = useCallback(() => {
    setGameMode('menu')
    setMenuInitialMode(null)
    setIsPaused(false)
    setPauseMenuIndex(0)
    gameStateRef.current = null
  }, [])

  const returnToCourseSelection = useCallback(() => {
    setGameMode('menu')
    setMenuInitialMode('single-player')
    setIsPaused(false)
    setPauseMenuIndex(0)
    gameStateRef.current = null
  }, [])

  const restartRace = useCallback(() => {
    if (!gameStateRef.current) return

    if (gameStateRef.current.mode === 'two-player') {
      const course = createCourse()
      gameStateRef.current = {
        mode: 'two-player',
        course,
        player1: initPlayerState(course, -1),
        player2: initPlayerState(course, 1),
        confetti: [],
        winner: null,
      }
    } else if (gameStateRef.current.mode === 'single-player') {
      const presetCourse = getPresetCourse(gameStateRef.current.courseId)
      if (!presetCourse) return

      const course: Course = {
        ...presetCourse.course,
        checkpoints: presetCourse.course.checkpoints.map((cp) => ({ ...cp })),
        startPosition: { ...presetCourse.course.startPosition },
      }

      gameStateRef.current = {
        mode: 'single-player',
        courseId: gameStateRef.current.courseId,
        course,
        player: initPlayerState(course, 0),
        confetti: [],
        startTime: null,
        finishTime: null,
        isNewBestTime: false,
      }
    }
    setIsPaused(false)
    setPauseMenuIndex(0)
  }, [initPlayerState])

  useEffect(() => {
    if (gameMode === 'menu') return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const state = gameStateRef.current
    if (!state) return

    // Set canvas size
    canvas.width = state.course.width
    canvas.height = state.course.height

    // Restart handler (for SPACE key after race ends)
    const restartGameAfterFinish = () => {
      if (!gameStateRef.current) return

      if (gameStateRef.current.mode === 'two-player' && gameStateRef.current.winner !== null) {
        restartRace()
      } else if (gameStateRef.current.mode === 'single-player' && gameStateRef.current.finishTime !== null) {
        restartRace()
      }
    }
    onRestartRef.current = restartGameAfterFinish

    let lastTime = performance.now()
    let animationId: number

    const gameLoop = (currentTime: number) => {
      const deltaTime = isPaused ? 0 : (currentTime - lastTime) / 1000
      lastTime = currentTime

      if (!gameStateRef.current) return

      const state = gameStateRef.current

      if (state.mode === 'two-player') {
        let { player1, player2, course, confetti, winner } = state

        // Only update game state when not paused
        if (!isPaused) {
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

          // Check checkpoint collisions
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

          // Update wake particles
          const wake1Result = spawnWakeParticles(player1.boat, player1.wake, deltaTime, player1.wakeSpawnAccumulator)
          player1.wake = updateWakeParticles(wake1Result.particles, deltaTime)
          player1.wakeSpawnAccumulator = wake1Result.accumulator

          const wake2Result = spawnWakeParticles(player2.boat, player2.wake, deltaTime, player2.wakeSpawnAccumulator)
          player2.wake = updateWakeParticles(wake2Result.particles, deltaTime)
          player2.wakeSpawnAccumulator = wake2Result.accumulator

          gameStateRef.current = { ...state, player1, player2, course, confetti, winner }
        }

        // Render (always, even when paused)
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        renderCourse(ctx, course, player1.raceState, player2.raceState)
        renderWake(ctx, player1.wake)
        renderWake(ctx, player2.wake)
        renderBoat(ctx, player1.boat, BOAT_COLORS.player1)
        renderBoat(ctx, player2.boat, BOAT_COLORS.player2)

        if (confetti.length > 0) {
          renderConfetti(ctx, confetti)
        }

        // HUD - Player 1
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

        // HUD - Player 2
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
        if (winner !== null && !isPaused) {
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

        // Pause menu overlay
        if (isPaused) {
          renderPauseMenu(ctx, canvas.width, canvas.height, pauseMenuIndex, false)
        }
      } else {
        // Single player mode
        let { player, course, confetti, startTime, finishTime, isNewBestTime, courseId } = state

        // Only update when not paused
        if (!isPaused) {
          // Start timer on first movement
          if (startTime === null) {
            const speed = Math.sqrt(player.boat.velocity.x ** 2 + player.boat.velocity.y ** 2)
            if (speed > 5) {
              startTime = performance.now()
            }
          }

          // Update player
          player.boat = updateBoat(player.boat, keys1, deltaTime)
          player.boat = keepBoatInBounds(player.boat, course)

          // Check checkpoint collision
          const prevCompleted = player.raceState.completed
          player.raceState = checkCheckpointCollision(player.boat, course, player.raceState)

          // Check for finish
          if (!prevCompleted && player.raceState.completed && finishTime === null) {
            finishTime = startTime !== null ? performance.now() - startTime : 0
            confetti = createConfetti(course.width)
            // Check if it's a new best time
            isNewBestTime = saveBestTime(courseId, finishTime)
          }

          // Update confetti
          if (confetti.length > 0) {
            confetti = updateConfetti(confetti, deltaTime)
          }

          // Update wake
          const wakeResult = spawnWakeParticles(player.boat, player.wake, deltaTime, player.wakeSpawnAccumulator)
          player.wake = updateWakeParticles(wakeResult.particles, deltaTime)
          player.wakeSpawnAccumulator = wakeResult.accumulator

          gameStateRef.current = { ...state, player, course, confetti, startTime, finishTime, isNewBestTime }
        }

        // Render (always, even when paused)
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        renderSinglePlayerCourse(ctx, course, player.raceState)
        renderWake(ctx, player.wake)
        renderBoat(ctx, player.boat, BOAT_COLORS.player1)

        if (confetti.length > 0) {
          renderConfetti(ctx, confetti)
        }

        // HUD - Single player
        const speed = Math.sqrt(player.boat.velocity.x ** 2 + player.boat.velocity.y ** 2)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
        ctx.fillRect(10, 10, 200, 90)
        ctx.fillStyle = '#FFFFFF'
        ctx.font = 'bold 14px Arial'
        ctx.textAlign = 'left'
        ctx.fillText('Time Trial (Arrows)', 20, 30)
        ctx.font = '12px Arial'
        ctx.fillText(`Speed: ${Math.round(speed)}`, 20, 50)

        // Timer
        const currentTime = startTime !== null ? (finishTime !== null ? finishTime : performance.now() - startTime) : 0
        ctx.fillStyle = finishTime !== null ? '#00FF00' : '#FFD700'
        ctx.font = 'bold 20px Arial'
        ctx.fillText(formatTime(currentTime), 20, 75)

        // Checkpoint progress
        ctx.fillStyle = '#FFFFFF'
        ctx.font = '12px Arial'
        const checkpointText = player.raceState.completed
          ? 'FINISHED!'
          : player.raceState.currentCheckpoint >= course.checkpoints.length
            ? 'Return to finish!'
            : `Checkpoint: ${player.raceState.currentCheckpoint + 1}/${course.checkpoints.length}`
        ctx.fillText(checkpointText, 20, 92)

        // Best time display
        const bestTime = getBestTime(courseId)
        if (bestTime !== null) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
          ctx.fillRect(canvas.width - 150, 10, 140, 40)
          ctx.fillStyle = '#FFD700'
          ctx.font = 'bold 12px Arial'
          ctx.textAlign = 'left'
          ctx.fillText('🏆 Best Time', canvas.width - 140, 28)
          ctx.fillStyle = '#FFFFFF'
          ctx.font = '14px Arial'
          ctx.fillText(formatTime(bestTime), canvas.width - 140, 44)
        }

        // Finish screen
        if (finishTime !== null && !isPaused) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
          ctx.fillRect(canvas.width / 2 - 180, canvas.height / 2 - 80, 360, 160)

          ctx.fillStyle = '#FFFFFF'
          ctx.font = 'bold 28px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('Race Complete!', canvas.width / 2, canvas.height / 2 - 50)

          ctx.font = 'bold 36px Arial'
          ctx.fillStyle = isNewBestTime ? '#00FF00' : '#FFD700'
          ctx.fillText(formatTime(finishTime), canvas.width / 2, canvas.height / 2)

          if (isNewBestTime) {
            ctx.font = 'bold 18px Arial'
            ctx.fillStyle = '#00FF00'
            ctx.fillText('🏆 NEW BEST TIME! 🏆', canvas.width / 2, canvas.height / 2 + 35)
          }

          ctx.font = '14px Arial'
          ctx.fillStyle = '#AAAAAA'
          ctx.fillText('SPACE to retry | ESC for options', canvas.width / 2, canvas.height / 2 + 60)
        }

        // Pause menu overlay
        if (isPaused) {
          renderPauseMenu(ctx, canvas.width, canvas.height, pauseMenuIndex, true)
        }
      }

      animationId = requestAnimationFrame(gameLoop)
    }

    animationId = requestAnimationFrame(gameLoop)

    return () => {
      cancelAnimationFrame(animationId)
      onRestartRef.current = null
    }
  }, [gameMode, keys1, keys2, onRestartRef, isPaused, pauseMenuIndex, restartRace])

  // Handle keyboard for pause menu (separate effect to avoid stale closures)
  useEffect(() => {
    if (gameMode === 'menu') return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPaused((prev) => !prev)
        setPauseMenuIndex(0)
        return
      }

      if (isPaused) {
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
          e.preventDefault()
          setPauseMenuIndex((prev) => (prev - 1 + 3) % 3)
        } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
          e.preventDefault()
          setPauseMenuIndex((prev) => (prev + 1) % 3)
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          if (pauseMenuIndex === 0) {
            restartRace()
          } else if (pauseMenuIndex === 1) {
            // Return to previous menu (course selection for single-player, main menu for two-player)
            const isSinglePlayer = gameStateRef.current?.mode === 'single-player'
            if (isSinglePlayer) {
              returnToCourseSelection()
            } else {
              returnToMenu()
            }
          } else if (pauseMenuIndex === 2) {
            returnToMenu()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gameMode, isPaused, pauseMenuIndex, restartRace, returnToMenu, returnToCourseSelection])

  if (gameMode === 'menu') {
    return <Menu onStartGame={handleStartGame} initialMode={menuInitialMode} />
  }

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
