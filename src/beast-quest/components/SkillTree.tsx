// ============================================
// Skill Tree UI Component
// ============================================
// Displays character skill trees and allows learning new skills

import { useCallback, useEffect, useState } from 'react'
import { PartyMember, Skill, SkillTreeNode } from '../types'
import './SkillTree.css'

interface SkillTreeProps {
  party: PartyMember[]
  onLearnSkill: (characterId: string, skillId: string) => void
  onClose: () => void
}

type SkillStatus = 'unlocked' | 'available' | 'locked'

function getSkillStatus(
  node: SkillTreeNode,
  member: PartyMember
): { status: SkillStatus; reason?: string } {
  // Already unlocked
  if (member.unlockedSkillIds.includes(node.skill.id)) {
    return { status: 'unlocked' }
  }

  // Check level requirement
  if (member.stats.level < node.levelRequired) {
    return { status: 'locked', reason: `Requires Level ${node.levelRequired}` }
  }

  // Check prerequisites
  const missingPrereqs = node.prerequisiteSkillIds.filter(
    (id) => !member.unlockedSkillIds.includes(id)
  )
  if (missingPrereqs.length > 0) {
    return { status: 'locked', reason: 'Requires prerequisite skills' }
  }

  // Available to learn
  return { status: 'available' }
}

export function SkillTree({ party, onLearnSkill, onClose }: SkillTreeProps) {
  const [selectedMemberIndex, setSelectedMemberIndex] = useState(0)
  const [selectedSkillIndex, setSelectedSkillIndex] = useState(0)
  const [viewMode, setViewMode] = useState<'list' | 'details'>('list')

  const selectedMember = party[selectedMemberIndex]
  const skillNodes = selectedMember.skillTree

  // Get skill at index (sorted by level required)
  const sortedSkills = [...skillNodes].sort((a, b) => a.levelRequired - b.levelRequired)
  const selectedNode = sortedSkills[selectedSkillIndex]

  // Handle learning a skill
  const handleLearnSkill = useCallback(() => {
    if (!selectedNode) return

    const { status } = getSkillStatus(selectedNode, selectedMember)
    if (status === 'available') {
      onLearnSkill(selectedMember.id, selectedNode.skill.id)
    }
  }, [selectedNode, selectedMember, onLearnSkill])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          if (viewMode === 'list') {
            setSelectedSkillIndex((prev) => Math.max(0, prev - 1))
          }
          break
        case 'ArrowDown':
          e.preventDefault()
          if (viewMode === 'list') {
            setSelectedSkillIndex((prev) => Math.min(sortedSkills.length - 1, prev + 1))
          }
          break
        case 'ArrowLeft':
          e.preventDefault()
          setSelectedMemberIndex((prev) => Math.max(0, prev - 1))
          setSelectedSkillIndex(0)
          break
        case 'ArrowRight':
          e.preventDefault()
          setSelectedMemberIndex((prev) => Math.min(party.length - 1, prev + 1))
          setSelectedSkillIndex(0)
          break
        case 'Enter':
        case ' ':
          e.preventDefault()
          if (viewMode === 'list') {
            const { status } = getSkillStatus(selectedNode, selectedMember)
            if (status === 'available') {
              setViewMode('details')
            } else if (status === 'unlocked') {
              setViewMode('details')
            }
          } else {
            const { status } = getSkillStatus(selectedNode, selectedMember)
            if (status === 'available') {
              handleLearnSkill()
              setViewMode('list')
            } else {
              setViewMode('list')
            }
          }
          break
        case 'Escape':
          e.preventDefault()
          if (viewMode === 'details') {
            setViewMode('list')
          } else {
            onClose()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    party,
    sortedSkills,
    selectedNode,
    selectedMember,
    viewMode,
    handleLearnSkill,
    onClose,
  ])

  const getTargetTypeLabel = (targetType: Skill['targetType']) => {
    switch (targetType) {
      case 'single_enemy':
        return 'Single Enemy'
      case 'all_enemies':
        return 'All Enemies'
      case 'single_ally':
        return 'Single Ally'
      case 'all_allies':
        return 'All Allies'
      case 'self':
        return 'Self'
      default:
        return targetType
    }
  }

  return (
    <div className="skill-tree-overlay" onClick={onClose}>
      <div className="skill-tree-panel" onClick={(e) => e.stopPropagation()}>
        <div className="skill-tree-header">
          <h2>Skills</h2>
          <span className="member-level">Lv. {selectedMember.stats.level}</span>
        </div>

        {/* Character Tabs */}
        <div className="character-tabs">
          {party.map((member, index) => (
            <button
              key={member.id}
              className={`character-tab ${index === selectedMemberIndex ? 'active' : ''}`}
              onClick={() => {
                setSelectedMemberIndex(index)
                setSelectedSkillIndex(0)
              }}
            >
              {member.name}
            </button>
          ))}
        </div>

        <div className="skill-tree-content">
          {/* Skill List */}
          <div className="skill-list">
            {sortedSkills.map((node, index) => {
              const { status, reason } = getSkillStatus(node, selectedMember)
              return (
                <div
                  key={node.skill.id}
                  className={`skill-row ${status} ${index === selectedSkillIndex ? 'selected' : ''}`}
                  onClick={() => setSelectedSkillIndex(index)}
                  onDoubleClick={() => {
                    if (status === 'available') {
                      onLearnSkill(selectedMember.id, node.skill.id)
                    }
                  }}
                >
                  <div className="skill-icon">
                    {status === 'unlocked' && '✓'}
                    {status === 'available' && '★'}
                    {status === 'locked' && '🔒'}
                  </div>
                  <div className="skill-info">
                    <span className="skill-name">{node.skill.name}</span>
                    <span className="skill-level">Lv. {node.levelRequired}</span>
                  </div>
                  {status === 'locked' && reason && (
                    <span className="skill-reason">{reason}</span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Skill Details */}
          <div className="skill-details">
            {selectedNode && (
              <>
                <h3>{selectedNode.skill.name}</h3>
                <p className="skill-description">{selectedNode.skill.description}</p>

                <div className="skill-stats">
                  <div className="stat-row">
                    <span className="stat-label">Type:</span>
                    <span className="stat-value">{selectedNode.skill.type}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Target:</span>
                    <span className="stat-value">
                      {getTargetTypeLabel(selectedNode.skill.targetType)}
                    </span>
                  </div>
                  {selectedNode.skill.mpCost > 0 && (
                    <div className="stat-row">
                      <span className="stat-label">MP Cost:</span>
                      <span className="stat-value mp">{selectedNode.skill.mpCost}</span>
                    </div>
                  )}
                  {selectedNode.skill.power > 0 && (
                    <div className="stat-row">
                      <span className="stat-label">Power:</span>
                      <span className="stat-value">{selectedNode.skill.power}x</span>
                    </div>
                  )}
                  <div className="stat-row">
                    <span className="stat-label">Element:</span>
                    <span className="stat-value element">{selectedNode.skill.element}</span>
                  </div>
                </div>

                {selectedNode.skill.effects && selectedNode.skill.effects.length > 0 && (
                  <div className="skill-effects">
                    <h4>Effects</h4>
                    {selectedNode.skill.effects.map((effect, i) => (
                      <div key={i} className="effect-row">
                        {effect.type === 'buff' && (
                          <span>+{effect.value} {effect.stat} for {effect.duration} turns</span>
                        )}
                        {effect.type === 'debuff' && (
                          <span>{effect.value} {effect.stat} for {effect.duration} turns</span>
                        )}
                        {effect.type === 'dot' && (
                          <span>{effect.value} damage/turn for {effect.duration} turns</span>
                        )}
                        {effect.type === 'heal_percent' && (
                          <span>Restores {effect.value}% HP</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {(() => {
                  const { status } = getSkillStatus(selectedNode, selectedMember)
                  if (status === 'available') {
                    return (
                      <button
                        className="learn-button"
                        onClick={handleLearnSkill}
                      >
                        Learn Skill
                      </button>
                    )
                  }
                  if (status === 'unlocked') {
                    return <div className="learned-badge">Learned</div>
                  }
                  return null
                })()}
              </>
            )}
          </div>
        </div>

        <div className="skill-tree-footer">
          <span>←→ Character | ↑↓ Select | Enter: Learn | Esc: Close</span>
        </div>
      </div>
    </div>
  )
}
