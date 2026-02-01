// ============================================
// Dialogue UI Component
// ============================================
// Displays NPC dialogue with speaker names and text

import { useCallback, useEffect, useState } from 'react'
import { Dialogue } from '../types'
import './DialogueUI.css'

interface DialogueUIProps {
  dialogue: Dialogue
  onComplete: () => void
  onChoice?: (choiceIndex: number) => void
}

export function DialogueUI({ dialogue, onComplete, onChoice }: DialogueUIProps) {
  const [currentNodeId, setCurrentNodeId] = useState(dialogue.startNodeId)
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(true)

  const currentNode = dialogue.nodes.find((n) => n.id === currentNodeId)
  const currentLine = currentNode?.lines[currentLineIndex]

  // Typewriter effect
  useEffect(() => {
    if (!currentLine) return

    setIsTyping(true)
    setDisplayedText('')

    let charIndex = 0
    const text = currentLine.text
    const typeInterval = setInterval(() => {
      if (charIndex < text.length) {
        setDisplayedText(text.substring(0, charIndex + 1))
        charIndex++
      } else {
        setIsTyping(false)
        clearInterval(typeInterval)
      }
    }, 30)

    return () => clearInterval(typeInterval)
  }, [currentLine])

  // Handle advancing dialogue
  const handleAdvance = useCallback(() => {
    if (!currentNode) return

    if (isTyping) {
      // Skip to end of current line
      setDisplayedText(currentLine?.text || '')
      setIsTyping(false)
      return
    }

    // Check if there are more lines in current node
    if (currentLineIndex < currentNode.lines.length - 1) {
      setCurrentLineIndex((prev) => prev + 1)
      return
    }

    // Check for choices
    if (currentNode.choices && currentNode.choices.length > 0) {
      // Wait for choice selection
      return
    }

    // Move to next node
    if (currentNode.nextNodeId) {
      const nextNode = dialogue.nodes.find((n) => n.id === currentNode.nextNodeId)
      if (nextNode) {
        setCurrentNodeId(currentNode.nextNodeId)
        setCurrentLineIndex(0)
        return
      }
    }

    // Dialogue complete
    onComplete()
  }, [currentNode, currentLine, currentLineIndex, isTyping, dialogue, onComplete])

  // Handle choice selection
  const handleChoice = useCallback(
    (index: number) => {
      if (!currentNode?.choices) return

      const choice = currentNode.choices[index]
      onChoice?.(index)

      if (choice.nextNodeId) {
        setCurrentNodeId(choice.nextNodeId)
        setCurrentLineIndex(0)
      } else {
        onComplete()
      }
    },
    [currentNode, onChoice, onComplete]
  )

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleAdvance()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleAdvance])

  if (!currentNode || !currentLine) return null

  const showChoices =
    !isTyping &&
    currentLineIndex === currentNode.lines.length - 1 &&
    currentNode.choices &&
    currentNode.choices.length > 0

  return (
    <div className="dialogue-overlay">
      <div className="dialogue-box">
        {currentLine.speaker && (
          <div className="dialogue-speaker">{currentLine.speaker}</div>
        )}

        <div className="dialogue-text">{displayedText}</div>

        {showChoices ? (
          <div className="dialogue-choices">
            {currentNode.choices!.map((choice, index) => (
              <button
                key={index}
                className="dialogue-choice"
                onClick={() => handleChoice(index)}
              >
                {choice.text}
              </button>
            ))}
          </div>
        ) : (
          <div className="dialogue-prompt">
            {isTyping ? 'Click or press Enter to skip...' : 'Press Enter to continue ▼'}
          </div>
        )}
      </div>
    </div>
  )
}
