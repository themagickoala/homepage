// ============================================
// Game Menu Component
// ============================================
// Main pause menu with save/load and options

import { useCallback, useEffect, useMemo, useState } from 'react'
import { PartyMember, ShieldToken } from '../types'
import { calculateTokenBonuses } from '../data/shield-tokens'
import './GameMenu.css'

interface GameMenuProps {
  party: PartyMember[]
  shieldTokens: ShieldToken[]
  playTime: number
  onResume: () => void
  onInventory: () => void
  onSkillTree: () => void
  onSave: () => string // Returns save code
  onLoad: (saveCode: string) => boolean // Returns success
  onQuit: () => void
}

type MenuSection = 'main' | 'status' | 'status_detail' | 'save' | 'load'

const STAT_KEYS = ['maxHp', 'maxMp', 'attack', 'defense', 'speed'] as const
const STAT_LABELS: Record<(typeof STAT_KEYS)[number], string> = {
  maxHp: 'Max HP',
  maxMp: 'Max MP',
  attack: 'ATK',
  defense: 'DEF',
  speed: 'SPD',
}

function getEquipmentBonuses(member: PartyMember) {
  const bonuses = { maxHp: 0, maxMp: 0, attack: 0, defense: 0, speed: 0 }
  for (const slot of ['weapon', 'armor', 'accessory'] as const) {
    const item = member.equipment[slot]
    if (item?.equipStats) {
      for (const key of STAT_KEYS) {
        bonuses[key] += (item.equipStats as Record<string, number>)[key] || 0
      }
    }
  }
  return bonuses
}

export function GameMenu({
  party,
  shieldTokens,
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
  const [selectedMemberIndex, setSelectedMemberIndex] = useState(0)
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
    { label: 'Status', action: () => { setSection('status'); setSelectedIndex(0) } },
    { label: 'Save', action: () => setSection('save') },
    { label: 'Load', action: () => setSection('load') },
    { label: 'Quit', action: onQuit },
  ], [onResume, onInventory, onSkillTree, onQuit])

  const tokenBonuses = useMemo(() => calculateTokenBonuses(shieldTokens), [shieldTokens])

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

      if (section === 'status_detail') {
        if (e.key === 'Escape') {
          setSection('status')
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
          } else if (section === 'status') {
            setSelectedMemberIndex(selectedIndex)
            setSection('status_detail')
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

  // Selected member for detail view
  const detailMember = party[selectedMemberIndex]

  return (
    <div className="game-menu-overlay">
      <div className={`game-menu-panel ${section === 'status_detail' ? 'wide' : ''}`}>
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
            {party.map((member, index) => (
              <div
                key={member.id}
                className={`status-card ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedIndex(index)
                  setSelectedMemberIndex(index)
                  setSection('status_detail')
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                {index === selectedIndex && <span className="status-cursor">▶</span>}
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

        {section === 'status_detail' && detailMember && (() => {
          const equipBonuses = getEquipmentBonuses(detailMember)
          return (
            <div className="status-detail">
              <h3>{detailMember.name}</h3>
              <div className="detail-header">
                <span className="detail-level">Level {detailMember.stats.level}</span>
                <div className="detail-xp">
                  <span className="bar-label">XP</span>
                  <div className="bar-container">
                    <div
                      className="bar-fill xp"
                      style={{
                        width: `${(detailMember.stats.experience / detailMember.stats.experienceToNextLevel) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="bar-value">
                    {detailMember.stats.experience}/{detailMember.stats.experienceToNextLevel}
                  </span>
                </div>
              </div>

              <div className="detail-equipment">
                <h4>Equipment</h4>
                <div className="equip-slot">
                  <span className="slot-label">Weapon</span>
                  <span className={`slot-value ${detailMember.equipment.weapon ? '' : 'empty'}`}>
                    {detailMember.equipment.weapon?.name || 'Empty'}
                  </span>
                </div>
                <div className="equip-slot">
                  <span className="slot-label">Armor</span>
                  <span className={`slot-value ${detailMember.equipment.armor ? '' : 'empty'}`}>
                    {detailMember.equipment.armor?.name || 'Empty'}
                  </span>
                </div>
                <div className="equip-slot">
                  <span className="slot-label">Accessory</span>
                  <span className={`slot-value ${detailMember.equipment.accessory ? '' : 'empty'}`}>
                    {detailMember.equipment.accessory?.name || 'Empty'}
                  </span>
                </div>
              </div>

              <div className="detail-stats-table">
                <h4>Stats</h4>
                <div className="stats-header-row">
                  <span className="stat-name-col"></span>
                  <span className="stat-col">Base</span>
                  <span className="stat-col">Equip</span>
                  <span className="stat-col">Token</span>
                  <span className="stat-col total-col">Total</span>
                </div>
                {STAT_KEYS.map((key) => {
                  const total = detailMember.stats[key]
                  const equip = equipBonuses[key]
                  const token = tokenBonuses[key]
                  const base = total - equip - token

                  return (
                    <div key={key} className="stats-row">
                      <span className="stat-name-col">{STAT_LABELS[key]}</span>
                      <span className="stat-col">{base}</span>
                      <span className={`stat-col ${equip > 0 ? 'bonus-positive' : equip < 0 ? 'bonus-negative' : ''}`}>
                        {equip !== 0 ? (equip > 0 ? `+${equip}` : `${equip}`) : '-'}
                      </span>
                      <span className={`stat-col ${token > 0 ? 'bonus-positive' : ''}`}>
                        {token > 0 ? `+${token}` : '-'}
                      </span>
                      <span className="stat-col total-col">{total}</span>
                    </div>
                  )
                })}
              </div>

              <button className="back-button" onClick={() => setSection('status')}>
                Back
              </button>
            </div>
          )
        })()}

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
          <span>
            {section === 'status'
              ? '↑↓ Navigate | Enter: Inspect | Esc: Back'
              : `↑↓ Navigate | Enter: Select | Esc: ${section === 'main' ? 'Close' : 'Back'}`}
          </span>
        </div>
      </div>
    </div>
  )
}
