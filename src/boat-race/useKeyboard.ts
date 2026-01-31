import { useEffect, useRef, MutableRefObject } from 'react'
import { KeyState } from './types'

interface UseKeyboardResult {
  keys1: KeyState // Arrow keys (Player 1)
  keys2: KeyState // WASD keys (Player 2)
  onRestartRef: MutableRefObject<(() => void) | null>
}

export function useKeyboard(): UseKeyboardResult {
  const keys1 = useRef<KeyState>({
    up: false,
    down: false,
    left: false,
    right: false,
  })
  const keys2 = useRef<KeyState>({
    up: false,
    down: false,
    left: false,
    right: false,
  })
  const onRestartRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        // Player 1 - Arrow keys
        case 'ArrowUp':
          keys1.current.up = true
          e.preventDefault()
          break
        case 'ArrowDown':
          keys1.current.down = true
          e.preventDefault()
          break
        case 'ArrowLeft':
          keys1.current.left = true
          e.preventDefault()
          break
        case 'ArrowRight':
          keys1.current.right = true
          e.preventDefault()
          break
        // Player 2 - WASD keys
        case 'w':
        case 'W':
          keys2.current.up = true
          e.preventDefault()
          break
        case 's':
        case 'S':
          keys2.current.down = true
          e.preventDefault()
          break
        case 'a':
        case 'A':
          keys2.current.left = true
          e.preventDefault()
          break
        case 'd':
        case 'D':
          keys2.current.right = true
          e.preventDefault()
          break
        case ' ':
          e.preventDefault()
          onRestartRef.current?.()
          break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key) {
        // Player 1 - Arrow keys
        case 'ArrowUp':
          keys1.current.up = false
          break
        case 'ArrowDown':
          keys1.current.down = false
          break
        case 'ArrowLeft':
          keys1.current.left = false
          break
        case 'ArrowRight':
          keys1.current.right = false
          break
        // Player 2 - WASD keys
        case 'w':
        case 'W':
          keys2.current.up = false
          break
        case 's':
        case 'S':
          keys2.current.down = false
          break
        case 'a':
        case 'A':
          keys2.current.left = false
          break
        case 'd':
        case 'D':
          keys2.current.right = false
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  return { keys1: keys1.current, keys2: keys2.current, onRestartRef }
}
