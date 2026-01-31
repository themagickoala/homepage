import { DieValue, DiceRoll } from './types'

// Each die has faces: 1, 1, 2, 2, 3, 3
export function rollDie(): DieValue {
  const roll = Math.floor(Math.random() * 6)
  if (roll < 2) return 1
  if (roll < 4) return 2
  return 3
}

// Roll both dice and calculate movement
export function rollDice(treasuresHeld: number): DiceRoll {
  const die1 = rollDie()
  const die2 = rollDie()
  const total = die1 + die2
  const movement = Math.max(0, total - treasuresHeld)

  return { die1, die2, total, movement }
}

// Get all possible dice outcomes (for display/testing)
export function getDiceOutcomes(): Array<{ die1: DieValue; die2: DieValue; total: number }> {
  const outcomes: Array<{ die1: DieValue; die2: DieValue; total: number }> = []
  const values: DieValue[] = [1, 2, 3]

  for (const die1 of values) {
    for (const die2 of values) {
      outcomes.push({ die1, die2, total: die1 + die2 })
    }
  }

  return outcomes
}

// Probability distribution for dice totals
// Total 2: 1/9, Total 3: 2/9, Total 4: 3/9, Total 5: 2/9, Total 6: 1/9
export const DICE_PROBABILITIES: Record<number, number> = {
  2: 1 / 9,
  3: 2 / 9,
  4: 3 / 9,
  5: 2 / 9,
  6: 1 / 9,
}
