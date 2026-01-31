import { Treasure, TreasureLevel, PathSpace } from './types'

// Treasure visual configuration
export const TREASURE_CONFIG: Record<
  TreasureLevel,
  {
    shape: 'triangle' | 'square' | 'hexagon' | 'octagon'
    color: string
    dotColor: string
    pointRange: [number, number]
  }
> = {
  1: { shape: 'triangle', color: '#87CEEB', dotColor: '#FFFFFF', pointRange: [0, 3] },
  2: { shape: 'square', color: '#4682B4', dotColor: '#FFFFFF', pointRange: [4, 7] },
  3: { shape: 'hexagon', color: '#2E5A88', dotColor: '#FFFFFF', pointRange: [8, 11] },
  4: { shape: 'octagon', color: '#1a1a4e', dotColor: '#FFFFFF', pointRange: [12, 15] },
}

let treasureIdCounter = 0

function generateTreasureId(): string {
  return `treasure_${treasureIdCounter++}`
}

// Generate random points within the level's range
function generatePoints(level: TreasureLevel): number {
  const [min, max] = TREASURE_CONFIG[level].pointRange
  return min + Math.floor(Math.random() * (max - min + 1))
}

// Create a single treasure
export function createTreasure(level: TreasureLevel): Treasure {
  return {
    id: generateTreasureId(),
    level,
    points: generatePoints(level),
    isMegaTreasure: false,
    componentCount: 1,
  }
}

// Create a mega-treasure from dropped treasures (grouped in 3s)
export function createMegaTreasure(treasures: Treasure[]): Treasure {
  const totalPoints = treasures.reduce((sum, t) => sum + t.points, 0)
  const maxLevel = Math.max(...treasures.map(t => t.level)) as TreasureLevel

  return {
    id: generateTreasureId(),
    level: maxLevel,
    points: totalPoints,
    isMegaTreasure: true,
    componentCount: treasures.length,
  }
}

// Create the initial path with 32 treasures (8 of each level)
export function createInitialPath(): PathSpace[] {
  const treasures: Treasure[] = []

  // Create 8 treasures of each level (2 of each point value)
  for (let level = 1; level <= 4; level++) {
    const [min, max] = TREASURE_CONFIG[level as TreasureLevel].pointRange
    // Create 2 treasures for each point value in the range
    for (let points = min; points <= max; points++) {
      treasures.push({
        id: generateTreasureId(),
        level: level as TreasureLevel,
        points,
        isMegaTreasure: false,
        componentCount: 1,
      })
      treasures.push({
        id: generateTreasureId(),
        level: level as TreasureLevel,
        points,
        isMegaTreasure: false,
        componentCount: 1,
      })
    }
  }

  // Shuffle treasures
  for (let i = treasures.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[treasures[i], treasures[j]] = [treasures[j], treasures[i]]
  }

  // Sort by level to arrange path: level 1 first, then 2, 3, 4
  treasures.sort((a, b) => a.level - b.level)

  // Convert to path spaces
  return treasures.map(treasure => ({
    type: 'treasure' as const,
    treasure,
  }))
}

// Prepare path for next round: remove empty spaces, add mega-treasures
export function preparePathForNextRound(
  path: PathSpace[],
  droppedTreasures: Treasure[]
): PathSpace[] {
  // Filter out empty and removed spaces, keep only treasures
  const remainingSpaces = path.filter(
    space => space.type === 'treasure'
  )

  // Group dropped treasures into mega-treasures (groups of 3)
  const megaTreasures: Treasure[] = []
  for (let i = 0; i < droppedTreasures.length; i += 3) {
    const group = droppedTreasures.slice(i, i + 3)
    if (group.length > 0) {
      megaTreasures.push(createMegaTreasure(group))
    }
  }

  // Add mega-treasures to the end of the path
  const megaSpaces: PathSpace[] = megaTreasures.map(treasure => ({
    type: 'treasure' as const,
    treasure,
  }))

  return [...remainingSpaces, ...megaSpaces]
}

// Get the actual path length (excluding removed spaces)
export function getPathLength(path: PathSpace[]): number {
  return path.filter(space => space.type !== 'removed').length
}

// Get the space at a given position (accounting for removed spaces)
export function getSpaceAtPosition(path: PathSpace[], position: number): PathSpace | null {
  let count = 0
  for (const space of path) {
    if (space.type !== 'removed') {
      if (count === position) {
        return space
      }
      count++
    }
  }
  return null
}

// Get the actual index in the path array for a given position
export function getPathIndexForPosition(path: PathSpace[], position: number): number {
  let count = 0
  for (let i = 0; i < path.length; i++) {
    if (path[i].type !== 'removed') {
      if (count === position) {
        return i
      }
      count++
    }
  }
  return -1
}
