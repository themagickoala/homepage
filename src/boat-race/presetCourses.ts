import { Course, Vector2D } from './types'

export interface PresetCourse {
  id: string
  name: string
  description: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  course: Course
}

// Helper to calculate start rotation from first two checkpoints
function calculateStartRotation(checkpoints: Vector2D[]): number {
  const first = checkpoints[0]
  const second = checkpoints[1]
  return Math.atan2(second.y - first.y, second.x - first.x)
}

// Course 1: Oval Sprint - A simple oval course for beginners
const ovalSprintCheckpoints: Vector2D[] = [
  { x: 100, y: 400 },
  { x: 200, y: 200 },
  { x: 400, y: 120 },
  { x: 600, y: 120 },
  { x: 800, y: 120 },
  { x: 1000, y: 200 },
  { x: 1100, y: 400 },
  { x: 1000, y: 600 },
  { x: 800, y: 680 },
  { x: 600, y: 680 },
  { x: 400, y: 680 },
  { x: 200, y: 600 },
]

const ovalSprint: PresetCourse = {
  id: 'oval-sprint',
  name: 'Oval Sprint',
  description: 'A classic oval track. Perfect for learning the ropes.',
  difficulty: 'Easy',
  course: {
    width: 1200,
    height: 800,
    checkpoints: ovalSprintCheckpoints,
    startPosition: ovalSprintCheckpoints[0],
    startRotation: calculateStartRotation(ovalSprintCheckpoints),
  },
}

// Course 2: Figure Eight - A crossing course requiring precision
const figureEightCheckpoints: Vector2D[] = [
  { x: 150, y: 400 },
  { x: 250, y: 250 },
  { x: 450, y: 150 },
  { x: 600, y: 250 },
  { x: 750, y: 400 },
  { x: 900, y: 550 },
  { x: 1050, y: 650 },
  { x: 1100, y: 500 },
  { x: 1050, y: 350 },
  { x: 900, y: 250 },
  { x: 750, y: 400 },
  { x: 600, y: 550 },
  { x: 450, y: 650 },
  { x: 250, y: 550 },
]

const figureEight: PresetCourse = {
  id: 'figure-eight',
  name: 'Figure Eight',
  description: 'A challenging figure-8 course with a tricky crossover.',
  difficulty: 'Medium',
  course: {
    width: 1200,
    height: 800,
    checkpoints: figureEightCheckpoints,
    startPosition: figureEightCheckpoints[0],
    startRotation: calculateStartRotation(figureEightCheckpoints),
  },
}

// Course 3: Serpent's Path - A winding course with tight turns
const serpentPathCheckpoints: Vector2D[] = [
  { x: 80, y: 700 },
  { x: 200, y: 550 },
  { x: 350, y: 400 },
  { x: 250, y: 250 },
  { x: 400, y: 150 },
  { x: 600, y: 200 },
  { x: 750, y: 350 },
  { x: 650, y: 500 },
  { x: 800, y: 650 },
  { x: 950, y: 500 },
  { x: 1050, y: 300 },
  { x: 1100, y: 150 },
]

const serpentPath: PresetCourse = {
  id: 'serpent-path',
  name: "Serpent's Path",
  description: 'A winding course with tight turns. Only for experts!',
  difficulty: 'Hard',
  course: {
    width: 1200,
    height: 800,
    checkpoints: serpentPathCheckpoints,
    startPosition: serpentPathCheckpoints[0],
    startRotation: calculateStartRotation(serpentPathCheckpoints),
  },
}

export const PRESET_COURSES: PresetCourse[] = [ovalSprint, figureEight, serpentPath]

export function getPresetCourse(id: string): PresetCourse | undefined {
  return PRESET_COURSES.find((c) => c.id === id)
}
