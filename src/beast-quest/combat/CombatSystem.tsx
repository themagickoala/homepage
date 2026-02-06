// ============================================
// Combat System Component
// ============================================
// Manages turn-based combat state and rendering

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  CombatState,
  CombatEntity,
  PartyMember,
  Enemy,
  Skill,
  Item,
  BattleLogEntry,
  InventorySlot,
} from '../types'
import {
  executeAttack,
  executeSkill,
  executeDefend,
  executeItem,
  processStatusEffects,
  resetDefending,
  calculateTurnOrder,
  checkCombatEnd,
  getValidTargets,
  canUseSkill,
  isAlive,
} from './actions'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../render/isometric'
import { preloadAvatars, drawAvatar } from '../data/avatars'
import { drawEnemySprite } from '../render/sprites'
import {
  drawCharacterStats,
  drawBattleMenu,
  drawMenu,
  drawBattleLog,
  drawOverlay,
  drawCenteredText,
  UI_COLORS,
  FONTS,
} from '../render/ui'

function drawCornerHighlight(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  size: number = 10
) {
  ctx.strokeStyle = '#ffff00'
  ctx.lineWidth = 2
  ctx.beginPath()
  // Top-left
  ctx.moveTo(x, y + size)
  ctx.lineTo(x, y)
  ctx.lineTo(x + size, y)
  // Top-right
  ctx.moveTo(x + w - size, y)
  ctx.lineTo(x + w, y)
  ctx.lineTo(x + w, y + size)
  // Bottom-right
  ctx.moveTo(x + w, y + h - size)
  ctx.lineTo(x + w, y + h)
  ctx.lineTo(x + w - size, y + h)
  // Bottom-left
  ctx.moveTo(x + size, y + h)
  ctx.lineTo(x, y + h)
  ctx.lineTo(x, y + h - size)
  ctx.stroke()
}

interface PartyHpMp {
  id: string
  currentHp: number
  currentMp: number
}

interface CombatSystemProps {
  party: PartyMember[]
  enemies: Enemy[]
  inventory: InventorySlot[]
  canFlee: boolean
  onVictory: (experience: number, gold: number, loot: string[], partyStats: PartyHpMp[]) => void
  onDefeat: () => void
  onFlee: () => void
  onUseItem: (itemId: string, targetId: string) => void
  onTutorialTrigger?: (tutorialId: string) => void
}

type MenuState = 'main' | 'skills' | 'items' | 'targets'

interface VictoryRewards {
  experience: number
  gold: number
  loot: string[]
  levelUps: { name: string; newLevel: number }[]
}

export function CombatSystem({
  party,
  enemies,
  inventory,
  canFlee,
  onVictory,
  onDefeat,
  onFlee,
  onUseItem,
  onTutorialTrigger,
}: CombatSystemProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [combatState, setCombatState] = useState<CombatState | null>(null)
  const [menuState, setMenuState] = useState<MenuState>('main')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [pendingSkill, setPendingSkill] = useState<Skill | null>(null)
  const [pendingItem, setPendingItem] = useState<Item | null>(null)
  const [animationFrame, setAnimationFrame] = useState(0)
  const [battleLog, setBattleLog] = useState<BattleLogEntry[]>([])
  const [victoryRewards, setVictoryRewards] = useState<VictoryRewards | null>(null)
  const [showVictorySummary, setShowVictorySummary] = useState(false)
  const isInitialized = useRef(false)

  // Initialize combat - only runs once on mount
  useEffect(() => {
    // Prevent re-initialization if party/inventory props change during combat
    if (isInitialized.current) return
    isInitialized.current = true

    preloadAvatars()

    const partyEntities: CombatEntity[] = party.map((member) => ({
      id: member.id,
      name: member.name,
      stats: { ...member.stats },
      isPlayer: true,
      isDefending: false,
      statusEffects: [],
      turnOrder: 0,
    }))

    const enemyEntities: CombatEntity[] = enemies.map((enemy, index) => ({
      id: `${enemy.id}_${index}`,
      name: enemies.length > 1 ? `${enemy.name} ${String.fromCharCode(65 + index)}` : enemy.name,
      stats: { ...enemy.stats },
      isPlayer: false,
      isDefending: false,
      statusEffects: [],
      turnOrder: 0,
    }))

    const allEntities = calculateTurnOrder([...partyEntities, ...enemyEntities])

    const initialState: CombatState = {
      phase: 'start',
      turn: 1,
      entities: allEntities,
      currentEntityIndex: 0,
      pendingAction: null,
      battleLog: [],
      canFlee,
    }

    setCombatState(initialState)
    setBattleLog([{ turn: 1, message: 'Battle start!', type: 'info' }])

    // Transition to first turn
    setTimeout(() => {
      setCombatState((prev) => {
        if (!prev) return prev
        const currentEntity = prev.entities[0]
        return {
          ...prev,
          phase: currentEntity.isPlayer ? 'selecting_action' : 'enemy_turn',
        }
      })
    }, 1000)
  }, [party, enemies, canFlee])

  // Animation loop
  useEffect(() => {
    let frameId: number
    const animate = () => {
      setAnimationFrame((f) => f + 1)
      frameId = requestAnimationFrame(animate)
    }
    frameId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameId)
  }, [])

  // Get current entity
  const getCurrentEntity = useCallback((): CombatEntity | null => {
    if (!combatState) return null
    return combatState.entities[combatState.currentEntityIndex] || null
  }, [combatState])

  // Get current party member data
  const getCurrentPartyMember = useCallback((): PartyMember | null => {
    const entity = getCurrentEntity()
    if (!entity || !entity.isPlayer) return null
    return party.find((m) => m.id === entity.id) || null
  }, [getCurrentEntity, party])

  // Advance to next turn
  const nextTurn = useCallback(() => {
    setCombatState((prev) => {
      if (!prev) return prev

      // Find next alive entity
      let nextIndex = (prev.currentEntityIndex + 1) % prev.entities.length
      let attempts = 0

      while (attempts < prev.entities.length) {
        if (isAlive(prev.entities[nextIndex])) break
        nextIndex = (nextIndex + 1) % prev.entities.length
        attempts++
      }

      // Check if we've completed a round
      const newTurn = nextIndex <= prev.currentEntityIndex ? prev.turn + 1 : prev.turn

      const currentEntity = prev.entities[nextIndex]

      // Process status effects and reset defending
      let newState = resetDefending(prev, currentEntity.id)
      const { state: afterEffects, logs } = processStatusEffects(newState, currentEntity.id)

      if (logs.length > 0) {
        setBattleLog((log) => [...log, ...logs])
      }

      return {
        ...afterEffects,
        turn: newTurn,
        currentEntityIndex: nextIndex,
        phase: currentEntity.isPlayer ? 'selecting_action' : 'enemy_turn',
      }
    })
    setMenuState('main')
    setSelectedIndex(0)
  }, [])

  // Handle player action selection
  const handleAction = useCallback(
    (action: 'attack' | 'skills' | 'items' | 'defend' | 'flee') => {
      const currentEntity = getCurrentEntity()
      if (!currentEntity || !currentEntity.isPlayer) return

      switch (action) {
        case 'attack':
          setMenuState('targets')
          setPendingSkill(null)
          setPendingItem(null)
          setSelectedIndex(0)
          break

        case 'skills':
          setMenuState('skills')
          setSelectedIndex(0)
          break

        case 'items':
          setMenuState('items')
          setSelectedIndex(0)
          break

        case 'defend':
          if (combatState) {
            const { state, log } = executeDefend(combatState, currentEntity.id)
            setCombatState({ ...state, phase: 'executing_action' })
            setBattleLog((prev) => [...prev, log])
            setTimeout(nextTurn, 500)
          }
          break

        case 'flee':
          setCombatState((prev) => (prev ? { ...prev, phase: 'executing_action' } : prev))
          if (canFlee && Math.random() < 0.5) {
            setBattleLog((prev) => [
              ...prev,
              { turn: combatState?.turn || 1, message: 'Got away safely!', type: 'info' },
            ])
            setTimeout(onFlee, 1000)
          } else {
            setBattleLog((prev) => [
              ...prev,
              { turn: combatState?.turn || 1, message: "Couldn't escape!", type: 'info' },
            ])
            setTimeout(nextTurn, 500)
          }
          break
      }
    },
    [getCurrentEntity, combatState, canFlee, nextTurn, onFlee]
  )

  // Handle selecting a skill
  const handleSkillSelect = useCallback(
    (skill: Skill) => {
      const currentEntity = getCurrentEntity()
      if (!currentEntity || !canUseSkill(currentEntity, skill)) return

      setPendingSkill(skill)
      setMenuState('targets')
      setSelectedIndex(0)
    },
    [getCurrentEntity]
  )

  // Handle selecting a target
  const handleTargetSelect = useCallback(
    (targetId: string) => {
      const currentEntity = getCurrentEntity()
      if (!currentEntity || !combatState) return

      let newState = combatState
      const logs: BattleLogEntry[] = []

      if (pendingSkill) {
        // Execute skill
        const targetType = pendingSkill.targetType
        const targets =
          targetType === 'all_enemies' || targetType === 'all_allies'
            ? getValidTargets(combatState, currentEntity.id, targetType).map((e) => e.id)
            : [targetId]

        const result = executeSkill(combatState, currentEntity.id, pendingSkill, targets)
        newState = result.state
        logs.push(...result.logs)
      } else if (pendingItem) {
        // Execute item use
        const result = executeItem(combatState, currentEntity.id, pendingItem, targetId)
        newState = result.state
        logs.push(result.log)
        // Remove item from inventory
        onUseItem(pendingItem.id, targetId)
      } else {
        // Basic attack
        const result = executeAttack(combatState, currentEntity.id, targetId)
        newState = result.state
        logs.push(result.log)
      }

      // Set phase to executing_action to block further input during the delay
      setCombatState({ ...newState, phase: 'executing_action' })
      setBattleLog((prev) => [...prev, ...logs])

      // Check combat end
      const endResult = checkCombatEnd(newState)
      if (endResult === 'victory') {
        setCombatState((prev) => (prev ? { ...prev, phase: 'victory' } : prev))
        // Calculate rewards from all enemies
        const totalExp = enemies.reduce((sum, e) => sum + e.experienceReward, 0)
        const totalGold = enemies.reduce((sum, e) => sum + e.goldReward, 0)
        const loot: string[] = []
        enemies.forEach((e) => {
          e.lootTable.forEach((entry) => {
            if (Math.random() < entry.dropRate) {
              loot.push(entry.itemId)
            }
          })
        })

        // Calculate level ups (simulated - check if exp would cause level up)
        const levelUps: { name: string; newLevel: number }[] = []
        party.forEach((member) => {
          const expNeeded = member.stats.experienceToNextLevel - member.stats.experience
          if (totalExp >= expNeeded) {
            levelUps.push({ name: member.name, newLevel: member.stats.level + 1 })
          }
        })

        setVictoryRewards({ experience: totalExp, gold: totalGold, loot, levelUps })
        setTimeout(() => setShowVictorySummary(true), 1500)
      } else if (endResult === 'defeat') {
        setCombatState((prev) => (prev ? { ...prev, phase: 'defeat' } : prev))
        setTimeout(onDefeat, 2000)
      } else {
        setPendingSkill(null)
        setPendingItem(null)
        setMenuState('main')
        setTimeout(nextTurn, 500)
      }
    },
    [getCurrentEntity, combatState, pendingSkill, pendingItem, nextTurn, onVictory, onDefeat, onUseItem]
  )

  // Simple enemy AI
  useEffect(() => {
    if (!combatState || combatState.phase !== 'enemy_turn') return

    const currentEntity = getCurrentEntity()
    if (!currentEntity || currentEntity.isPlayer) return

    // Find the enemy data
    const enemyData = enemies.find((e) => currentEntity.id.startsWith(e.id))
    if (!enemyData) {
      nextTurn()
      return
    }

    // Simple AI: attack random player
    const timeout = setTimeout(() => {
      const validTargets = getValidTargets(combatState, currentEntity.id, 'single_enemy')
      if (validTargets.length === 0) {
        nextTurn()
        return
      }

      const target = validTargets[Math.floor(Math.random() * validTargets.length)]

      // 30% chance to use a skill if available
      let resultState: CombatState
      if (enemyData.skills.length > 0 && Math.random() < 0.3) {
        const skill = enemyData.skills[Math.floor(Math.random() * enemyData.skills.length)]
        const targets =
          skill.targetType === 'all_enemies'
            ? validTargets.map((e) => e.id)
            : [target.id]

        const result = executeSkill(combatState, currentEntity.id, skill, targets)
        resultState = result.state
        setCombatState(result.state)
        setBattleLog((prev) => [...prev, ...result.logs])
      } else {
        const result = executeAttack(combatState, currentEntity.id, target.id)
        resultState = result.state
        setCombatState(result.state)
        setBattleLog((prev) => [...prev, result.log])
      }

      // Check for tutorial triggers after enemy action
      if (onTutorialTrigger) {
        const playerEntities = resultState.entities.filter((e) => e.isPlayer)
        // Low HP: any party member below 30%
        if (playerEntities.some((e) => e.stats.currentHp > 0 && e.stats.currentHp / e.stats.maxHp < 0.3)) {
          onTutorialTrigger('tutorial_low_hp')
        }
        // Poisoned: any party member has poison or burn
        if (playerEntities.some((e) => e.statusEffects.some((s) => s.type === 'poison' || s.type === 'burn'))) {
          onTutorialTrigger('tutorial_poisoned')
        }
      }

      // Check combat end
      setTimeout(() => {
        setCombatState((prev) => {
          if (!prev) return prev
          const endResult = checkCombatEnd(prev)
          if (endResult === 'defeat') {
            setTimeout(onDefeat, 2000)
            return { ...prev, phase: 'defeat' }
          }
          return prev
        })
        nextTurn()
      }, 500)
    }, 1000)

    return () => clearTimeout(timeout)
  }, [combatState?.phase, combatState?.currentEntityIndex])

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle victory summary dismissal
      if (showVictorySummary && victoryRewards && combatState) {
        if (e.key === 'Enter' || e.key === ' ') {
          // Extract party HP/MP from combat state
          const partyStats = combatState.entities
            .filter((e) => e.isPlayer)
            .map((e) => ({ id: e.id, currentHp: e.stats.currentHp, currentMp: e.stats.currentMp }))
          onVictory(victoryRewards.experience, victoryRewards.gold, victoryRewards.loot, partyStats)
        }
        return
      }

      if (!combatState || combatState.phase !== 'selecting_action') return

      const currentMember = getCurrentPartyMember()

      switch (e.key) {
        case 'ArrowUp':
          setSelectedIndex((prev) => Math.max(0, prev - 1))
          break
        case 'ArrowDown':
          if (menuState === 'main') {
            setSelectedIndex((prev) => Math.min(4, prev + 1))
          } else if (menuState === 'skills' && currentMember) {
            setSelectedIndex((prev) => Math.min(currentMember.skills.length - 1, prev + 1))
          } else if (menuState === 'items') {
            const usableItems = inventory.filter((slot) => slot.item.type === 'consumable')
            setSelectedIndex((prev) => Math.min(usableItems.length - 1, prev + 1))
          } else if (menuState === 'targets') {
            const targets = getValidTargets(
              combatState,
              getCurrentEntity()!.id,
              pendingSkill?.targetType || (pendingItem ? 'single_ally' : 'single_enemy')
            )
            setSelectedIndex((prev) => Math.min(targets.length - 1, prev + 1))
          }
          break
        case 'Enter':
        case ' ':
          if (menuState === 'main') {
            const actions: ('attack' | 'skills' | 'items' | 'defend' | 'flee')[] = [
              'attack',
              'skills',
              'items',
              'defend',
              'flee',
            ]
            handleAction(actions[selectedIndex])
          } else if (menuState === 'skills' && currentMember) {
            handleSkillSelect(currentMember.skills[selectedIndex])
          } else if (menuState === 'items') {
            const usableItems = inventory.filter((slot) => slot.item.type === 'consumable')
            if (usableItems[selectedIndex]) {
              setPendingItem(usableItems[selectedIndex].item)
              setMenuState('targets')
              setSelectedIndex(0)
            }
          } else if (menuState === 'targets') {
            const targets = getValidTargets(
              combatState,
              getCurrentEntity()!.id,
              pendingSkill?.targetType || (pendingItem ? 'single_ally' : 'single_enemy')
            )
            if (targets[selectedIndex]) {
              handleTargetSelect(targets[selectedIndex].id)
            }
          }
          break
        case 'Escape':
          if (menuState !== 'main') {
            setMenuState('main')
            setSelectedIndex(0)
            setPendingSkill(null)
            setPendingItem(null)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    combatState,
    menuState,
    selectedIndex,
    getCurrentPartyMember,
    getCurrentEntity,
    handleAction,
    handleSkillSelect,
    handleTargetSelect,
    pendingSkill,
    pendingItem,
    inventory,
    showVictorySummary,
    victoryRewards,
    onVictory,
  ])

  // Render combat scene
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !combatState) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = '#1a1a2a'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Draw battle background (simple gradient)
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT)
    gradient.addColorStop(0, '#2a2a3a')
    gradient.addColorStop(1, '#1a1a2a')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Ground line
    ctx.strokeStyle = '#4a4a5a'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, CANVAS_HEIGHT - 200)
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - 200)
    ctx.stroke()

    // Draw enemies
    const enemyEntities = combatState.entities.filter((e) => !e.isPlayer)
    enemyEntities.forEach((entity, index) => {
      const enemyData = enemies.find((e) => entity.id.startsWith(e.id))
      if (!enemyData) return

      const x = 150 + index * 150
      const y = CANVAS_HEIGHT - 300

      // Draw enemy sprite
      drawEnemySprite(ctx, x, y, enemyData.id, animationFrame)

      // Draw HP bar
      const hpPercent = entity.stats.currentHp / entity.stats.maxHp
      ctx.fillStyle = '#442222'
      ctx.fillRect(x - 30, y + 40, 60, 8)
      ctx.fillStyle = '#22aa22'
      ctx.fillRect(x - 30, y + 40, 60 * hpPercent, 8)

      // Draw name
      ctx.save()
      ctx.fillStyle = UI_COLORS.textPrimary
      ctx.font = FONTS.small
      ctx.textAlign = 'center'
      ctx.fillText(entity.name, x, y + 60)
      ctx.restore()

      // Highlight if targeted
      if (menuState === 'targets') {
        const targets = getValidTargets(
          combatState,
          getCurrentEntity()!.id,
          pendingSkill?.targetType || (pendingItem ? 'single_ally' : 'single_enemy')
        )
        const targetIndex = targets.findIndex((t) => t.id === entity.id)
        if (targetIndex === selectedIndex) {
          drawCornerHighlight(ctx, x - 35, y - 50, 70, 120)
        }
      }
    })

    // Draw party stats (on right side to avoid overlap with battle menu)
    const partyEntities = combatState.entities.filter((e) => e.isPlayer)
    partyEntities.forEach((entity, index) => {
      const member = party.find((m) => m.id === entity.id)
      if (!member) return

      // Position stats on right side, stacked vertically (shifted right for avatar)
      const avatarSize = 40
      const avatarX = CANVAS_WIDTH - 195 - avatarSize - 6
      const statsX = CANVAS_WIDTH - 195
      const statsY = CANVAS_HEIGHT - 155 + index * 75

      // Draw avatar
      drawAvatar(ctx, avatarX, statsY + 12, avatarSize, member.id)

      drawCharacterStats(ctx, statsX, statsY, {
        ...member,
        stats: entity.stats,
      } as PartyMember)

      // Highlight current turn
      if (combatState.currentEntityIndex === combatState.entities.indexOf(entity)) {
        drawCornerHighlight(ctx, statsX - 2, statsY - 2, 184, 69)
      }

      // Highlight if targeted (for ally-targeting skills/items)
      if (menuState === 'targets') {
        const targetType = pendingSkill?.targetType || (pendingItem ? 'single_ally' : 'single_enemy')
        const targets = getValidTargets(
          combatState,
          getCurrentEntity()!.id,
          targetType
        )
        const targetIndex = targets.findIndex((t) => t.id === entity.id)
        if (targetIndex === selectedIndex) {
          drawCornerHighlight(ctx, statsX - 4, statsY - 4, 188, 73)
        }
      }
    })

    // Draw battle log
    drawBattleLog(ctx, battleLog)

    // Draw menus based on state
    if (combatState.phase === 'selecting_action') {
      const currentMember = getCurrentPartyMember()

      if (menuState === 'main') {
        drawBattleMenu(ctx, selectedIndex, canFlee)
      } else if (menuState === 'skills' && currentMember) {
        const skillOptions = currentMember.skills.map((skill) => ({
          label: `${skill.name} (${skill.mpCost} MP)`,
          enabled: canUseSkill(combatState.entities.find((e) => e.id === currentMember.id)!, skill),
        }))
        drawMenu(ctx, 20, CANVAS_HEIGHT - 200, skillOptions, selectedIndex)
      } else if (menuState === 'items') {
        const usableItems = inventory.filter((slot) => slot.item.type === 'consumable')
        const itemOptions = usableItems.map((slot) => ({
          label: `${slot.item.name} x${slot.quantity}`,
          enabled: slot.quantity > 0,
        }))
        if (itemOptions.length === 0) {
          drawMenu(ctx, 20, CANVAS_HEIGHT - 200, [{ label: 'No items', enabled: false }], 0)
        } else {
          drawMenu(ctx, 20, CANVAS_HEIGHT - 200, itemOptions, selectedIndex)
        }
      } else if (menuState === 'targets') {
        const targets = getValidTargets(
          combatState,
          getCurrentEntity()!.id,
          pendingSkill?.targetType || (pendingItem ? 'single_ally' : 'single_enemy')
        )
        const targetOptions = targets.map((t) => ({
          label: t.name,
          enabled: true,
        }))
        drawMenu(ctx, 20, CANVAS_HEIGHT - 200, targetOptions, selectedIndex)
      }
    }

    // Draw phase overlays
    if (combatState.phase === 'victory') {
      drawOverlay(ctx, 0.7)

      if (showVictorySummary && victoryRewards) {
        // Draw victory summary panel
        const panelWidth = 350
        const panelHeight = 250 + (victoryRewards.levelUps.length * 25)
        const panelX = (CANVAS_WIDTH - panelWidth) / 2
        const panelY = (CANVAS_HEIGHT - panelHeight) / 2

        // Panel background
        ctx.fillStyle = 'rgba(20, 20, 40, 0.95)'
        ctx.fillRect(panelX, panelY, panelWidth, panelHeight)
        ctx.strokeStyle = '#FFD700'
        ctx.lineWidth = 3
        ctx.strokeRect(panelX, panelY, panelWidth, panelHeight)

        // Title
        ctx.save()
        ctx.fillStyle = '#FFD700'
        ctx.font = 'bold 28px monospace'
        ctx.textAlign = 'center'
        ctx.fillText('Victory!', CANVAS_WIDTH / 2, panelY + 45)

        // Rewards section
        ctx.font = FONTS.heading
        ctx.fillStyle = '#ffffff'
        let yPos = panelY + 90

        // EXP
        ctx.textAlign = 'left'
        ctx.fillText('Experience:', panelX + 30, yPos)
        ctx.textAlign = 'right'
        ctx.fillStyle = '#66aaff'
        ctx.fillText(`+${victoryRewards.experience} EXP`, panelX + panelWidth - 30, yPos)

        // Gold
        yPos += 35
        ctx.textAlign = 'left'
        ctx.fillStyle = '#ffffff'
        ctx.fillText('Gold:', panelX + 30, yPos)
        ctx.textAlign = 'right'
        ctx.fillStyle = '#FFD700'
        ctx.fillText(`+${victoryRewards.gold} G`, panelX + panelWidth - 30, yPos)

        // Loot
        if (victoryRewards.loot.length > 0) {
          yPos += 35
          ctx.textAlign = 'left'
          ctx.fillStyle = '#ffffff'
          ctx.fillText('Items:', panelX + 30, yPos)
          ctx.textAlign = 'right'
          ctx.fillStyle = '#88ff88'
          ctx.fillText(victoryRewards.loot.join(', '), panelX + panelWidth - 30, yPos)
        }

        // Level ups
        if (victoryRewards.levelUps.length > 0) {
          yPos += 45
          ctx.textAlign = 'center'
          ctx.fillStyle = '#FFD700'
          ctx.font = 'bold 16px monospace'
          ctx.fillText('~ Level Up! ~', CANVAS_WIDTH / 2, yPos)

          ctx.font = FONTS.normal
          victoryRewards.levelUps.forEach((levelUp) => {
            yPos += 25
            ctx.fillStyle = '#ffffff'
            ctx.fillText(`${levelUp.name} reached Level ${levelUp.newLevel}!`, CANVAS_WIDTH / 2, yPos)
          })
        }

        // Continue prompt
        ctx.font = FONTS.small
        ctx.fillStyle = '#aaaacc'
        ctx.textAlign = 'center'
        ctx.fillText('Press Enter to continue', CANVAS_WIDTH / 2, panelY + panelHeight - 20)
        ctx.restore()
      } else {
        drawCenteredText(ctx, 'Victory!', CANVAS_HEIGHT / 2, FONTS.title, '#ffff00')
      }
    } else if (combatState.phase === 'defeat') {
      drawOverlay(ctx, 0.7, '#440000')
      drawCenteredText(ctx, 'Defeat...', CANVAS_HEIGHT / 2, FONTS.title, '#ff0000')
    }
  }, [
    combatState,
    menuState,
    selectedIndex,
    animationFrame,
    battleLog,
    party,
    enemies,
    inventory,
    canFlee,
    pendingSkill,
    pendingItem,
    getCurrentEntity,
    getCurrentPartyMember,
    showVictorySummary,
    victoryRewards,
  ])

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      style={{ display: 'block', margin: '0 auto' }}
    />
  )
}
