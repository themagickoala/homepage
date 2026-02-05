// ============================================
// Tutorial Overlay Component
// ============================================
// Reusable modal overlay for one-time tutorial messages

import { useCallback, useEffect } from 'react'
import { TutorialDef } from '../data/tutorials'
import './TutorialOverlay.css'

interface TutorialOverlayProps {
  tutorial: TutorialDef
  onDismiss: () => void
}

export function TutorialOverlay({ tutorial, onDismiss }: TutorialOverlayProps) {
  const stableDismiss = useCallback(() => {
    onDismiss()
  }, [onDismiss])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block all game input while tutorial is shown
      e.stopImmediatePropagation()

      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault()
        stableDismiss()
      }
    }

    // Capture phase intercepts before other handlers
    window.addEventListener('keydown', handleKeyDown, { capture: true })
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true })
  }, [stableDismiss])

  return (
    <div className="tutorial-overlay" onClick={stableDismiss}>
      <div className="tutorial-panel" onClick={(e) => e.stopPropagation()}>
        <h2 className="tutorial-title">{tutorial.title}</h2>
        <div className="tutorial-content">
          {tutorial.lines.map((line, i) => (
            <p key={i} className="tutorial-line">
              {line}
            </p>
          ))}
        </div>
        <div className="tutorial-footer">Press Enter to continue</div>
      </div>
    </div>
  )
}
