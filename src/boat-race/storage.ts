import { BestTimes } from './types'

const STORAGE_KEY = 'boat-race-best-times'

export function loadBestTimes(): BestTimes {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Failed to load best times:', error)
  }
  return {}
}

export function saveBestTime(courseId: string, time: number): boolean {
  const bestTimes = loadBestTimes()
  const currentBest = bestTimes[courseId]

  // Only save if it's a new best time
  if (currentBest === undefined || time < currentBest) {
    bestTimes[courseId] = time
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bestTimes))
      return true // New best time!
    } catch (error) {
      console.error('Failed to save best time:', error)
    }
  }
  return false // Not a new best
}

export function getBestTime(courseId: string): number | null {
  const bestTimes = loadBestTimes()
  return bestTimes[courseId] ?? null
}

export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const milliseconds = Math.floor((ms % 1000) / 10)

  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`
  }
  return `${seconds}.${milliseconds.toString().padStart(2, '0')}`
}
