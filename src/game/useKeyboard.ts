import { useEffect, useRef, MutableRefObject } from 'react'
import { KeyState } from './types'

interface UseKeyboardResult {
  keys: KeyState
  onRestartRef: MutableRefObject<(() => void) | null>
}

export function useKeyboard(): UseKeyboardResult {
  const keys = useRef<KeyState>({
    up: false,
    down: false,
    left: false,
    right: false,
  })
  const onRestartRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          keys.current.up = true
          e.preventDefault()
          break
        case 'ArrowDown':
          keys.current.down = true
          e.preventDefault()
          break
        case 'ArrowLeft':
          keys.current.left = true
          e.preventDefault()
          break
        case 'ArrowRight':
          keys.current.right = true
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
        case 'ArrowUp':
          keys.current.up = false
          break
        case 'ArrowDown':
          keys.current.down = false
          break
        case 'ArrowLeft':
          keys.current.left = false
          break
        case 'ArrowRight':
          keys.current.right = false
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

  return { keys: keys.current, onRestartRef }
}
