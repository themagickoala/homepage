// Core position type
export interface Vector2D {
  x: number
  y: number
}

// Treasure levels (1-4) with increasing value and depth
export type TreasureLevel = 1 | 2 | 3 | 4

export interface Treasure {
  id: string
  level: TreasureLevel
  points: number // Hidden value until scored
  isMegaTreasure: boolean
  componentCount: number // For mega-treasures, how many treasures combined
}

// Path space can have a treasure, be empty, or be removed
export type PathSpace =
  | { type: 'treasure'; treasure: Treasure }
  | { type: 'empty' }
  | { type: 'removed' }

// Player colors
export type PlayerColor = 'blue' | 'green' | 'yellow' | 'orange' | 'purple'

export interface Player {
  id: number
  color: PlayerColor
  position: number // -1 = in submarine, 0+ = on path
  direction: 'down' | 'up'
  heldTreasures: Treasure[]
  scoredTreasures: Treasure[] // Treasures safely returned
  isInSubmarine: boolean
  drownedThisRound: boolean
  hasReturnedToSubmarine: boolean // True when player returned safely this round
}

// Dice values (each die has 1,1,2,2,3,3)
export type DieValue = 1 | 2 | 3

export interface DiceRoll {
  die1: DieValue
  die2: DieValue
  total: number
  movement: number // total - treasures held (min 0)
}

// Turn phases for state machine
export type TurnPhase =
  | 'setup' // Selecting player count
  | 'pre_roll' // Before rolling, can turn around
  | 'rolling' // Dice animation
  | 'moving' // Diver moving animation
  | 'action' // Pick up or drop decision
  | 'turn_end' // Processing turn end
  | 'round_end' // Oxygen depleted, processing
  | 'round_summary' // Showing round results
  | 'game_end' // Final scores

export interface RoundState {
  roundNumber: 1 | 2 | 3
  oxygen: number // Shared oxygen (starts at 25)
  path: PathSpace[] // The treasure path
}

export interface GameState {
  players: Player[]
  currentPlayerIndex: number
  round: RoundState
  turnPhase: TurnPhase
  lastDiceRoll: DiceRoll | null
  startingPlayerIndex: number // Rotates each round
}

// Path node for rendering positions
export interface PathNode {
  index: number
  x: number
  y: number
}

// Bubble particle effect
export interface BubbleParticle {
  x: number
  y: number
  vy: number // Upward velocity
  size: number
  opacity: number
  life: number
  maxLife: number
}

// Animation state for visual feedback
export type AnimationState =
  | { type: 'idle' }
  | { type: 'rolling'; startTime: number }
  | { type: 'moving'; fromPosition: number; toPosition: number; progress: number }
  | { type: 'pickup' }
  | { type: 'drop' }
