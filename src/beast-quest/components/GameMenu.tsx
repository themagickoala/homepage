// ============================================
// Game Menu Component
// ============================================
// Main pause menu with save/load and options

import { useCallback, useEffect, useMemo, useState } from 'react'
import { PartyMember } from '../types'
import './GameMenu.css'

interface GameMenuProps {
  party: PartyMember[]
  playTime: number
  onResume: () => void
  onInventory: () => void
  onSkillTree: () => void
  onSave: () => string // Returns save code
  onLoad: (saveCode: string) => boolean // Returns success
  onQuit: () => void
}

type MenuSection = 'main' | 'status' | 'save' | 'load'

export function GameMenu({
  party,
  playTime,
  onResume,
  onInventory,
  onSkillTree,
  onSave,
  onLoad,
  onQuit,
}: GameMenuProps) {
  const [section, setSection] = useState<MenuSection>('main')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [saveCode, setSaveCode] = useState('')
  const [loadCode, setLoadCode] = useState('')
  const [message, setMessage] = useState('')

  // Format play time
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // Main menu options - memoized to prevent useEffect re-running
  const mainOptions = useMemo(() => [
    { label: 'Resume', action: onResume },
    { label: 'Inventory', action: onInventory },
    { label: 'Skills', action: onSkillTree },
    { label: 'Status', action: () => setSection('status') },
    { label: 'Save', action: () => setSection('save') },
    { label: 'Load', action: () => setSection('load') },
    { label: 'Quit', action: onQuit },
  ], [onResume, onInventory, onSkillTree, onQuit])

  // Handle save
  const handleSave = useCallback(() => {
    const code = onSave()
    setSaveCode(code)
    setMessage('Game saved! Copy the code below:')
  }, [onSave])

  // Handle load
  const handleLoad = useCallback(() => {
    if (!loadCode.trim()) {
      setMessage('Please enter a save code')
      return
    }
    const success = onLoad(loadCode)
    if (success) {
      setMessage('Game loaded successfully!')
      setTimeout(onResume, 1000)
    } else {
      setMessage('Invalid save code')
    }
  }, [loadCode, onLoad, onResume])

  // Copy save code to clipboard
  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(saveCode)
    setMessage('Copied to clipboard!')
  }, [saveCode])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (section === 'save' || section === 'load') {
        if (e.key === 'Escape') {
          setSection('main')
          setMessage('')
        }
        return
      }

      switch (e.key) {
        case 'ArrowUp':
          setSelectedIndex((prev) => Math.max(0, prev - 1))
          break
        case 'ArrowDown':
          setSelectedIndex((prev) =>
            Math.min(
              section === 'main' ? mainOptions.length - 1 : party.length - 1,
              prev + 1
            )
          )
          break
        case 'Enter':
        case ' ':
          if (section === 'main') {
            mainOptions[selectedIndex].action()
          }
          break
        case 'Escape':
          if (section === 'status') {
            setSection('main')
          } else {
            onResume()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [section, selectedIndex, mainOptions, party, onResume])

  return (
    <div className="game-menu-overlay">
      <div className="game-menu-panel">
        <div className="menu-header">
          <h2>Menu</h2>
          <span className="play-time">Time: {formatTime(playTime)}</span>
        </div>

        {section === 'main' && (
          <div className="menu-options">
            {mainOptions.map((option, index) => (
              <button
                key={option.label}
                className={`menu-option ${index === selectedIndex ? 'selected' : ''}`}
                onClick={option.action}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                {index === selectedIndex && <span className="cursor">▶</span>}
                {option.label}
              </button>
            ))}
          </div>
        )}

        {section === 'status' && (
          <div className="status-section">
            <h3>Party Status</h3>
            {party.map((member) => (
              <div key={member.id} className="status-card">
                <div className="status-header">
                  <span className="member-name">{member.name}</span>
                  <span className="member-level">Lv. {member.stats.level}</span>
                </div>
                <div className="status-bars">
                  <div className="stat-bar">
                    <span className="bar-label">HP</span>
                    <div className="bar-container">
                      <div
                        className="bar-fill hp"
                        style={{
                          width: `${(member.stats.currentHp / member.stats.maxHp) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="bar-value">
                      {member.stats.currentHp}/{member.stats.maxHp}
                    </span>
                  </div>
                  <div className="stat-bar">
                    <span className="bar-label">MP</span>
                    <div className="bar-container">
                      <div
                        className="bar-fill mp"
                        style={{
                          width: `${(member.stats.currentMp / member.stats.maxMp) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="bar-value">
                      {member.stats.currentMp}/{member.stats.maxMp}
                    </span>
                  </div>
                </div>
                <div className="status-stats">
                  <span>ATK: {member.stats.attack}</span>
                  <span>DEF: {member.stats.defense}</span>
                  <span>SPD: {member.stats.speed}</span>
                </div>
              </div>
            ))}
            <button className="back-button" onClick={() => setSection('main')}>
              Back
            </button>
          </div>
        )}

        {section === 'save' && (
          <div className="save-section">
            <h3>Save Game</h3>
            <p>Your game state will be saved as a code that you can store and use to continue later.</p>
            {saveCode ? (
              <>
                <textarea
                  className="save-code"
                  value={saveCode}
                  readOnly
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                />
                <button className="action-button" onClick={copyToClipboard}>
                  Copy to Clipboard
                </button>
              </>
            ) : (
              <button className="action-button" onClick={handleSave}>
                Generate Save Code
              </button>
            )}
            {message && <p className="message">{message}</p>}
            <button className="back-button" onClick={() => {
              setSection('main')
              setSaveCode('')
              setMessage('')
            }}>
              Back
            </button>
          </div>
        )}

        {section === 'load' && (
          <div className="load-section">
            <h3>Load Game</h3>
            <p>Paste your save code below to continue your adventure.</p>
            <textarea
              className="save-code"
              value={loadCode}
              onChange={(e) => setLoadCode(e.target.value)}
              placeholder="Paste save code here..."
            />
            <button className="action-button" onClick={handleLoad}>
              Load Game
            </button>
            {message && <p className="message">{message}</p>}
            <button className="back-button" onClick={() => {
              setSection('main')
              setLoadCode('')
              setMessage('')
            }}>
              Back
            </button>
          </div>
        )}

        <div className="menu-footer">
          <span>↑↓ Navigate | Enter: Select | Esc: {section === 'main' ? 'Close' : 'Back'}</span>
        </div>
      </div>
    </div>
  )
}
