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

interface CombatSystemProps {
  party: PartyMember[]
  enemies: Enemy[]
  canFlee: boolean
  onVictory: (experience: number, gold: number, loot: string[]) => void
  onDefeat: () => void
  onFlee: () => void
}

type MenuState = 'main' | 'skills' | 'items' | 'targets'

export function CombatSystem({
  party,
  enemies,
  canFlee,
  onVictory,
  onDefeat,
  onFlee,
}: CombatSystemProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [combatState, setCombatState] = useState<CombatState | null>(null)
  const [menuState, setMenuState] = useState<MenuState>('main')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [pendingSkill, setPendingSkill] = useState<Skill | null>(null)
  const [pendingItem, setPendingItem] = useState<Item | null>(null)
  const [animationFrame, setAnimationFrame] = useState(0)
  const [battleLog, setBattleLog] = useState<BattleLogEntry[]>([])

  // Initialize combat
  useEffect(() => {
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
            setCombatState(state)
            setBattleLog((prev) => [...prev, log])
            setTimeout(nextTurn, 500)
          }
          break

        case 'flee':
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
        // TODO: Remove item from inventory
      } else {
        // Basic attack
        const result = executeAttack(combatState, currentEntity.id, targetId)
        newState = result.state
        logs.push(result.log)
      }

      setCombatState(newState)
      setBattleLog((prev) => [...prev, ...logs])

      // Check combat end
      const endResult = checkCombatEnd(newState)
      if (endResult === 'victory') {
        setCombatState((prev) => (prev ? { ...prev, phase: 'victory' } : prev))
        setTimeout(() => onVictory(100, 50, []), 2000)
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
    [getCurrentEntity, combatState, pendingSkill, pendingItem, nextTurn, onVictory, onDefeat]
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
      if (enemyData.skills.length > 0 && Math.random() < 0.3) {
        const skill = enemyData.skills[Math.floor(Math.random() * enemyData.skills.length)]
        const targets =
          skill.targetType === 'all_enemies'
            ? validTargets.map((e) => e.id)
            : [target.id]

        const result = executeSkill(combatState, currentEntity.id, skill, targets)
        setCombatState(result.state)
        setBattleLog((prev) => [...prev, ...result.logs])
      } else {
        const result = executeAttack(combatState, currentEntity.id, target.id)
        setCombatState(result.state)
        setBattleLog((prev) => [...prev, result.log])
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
          } else if (menuState === 'targets') {
            const targets = getValidTargets(
              combatState,
              getCurrentEntity()!.id,
              pendingSkill?.targetType || 'single_enemy'
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
          } else if (menuState === 'targets') {
            const targets = getValidTargets(
              combatState,
              getCurrentEntity()!.id,
              pendingSkill?.targetType || 'single_enemy'
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
      ctx.fillStyle = UI_COLORS.textPrimary
      ctx.font = FONTS.small
      ctx.textAlign = 'center'
      ctx.fillText(entity.name, x, y + 60)

      // Highlight if targeted
      if (menuState === 'targets') {
        const targets = getValidTargets(
          combatState,
          getCurrentEntity()!.id,
          pendingSkill?.targetType || 'single_enemy'
        )
        const targetIndex = targets.findIndex((t) => t.id === entity.id)
        if (targetIndex === selectedIndex) {
          ctx.strokeStyle = '#ffff00'
          ctx.lineWidth = 2
          ctx.strokeRect(x - 35, y - 50, 70, 120)
        }
      }
    })

    // Draw party stats
    const partyEntities = combatState.entities.filter((e) => e.isPlayer)
    partyEntities.forEach((entity, index) => {
      const member = party.find((m) => m.id === entity.id)
      if (!member) return

      drawCharacterStats(ctx, 10 + index * 190, CANVAS_HEIGHT - 90, {
        ...member,
        stats: entity.stats,
      } as PartyMember)

      // Highlight current turn
      if (combatState.currentEntityIndex === combatState.entities.indexOf(entity)) {
        ctx.strokeStyle = '#ffff00'
        ctx.lineWidth = 2
        ctx.strokeRect(8 + index * 190, CANVAS_HEIGHT - 92, 184, 69)
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
      } else if (menuState === 'targets') {
        const targets = getValidTargets(
          combatState,
          getCurrentEntity()!.id,
          pendingSkill?.targetType || 'single_enemy'
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
      drawOverlay(ctx, 0.5)
      drawCenteredText(ctx, 'Victory!', CANVAS_HEIGHT / 2, FONTS.title, '#ffff00')
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
    canFlee,
    pendingSkill,
    getCurrentEntity,
    getCurrentPartyMember,
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
