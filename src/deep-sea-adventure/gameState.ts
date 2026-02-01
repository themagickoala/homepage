import {
  GameState,
  Player,
  PlayerColor,
  RoundState,
  TurnPhase,
  DiceRoll,
  Treasure,
} from './types'
import { createPlayers, resetPlayerForNewRound, isPlayerActive, drownPlayer, calculateScore } from './player'
import { createInitialPath, preparePathForNextRound } from './treasure'
import { rollDice } from './dice'

const INITIAL_OXYGEN = 25

// Create initial game state
export function createGameState(selectedColors: PlayerColor[]): GameState {
  const players = createPlayers(selectedColors)
  const startingPlayer = Math.floor(Math.random() * selectedColors.length)

  return {
    players,
    currentPlayerIndex: startingPlayer,
    round: createInitialRound(),
    turnPhase: 'pre_roll',
    lastDiceRoll: null,
    startingPlayerIndex: startingPlayer,
  }
}

// Create initial round state
function createInitialRound(): RoundState {
  return {
    roundNumber: 1,
    oxygen: INITIAL_OXYGEN,
    path: createInitialPath(),
  }
}

// Get current player
export function getCurrentPlayer(state: GameState): Player {
  return state.players[state.currentPlayerIndex]
}

// Get other player positions (for skipping occupied spaces)
export function getOtherPlayerPositions(state: GameState): number[] {
  return state.players
    .filter((_, i) => i !== state.currentPlayerIndex)
    .filter(p => !p.isInSubmarine)
    .map(p => p.position)
}

// Deplete oxygen at start of turn
export function depleteOxygen(state: GameState): GameState {
  const player = getCurrentPlayer(state)
  const oxygenLoss = player.heldTreasures.length
  const newOxygen = Math.max(0, state.round.oxygen - oxygenLoss)

  return {
    ...state,
    round: {
      ...state.round,
      oxygen: newOxygen,
    },
  }
}

// Check if oxygen is depleted
export function isOxygenDepleted(state: GameState): boolean {
  return state.round.oxygen <= 0
}

// Handle turn around action
export function handleTurnAround(state: GameState): GameState {
  const player = getCurrentPlayer(state)
  if (player.direction === 'down' && !player.isInSubmarine) {
    const updatedPlayers = [...state.players]
    updatedPlayers[state.currentPlayerIndex] = {
      ...player,
      direction: 'up',
    }
    return { ...state, players: updatedPlayers }
  }
  return state
}

// Handle dice roll
export function handleRollDice(state: GameState): { state: GameState; roll: DiceRoll } {
  const player = getCurrentPlayer(state)
  const roll = rollDice(player.heldTreasures.length)

  return {
    state: {
      ...state,
      lastDiceRoll: roll,
      turnPhase: 'rolling',
    },
    roll,
  }
}

// Handle movement after dice roll animation
export function handleMove(state: GameState): GameState {
  if (!state.lastDiceRoll) return state

  const player = getCurrentPlayer(state)
  const movement = state.lastDiceRoll.movement
  const otherPositions = getOtherPlayerPositions(state)

  // Calculate new position
  let newPosition: number
  let spacesToMove = movement

  if (player.isInSubmarine) {
    // Starting from submarine
    newPosition = -1
    let currentPos = -1

    while (spacesToMove > 0 && currentPos < state.round.path.length - 1) {
      currentPos++
      const space = state.round.path[currentPos]
      if (space.type !== 'removed' && !otherPositions.includes(currentPos)) {
        spacesToMove--
        newPosition = currentPos
      }
    }

    if (newPosition === -1 && movement > 0) {
      newPosition = 0 // At least move to first space
    }
  } else if (player.direction === 'down') {
    // Moving down (away from submarine)
    newPosition = player.position

    while (spacesToMove > 0 && newPosition < state.round.path.length - 1) {
      newPosition++
      const space = state.round.path[newPosition]
      if (space.type !== 'removed' && !otherPositions.includes(newPosition)) {
        spacesToMove--
      }
    }
  } else {
    // Moving up (toward submarine)
    newPosition = player.position

    while (spacesToMove > 0) {
      newPosition--
      if (newPosition < 0) {
        // Reached submarine
        newPosition = -1
        break
      }
      const space = state.round.path[newPosition]
      if (space.type !== 'removed' && !otherPositions.includes(newPosition)) {
        spacesToMove--
      }
    }
  }

  // Update player position
  const updatedPlayers = [...state.players]
  const updatedPlayer = { ...player }

  if (newPosition < 0) {
    // Returned to submarine - score treasures
    updatedPlayer.position = -1
    updatedPlayer.isInSubmarine = true
    updatedPlayer.hasReturnedToSubmarine = true
    updatedPlayer.scoredTreasures = [...player.scoredTreasures, ...player.heldTreasures]
    updatedPlayer.heldTreasures = []
  } else {
    updatedPlayer.position = newPosition
    updatedPlayer.isInSubmarine = false
  }

  updatedPlayers[state.currentPlayerIndex] = updatedPlayer

  // Determine next phase
  let nextPhase: TurnPhase = 'turn_end'
  if (!updatedPlayer.isInSubmarine) {
    const space = state.round.path[newPosition]
    if (space.type === 'treasure' || space.type === 'empty') {
      nextPhase = 'action'
    }
  }

  return {
    ...state,
    players: updatedPlayers,
    turnPhase: nextPhase,
  }
}

// Handle picking up treasure
export function handlePickUpTreasure(state: GameState): GameState {
  const player = getCurrentPlayer(state)
  if (player.isInSubmarine) return state

  const space = state.round.path[player.position]
  if (space.type !== 'treasure') return state

  // Add treasure to player's held treasures
  const updatedPlayers = [...state.players]
  updatedPlayers[state.currentPlayerIndex] = {
    ...player,
    heldTreasures: [...player.heldTreasures, space.treasure],
  }

  // Replace space with empty
  const updatedPath = [...state.round.path]
  updatedPath[player.position] = { type: 'empty' }

  return {
    ...state,
    players: updatedPlayers,
    round: {
      ...state.round,
      path: updatedPath,
    },
    turnPhase: 'turn_end',
  }
}

// Handle dropping treasure
export function handleDropTreasure(state: GameState, treasureIndex: number): GameState {
  const player = getCurrentPlayer(state)
  if (player.isInSubmarine) return state
  if (treasureIndex < 0 || treasureIndex >= player.heldTreasures.length) return state

  const space = state.round.path[player.position]
  if (space.type !== 'empty') return state

  const droppedTreasure = player.heldTreasures[treasureIndex]

  // Remove treasure from player
  const updatedPlayers = [...state.players]
  updatedPlayers[state.currentPlayerIndex] = {
    ...player,
    heldTreasures: player.heldTreasures.filter((_, i) => i !== treasureIndex),
  }

  // Replace empty space with treasure
  const updatedPath = [...state.round.path]
  updatedPath[player.position] = { type: 'treasure', treasure: droppedTreasure }

  return {
    ...state,
    players: updatedPlayers,
    round: {
      ...state.round,
      path: updatedPath,
    },
    turnPhase: 'turn_end',
  }
}

// Skip action (continue without picking up or dropping)
export function handleSkipAction(state: GameState): GameState {
  return {
    ...state,
    turnPhase: 'turn_end',
  }
}

// Move to next player's turn
export function nextTurn(state: GameState): GameState {
  // Check if all players are in submarine or drowned
  const activePlayers = state.players.filter(p => isPlayerActive(p))

  if (activePlayers.length === 0) {
    // Round ends
    return { ...state, turnPhase: 'round_end' }
  }

  // Find next active player
  let nextIndex = (state.currentPlayerIndex + 1) % state.players.length
  let attempts = 0

  while (attempts < state.players.length) {
    const nextPlayer = state.players[nextIndex]
    if (!nextPlayer.hasReturnedToSubmarine && !nextPlayer.drownedThisRound) {
      break
    }
    nextIndex = (nextIndex + 1) % state.players.length
    attempts++
  }

  if (attempts >= state.players.length) {
    // No active players found
    return { ...state, turnPhase: 'round_end' }
  }

  // Start next player's turn with oxygen depletion
  let newState: GameState = {
    ...state,
    currentPlayerIndex: nextIndex,
    turnPhase: 'pre_roll',
    lastDiceRoll: null,
  }

  // Deplete oxygen for the new player
  newState = depleteOxygen(newState)

  // Check if oxygen depleted
  if (isOxygenDepleted(newState)) {
    return { ...newState, turnPhase: 'round_end' }
  }

  return newState
}

// Handle round end
export function handleRoundEnd(state: GameState): GameState {
  // Drown all players who haven't returned
  const updatedPlayers = state.players.map(player => {
    if (!player.isInSubmarine && !player.drownedThisRound) {
      return drownPlayer(player).player
    }
    return player
  })

  return {
    ...state,
    players: updatedPlayers,
    turnPhase: 'round_summary',
  }
}

// Start next round
export function startNextRound(state: GameState): GameState | null {
  const currentRound = state.round.roundNumber

  if (currentRound >= 3) {
    // Game over
    return {
      ...state,
      turnPhase: 'game_end',
    }
  }

  // Collect dropped treasures from players who drowned
  const droppedTreasures: Treasure[] = state.players
    .filter(p => p.drownedThisRound)
    .flatMap(p => p.heldTreasures)

  // Prepare path for next round
  const newPath = preparePathForNextRound(state.round.path, droppedTreasures)

  // Reset players
  const updatedPlayers = state.players.map(p => resetPlayerForNewRound(p))

  // Rotate starting player
  const newStartingPlayer = (state.startingPlayerIndex + 1) % state.players.length

  return {
    ...state,
    players: updatedPlayers,
    currentPlayerIndex: newStartingPlayer,
    round: {
      roundNumber: (currentRound + 1) as 1 | 2 | 3,
      oxygen: INITIAL_OXYGEN,
      path: newPath,
    },
    turnPhase: 'pre_roll',
    lastDiceRoll: null,
    startingPlayerIndex: newStartingPlayer,
  }
}

// Get final rankings
export function getFinalRankings(state: GameState): Array<{ player: Player; score: number; rank: number }> {
  const scores = state.players.map(player => ({
    player,
    score: calculateScore(player),
    rank: 0,
  }))

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score)

  // Assign ranks (handle ties)
  let currentRank = 1
  for (let i = 0; i < scores.length; i++) {
    if (i > 0 && scores[i].score < scores[i - 1].score) {
      currentRank = i + 1
    }
    scores[i].rank = currentRank
  }

  return scores
}

// Check what actions are available for current player
export function getAvailableActions(state: GameState): {
  canTurnAround: boolean
  canRoll: boolean
  canPickUp: boolean
  canDrop: boolean
  canSkip: boolean
} {
  const player = getCurrentPlayer(state)

  if (state.turnPhase === 'pre_roll') {
    return {
      canTurnAround: player.direction === 'down' && !player.isInSubmarine,
      canRoll: true,
      canPickUp: false,
      canDrop: false,
      canSkip: false,
    }
  }

  if (state.turnPhase === 'action') {
    const space = state.round.path[player.position]
    return {
      canTurnAround: false,
      canRoll: false,
      canPickUp: space.type === 'treasure',
      canDrop: space.type === 'empty' && player.heldTreasures.length > 0,
      canSkip: true,
    }
  }

  return {
    canTurnAround: false,
    canRoll: false,
    canPickUp: false,
    canDrop: false,
    canSkip: false,
  }
}
