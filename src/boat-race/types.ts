export interface Vector2D {
  x: number
  y: number
}

export interface Boat {
  position: Vector2D
  velocity: Vector2D
  rotation: number // radians, 0 = facing right
  angularVelocity: number
}

export interface Course {
  width: number
  height: number
  checkpoints: Vector2D[]
  startPosition: Vector2D
  startRotation: number
}

export interface KeyState {
  up: boolean
  down: boolean
  left: boolean
  right: boolean
}

export interface RaceState {
  currentCheckpoint: number
  completed: boolean
}

export interface ConfettiParticle {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
  rotation: number
  rotationSpeed: number
}

export interface WakeParticle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  life: number
  maxLife: number
}

export type GameMode = 'menu' | 'single-player' | 'two-player'

export interface BestTimes {
  [courseId: string]: number // time in milliseconds
}
