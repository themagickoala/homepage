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
  hasFlag,
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
import { DUNGEON_DIALOGUES as FERNO_DIALOGUES, CHEST_CONTENTS as FERNO_CHESTS } from './data/ferno-dungeon'
import { DUNGEON_DIALOGUES as SEPRON_DIALOGUES, CHEST_CONTENTS as SEPRON_CHESTS } from './data/sepron-dungeon'
import { ITEMS } from './data/items'

// Merge dialogue and chest data from all dungeons
const ALL_DIALOGUES = { ...FERNO_DIALOGUES, ...SEPRON_DIALOGUES } as Record<string, unknown>
const ALL_CHESTS: Record<string, string[]> = { ...FERNO_CHESTS, ...SEPRON_CHESTS }

// Boss metadata for dynamic victory screen
const BOSS_INFO: Record<string, { name: string; tokenId: string; tokenName: string; tokenBonus: string; flagId: string }> = {
  ferno: {
    name: 'Ferno the Fire Dragon',
    tokenId: 'dragon_scale',
    tokenName: 'Dragon Scale',
    tokenBonus: '+10 Max HP, +2 Defense',
    flagId: 'ferno_defeated',
  },
  sepron: {
    name: 'Sepron the Sea Serpent',
    tokenId: 'serpent_tooth',
    tokenName: 'Serpent Tooth',
    tokenBonus: '+10 Max MP, +2 Speed',
    flagId: 'sepron_defeated',
  },
}
import { collectToken } from './data/shield-tokens'
import { TutorialOverlay } from './components/TutorialOverlay'
import { TUTORIALS } from './data/tutorials'
import './Game.css'

export function Game() {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [showTitle, setShowTitle] = useState(true)
  const [currentEnemies, setCurrentEnemies] = useState<Enemy[]>([])
  const [currentDialogue, setCurrentDialogue] = useState<Dialogue | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [pendingTutorial, setPendingTutorial] = useState<string | null>(null)
  const [defeatedBossId, setDefeatedBossId] = useState<string | null>(null)
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

  // Dismiss tutorial and mark as seen
  const dismissTutorial = useCallback(() => {
    if (!pendingTutorial) return
    setGameState((prev) => (prev ? setFlag(prev, pendingTutorial) : prev))
    setPendingTutorial(null)
  }, [pendingTutorial])

  // Start new game
  const handleNewGame = useCallback((dungeonId?: string) => {
    setGameState(createNewGameState(dungeonId))
    setShowTitle(false)
    setDefeatedBossId(null)
    setPendingTutorial('tutorial_game_start')
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
      setGameState((prev) => {
        if (!prev) return prev
        if (!hasFlag(prev, 'tutorial_combat')) {
          setTimeout(() => setPendingTutorial('tutorial_combat'), 0)
        }
        return { ...prev, phase: 'combat' as const }
      })
    }
  }, [])

  // Handle entity interaction
  const handleInteract = useCallback((entity: MapEntity) => {
    switch (entity.type) {
      case 'npc':
        const dialogueId = entity.metadata?.dialogueId as string
        const dialogue = ALL_DIALOGUES[dialogueId]
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

          const contents = ALL_CHESTS[entity.id] || ['potion']
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

          // Check if any items are equipment
          const hasEquipment = items.some((slot) =>
            ['weapon', 'armor', 'accessory'].includes(slot.item.type)
          )
          if (hasEquipment && !hasFlag(prev, 'tutorial_equipment_pickup')) {
            setTimeout(() => setPendingTutorial('tutorial_equipment_pickup'), 0)
          }

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
            setGameState((prev) => {
              if (!prev) return prev
              if (!hasFlag(prev, 'tutorial_combat')) {
                setTimeout(() => setPendingTutorial('tutorial_combat'), 0)
              }
              return { ...prev, phase: 'combat' as const }
            })
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
        const levelsBefore = newState.party.map((m) => m.stats.level)
        newState = addExperience(newState, experience)
        newState = addGold(newState, gold)

        // Check for level up
        const didLevelUp = newState.party.some((m, i) => m.stats.level > levelsBefore[i])
        if (didLevelUp && !hasFlag(newState, 'tutorial_level_up')) {
          setTimeout(() => setPendingTutorial('tutorial_level_up'), 0)
        }

        // Check if boss was defeated
        const defeatedBoss = currentEnemies.find((e) => e.type === 'boss')
        if (defeatedBoss) {
          const bossInfo = BOSS_INFO[defeatedBoss.id]
          if (bossInfo) {
            newState = {
              ...newState,
              shieldTokens: collectToken(newState.shieldTokens, bossInfo.tokenId),
            }
            newState = setFlag(newState, bossInfo.flagId)
            setTimeout(() => setDefeatedBossId(defeatedBoss.id), 0)
          }
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
    setGameState((prev) => {
      if (!prev) return prev
      if (!hasFlag(prev, 'tutorial_menu')) {
        setTimeout(() => setPendingTutorial('tutorial_menu'), 0)
      }
      return { ...prev, phase: 'menu' as const }
    })
  }, [])

  const closeMenu = useCallback(() => {
    setGameState((prev) => (prev ? { ...prev, phase: 'exploring' } : prev))
  }, [])

  const openInventory = useCallback(() => {
    setGameState((prev) => {
      if (!prev) return prev
      if (!hasFlag(prev, 'tutorial_inventory')) {
        setTimeout(() => setPendingTutorial('tutorial_inventory'), 0)
      }
      return { ...prev, phase: 'inventory' as const }
    })
  }, [])

  const closeInventory = useCallback(() => {
    setGameState((prev) => (prev ? { ...prev, phase: 'menu' } : prev))
  }, [])

  const openSkillTree = useCallback(() => {
    setGameState((prev) => {
      if (!prev) return prev
      if (!hasFlag(prev, 'tutorial_skill_tree')) {
        setTimeout(() => setPendingTutorial('tutorial_skill_tree'), 0)
      }
      return { ...prev, phase: 'skill_tree' as const }
    })
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
          <p className="subtitle">Choose Your Quest</p>
          <div className="title-menu">
            <p className="level-select-label">Select Quest:</p>
            <button onClick={() => handleNewGame('ferno_cave')}>
              Ferno's Cave
              <span className="level-hint">Level 1+</span>
            </button>
            <button onClick={() => handleNewGame('sepron_lair')}>
              Sepron's Lair
              <span className="level-hint">Level 5+</span>
            </button>
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
            <button onClick={() => handleNewGame()}>Try Again</button>
            <button onClick={handleQuit}>Title Screen</button>
          </div>
        </div>
      </div>
    )
  }

  // Victory screen (after defeating a boss)
  if (gameState.phase === 'victory') {
    const bossInfo = defeatedBossId ? BOSS_INFO[defeatedBossId] : BOSS_INFO.ferno
    return (
      <div className="beast-quest-victory">
        <div className="victory-content">
          <h1>Quest Complete!</h1>
          <div className="victory-beast">
            <div className="beast-defeated-icon" />
            <h2>{bossInfo.name}</h2>
            <p className="beast-subtitle">Has Been Defeated!</p>
          </div>
          <div className="victory-reward">
            <div className="token-icon" />
            <p>The <strong>{bossInfo.tokenName}</strong> has been added to Tom's shield.</p>
            <p className="token-bonus">{bossInfo.tokenBonus}</p>
          </div>
          <div className="victory-stats">
            <p>Tom - Level {gameState.party[0]?.stats.level}</p>
            <p>Elenna - Level {gameState.party[1]?.stats.level}</p>
            <p>Play Time: {Math.floor(gameState.playTime / 60)}:{String(gameState.playTime % 60).padStart(2, '0')}</p>
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

      {/* Tutorial Overlay */}
      {pendingTutorial && TUTORIALS[pendingTutorial] && (
        <TutorialOverlay tutorial={TUTORIALS[pendingTutorial]} onDismiss={dismissTutorial} />
      )}

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
          onTutorialTrigger={(id) => {
            if (gameState && !hasFlag(gameState, id) && !pendingTutorial) {
              setPendingTutorial(id)
            }
          }}
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
