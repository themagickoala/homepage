// ============================================
// Beast Quest - Main Game Component
// ============================================
// Orchestrates all game systems and manages overall state

import { useCallback, useEffect, useRef, useState } from 'react'
import { GameState, MapEntity, IsoPosition, Dialogue, Enemy } from './types'
import {
  createNewGameState,
  serializeGameState,
  deserializeGameState,
  changeRoom,
  openChest,
  toggleSwitch,
  useItem,
  equipItem,
  addExperience,
  addGold,
  updatePlayTime,
  restoreParty,
  setFlag,
  learnSkill,
} from './gameState'
import { Dungeon } from './exploration/Dungeon'
import { CombatSystem } from './combat/CombatSystem'
import { DialogueUI } from './components/DialogueUI'
import { InventoryUI } from './components/InventoryUI'
import { GameMenu } from './components/GameMenu'
import { SkillTree } from './components/SkillTree'
import { Notifications, Notification } from './components/Notifications'
import { createEnemyInstance } from './combat/enemies'
import { DUNGEON_DIALOGUES, CHEST_CONTENTS } from './data/ferno-dungeon'
import { ITEMS } from './data/items'
import { collectToken } from './data/shield-tokens'
import './Game.css'

export function Game() {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [showTitle, setShowTitle] = useState(true)
  const [currentEnemies, setCurrentEnemies] = useState<Enemy[]>([])
  const [currentDialogue, setCurrentDialogue] = useState<Dialogue | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const playTimeRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const notificationIdRef = useRef(0)

  // Add a notification
  const addNotification = useCallback((type: Notification['type'], message: string, icon?: string) => {
    const id = notificationIdRef.current++
    setNotifications((prev) => [...prev, { id, type, message, icon }])
  }, [])

  // Remove a notification
  const dismissNotification = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  // Start new game
  const handleNewGame = useCallback(() => {
    setGameState(createNewGameState())
    setShowTitle(false)
  }, [])

  // Load game from save code
  const handleLoadGame = useCallback((saveCode: string): boolean => {
    const loaded = deserializeGameState(saveCode)
    if (loaded) {
      setGameState(loaded)
      setShowTitle(false)
      return true
    }
    return false
  }, [])

  // Save game
  const handleSaveGame = useCallback((): string => {
    if (!gameState) return ''
    return serializeGameState(gameState)
  }, [gameState])

  // Play time counter
  useEffect(() => {
    if (!gameState || gameState.phase !== 'exploring') return

    playTimeRef.current = setInterval(() => {
      setGameState((prev) => (prev ? updatePlayTime(prev) : prev))
    }, 1000)

    return () => {
      if (playTimeRef.current) {
        clearInterval(playTimeRef.current)
      }
    }
  }, [gameState?.phase])

  // Handle exploration movement
  const handleMove = useCallback((newExploration: GameState['exploration']) => {
    setGameState((prev) => {
      if (!prev) return prev

      let updatedState = { ...prev, exploration: newExploration }

      // Check for MP recovery (1 MP per 3 steps)
      if (newExploration.stepsForMpRecovery >= 3) {
        updatedState = {
          ...updatedState,
          exploration: {
            ...updatedState.exploration,
            stepsForMpRecovery: 0, // Reset counter
          },
          party: updatedState.party.map((member) => ({
            ...member,
            stats: {
              ...member.stats,
              currentMp: Math.min(member.stats.maxMp, member.stats.currentMp + 1),
            },
          })),
        }
      }

      return updatedState
    })
  }, [])

  // Handle room change
  const handleRoomChange = useCallback((roomId: string, position: IsoPosition) => {
    setGameState((prev) => {
      if (!prev) return prev
      return changeRoom(prev, roomId, position)
    })
  }, [])

  // Handle random encounter
  const handleEncounter = useCallback((enemyIds: string[]) => {
    const enemies = enemyIds
      .map((id) => createEnemyInstance(id))
      .filter((e): e is Enemy => e !== null)

    if (enemies.length > 0) {
      setCurrentEnemies(enemies)
      setGameState((prev) => (prev ? { ...prev, phase: 'combat' } : prev))
    }
  }, [])

  // Handle entity interaction
  const handleInteract = useCallback((entity: MapEntity) => {
    switch (entity.type) {
      case 'npc':
        const dialogueId = entity.metadata?.dialogueId as string
        const dialogue = DUNGEON_DIALOGUES[dialogueId as keyof typeof DUNGEON_DIALOGUES]
        if (dialogue) {
          setCurrentDialogue(dialogue as unknown as Dialogue)
          setGameState((prev) => (prev ? { ...prev, phase: 'dialogue' } : prev))
        }
        break

      case 'chest':
        setGameState((prev) => {
          if (!prev) return prev
          // Check if already opened
          if (prev.exploration.openedChests.includes(entity.id)) return prev

          const contents = CHEST_CONTENTS[entity.id] || ['potion']
          const items = contents
            .map((id) => {
              const item = ITEMS[id]
              return item ? { item, quantity: 1 } : null
            })
            .filter((slot): slot is { item: typeof ITEMS[string]; quantity: number } => slot !== null)

          // Show notification for each item obtained
          const itemCounts = new Map<string, number>()
          items.forEach((slot) => {
            const count = itemCounts.get(slot.item.name) || 0
            itemCounts.set(slot.item.name, count + slot.quantity)
          })
          itemCounts.forEach((quantity, name) => {
            addNotification('item', `Obtained ${name}${quantity > 1 ? ` x${quantity}` : ''}!`)
          })

          return openChest(prev, entity.id, items)
        })
        break

      case 'switch':
        setGameState((prev) => (prev ? toggleSwitch(prev, entity.id) : prev))
        break

      case 'trigger':
        if (entity.metadata?.action === 'heal') {
          // Healing pool - restore HP/MP to full
          setGameState((prev) => {
            if (!prev) return prev
            return restoreParty(prev)
          })
          addNotification('heal', 'The healing pool restores your strength!')
        }
        break

      case 'enemy':
        if (entity.metadata?.isBoss) {
          // Boss encounter
          const bossId = entity.metadata.enemyId as string
          const boss = createEnemyInstance(bossId)
          if (boss) {
            setCurrentEnemies([boss])
            setGameState((prev) => (prev ? { ...prev, phase: 'combat' } : prev))
          }
        }
        break
    }
  }, [])

  // Handle combat victory
  const handleVictory = useCallback(
    (
      experience: number,
      gold: number,
      _loot: string[],
      partyStats: { id: string; currentHp: number; currentMp: number }[]
    ) => {
      setGameState((prev) => {
        if (!prev) return prev

        // First apply combat HP/MP to party
        let newState = {
          ...prev,
          party: prev.party.map((member) => {
            const combatStats = partyStats.find((p) => p.id === member.id)
            if (combatStats) {
              return {
                ...member,
                stats: {
                  ...member.stats,
                  currentHp: combatStats.currentHp,
                  currentMp: combatStats.currentMp,
                },
              }
            }
            return member
          }),
        }

        // Then apply experience (may heal if level up)
        newState = addExperience(newState, experience)
        newState = addGold(newState, gold)

        // Check if boss was defeated (Ferno)
        const defeatedBoss = currentEnemies.some((e) => e.type === 'boss')
        if (defeatedBoss) {
          // Collect Dragon Scale token
          newState = {
            ...newState,
            shieldTokens: collectToken(newState.shieldTokens, 'dragon_scale'),
          }
          newState = setFlag(newState, 'ferno_defeated')
          // Show victory/quest complete screen
          return { ...newState, phase: 'victory' }
        }

        return { ...newState, phase: 'exploring' }
      })
      setCurrentEnemies([])
    },
    [currentEnemies]
  )

  // Handle combat defeat
  const handleDefeat = useCallback(() => {
    setGameState((prev) => (prev ? { ...prev, phase: 'game_over' } : prev))
    setCurrentEnemies([])
  }, [])

  // Handle combat flee
  const handleFlee = useCallback(() => {
    setGameState((prev) => (prev ? { ...prev, phase: 'exploring' } : prev))
    setCurrentEnemies([])
  }, [])

  // Handle dialogue complete
  const handleDialogueComplete = useCallback(() => {
    setCurrentDialogue(null)
    setGameState((prev) => (prev ? { ...prev, phase: 'exploring' } : prev))
  }, [])

  // Handle item use
  const handleUseItem = useCallback((itemId: string, targetId: string) => {
    setGameState((prev) => (prev ? useItem(prev, itemId, targetId) : prev))
  }, [])

  // Handle equip item
  const handleEquipItem = useCallback((itemId: string, characterId: string) => {
    setGameState((prev) => (prev ? equipItem(prev, itemId, characterId) : prev))
  }, [])

  // UI state handlers
  const openMenu = useCallback(() => {
    setGameState((prev) => (prev ? { ...prev, phase: 'menu' } : prev))
  }, [])

  const closeMenu = useCallback(() => {
    setGameState((prev) => (prev ? { ...prev, phase: 'exploring' } : prev))
  }, [])

  const openInventory = useCallback(() => {
    setGameState((prev) => (prev ? { ...prev, phase: 'inventory' } : prev))
  }, [])

  const closeInventory = useCallback(() => {
    setGameState((prev) => (prev ? { ...prev, phase: 'menu' } : prev))
  }, [])

  const openSkillTree = useCallback(() => {
    setGameState((prev) => (prev ? { ...prev, phase: 'skill_tree' } : prev))
  }, [])

  const closeSkillTree = useCallback(() => {
    setGameState((prev) => (prev ? { ...prev, phase: 'menu' } : prev))
  }, [])

  const handleLearnSkill = useCallback((characterId: string, skillId: string) => {
    setGameState((prev) => {
      if (!prev) return prev
      const newState = learnSkill(prev, characterId, skillId)
      // Find the skill name for the notification
      const member = newState.party.find((m) => m.id === characterId)
      const skill = member?.skills.find((s) => s.id === skillId)
      if (skill) {
        addNotification('info', `${member?.name} learned ${skill.name}!`)
      }
      return newState
    })
  }, [addNotification])

  const handleQuit = useCallback(() => {
    setGameState(null)
    setShowTitle(true)
  }, [])

  // Keyboard shortcut for menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameState || gameState.phase !== 'exploring') return

      if (e.key === 'Escape') {
        openMenu()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gameState?.phase, openMenu])

  // Title screen
  if (showTitle) {
    return (
      <div className="beast-quest-title">
        <div className="title-content">
          <h1>Beast Quest</h1>
          <p className="subtitle">Ferno's Cave - Demo</p>
          <div className="title-menu">
            <button onClick={handleNewGame}>New Game</button>
            <button
              onClick={() => {
                const code = prompt('Enter save code:')
                if (code) {
                  const success = handleLoadGame(code)
                  if (!success) {
                    alert('Invalid save code')
                  }
                }
              }}
            >
              Load Game
            </button>
          </div>
          <div className="title-controls">
            <h3>Controls</h3>
            <p>Arrow Keys: Move</p>
            <p>Enter/Space: Interact</p>
            <p>Escape: Menu</p>
          </div>
        </div>
      </div>
    )
  }

  if (!gameState) return null

  // Game Over screen
  if (gameState.phase === 'game_over') {
    return (
      <div className="beast-quest-gameover">
        <div className="gameover-content">
          <h1>Game Over</h1>
          <p>Your quest has ended...</p>
          <div className="gameover-options">
            <button onClick={handleNewGame}>Try Again</button>
            <button onClick={handleQuit}>Title Screen</button>
          </div>
        </div>
      </div>
    )
  }

  // Victory screen (after defeating Ferno)
  if (gameState.phase === 'victory') {
    return (
      <div className="beast-quest-victory">
        <div className="victory-content">
          <h1>Quest Complete!</h1>
          <div className="victory-beast">
            <div className="beast-defeated-icon" />
            <h2>Ferno the Fire Dragon</h2>
            <p className="beast-subtitle">Has Been Defeated!</p>
          </div>
          <div className="victory-reward">
            <div className="token-icon" />
            <p>The <strong>Dragon Scale</strong> has been added to Tom's shield.</p>
            <p className="token-bonus">+10 Max HP, +2 Defense</p>
          </div>
          <div className="victory-stats">
            <p>Tom - Level {gameState.party[0]?.stats.level}</p>
            <p>Elenna - Level {gameState.party[1]?.stats.level}</p>
            <p>Play Time: {Math.floor(gameState.playTime / 60)}:{String(gameState.playTime % 60).padStart(2, '0')}</p>
          </div>
          <div className="victory-coming-soon">
            <p>Thank you for playing the Beast Quest demo!</p>
            <p className="coming-soon-text">More levels coming soon...</p>
          </div>
          <div className="victory-options">
            <button onClick={handleQuit}>Return to Title</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="beast-quest-game">
      {/* Notifications */}
      <Notifications notifications={notifications} onDismiss={dismissNotification} />

      {/* Exploration */}
      {gameState.phase === 'exploring' && (
        <Dungeon
          explorationState={gameState.exploration}
          party={gameState.party}
          onMove={handleMove}
          onEncounter={handleEncounter}
          onInteract={handleInteract}
          onRoomChange={handleRoomChange}
        />
      )}

      {/* Combat */}
      {gameState.phase === 'combat' && currentEnemies.length > 0 && (
        <CombatSystem
          party={gameState.party}
          enemies={currentEnemies}
          inventory={gameState.inventory}
          canFlee={!currentEnemies.some((e) => e.type === 'boss')}
          onVictory={handleVictory}
          onDefeat={handleDefeat}
          onFlee={handleFlee}
          onUseItem={handleUseItem}
        />
      )}

      {/* Dialogue */}
      {gameState.phase === 'dialogue' && currentDialogue && (
        <DialogueUI dialogue={currentDialogue} onComplete={handleDialogueComplete} />
      )}

      {/* Inventory */}
      {gameState.phase === 'inventory' && (
        <InventoryUI
          inventory={gameState.inventory}
          party={gameState.party}
          gold={gameState.gold}
          onUseItem={handleUseItem}
          onEquipItem={handleEquipItem}
          onClose={closeInventory}
        />
      )}

      {/* Skill Tree */}
      {gameState.phase === 'skill_tree' && (
        <SkillTree
          party={gameState.party}
          onLearnSkill={handleLearnSkill}
          onClose={closeSkillTree}
        />
      )}

      {/* Game Menu */}
      {gameState.phase === 'menu' && (
        <GameMenu
          party={gameState.party}
          playTime={gameState.playTime}
          onResume={closeMenu}
          onInventory={openInventory}
          onSkillTree={openSkillTree}
          onSave={handleSaveGame}
          onLoad={handleLoadGame}
          onQuit={handleQuit}
        />
      )}
    </div>
  )
}
