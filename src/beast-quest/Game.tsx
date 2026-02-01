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
} from './gameState'
import { Dungeon } from './exploration/Dungeon'
import { CombatSystem } from './combat/CombatSystem'
import { DialogueUI } from './components/DialogueUI'
import { InventoryUI } from './components/InventoryUI'
import { GameMenu } from './components/GameMenu'
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
  const playTimeRef = useRef<NodeJS.Timeout | null>(null)

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
      return { ...prev, exploration: newExploration }
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
          const contents = CHEST_CONTENTS[entity.id] || ['potion']
          const items = contents
            .map((id) => {
              const item = ITEMS[id]
              return item ? { item, quantity: 1 } : null
            })
            .filter((slot): slot is { item: typeof ITEMS[string]; quantity: number } => slot !== null)
          return openChest(prev, entity.id, items)
        })
        break

      case 'switch':
        setGameState((prev) => (prev ? toggleSwitch(prev, entity.id) : prev))
        break

      case 'trigger':
        if (entity.metadata?.action === 'save') {
          // Save point - restore HP/MP and allow save
          setGameState((prev) => {
            if (!prev) return prev
            return { ...restoreParty(prev), phase: 'menu' }
          })
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
  const handleVictory = useCallback((experience: number, gold: number, _loot: string[]) => {
    setGameState((prev) => {
      if (!prev) return prev

      let newState = addExperience(prev, experience)
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
      }

      return { ...newState, phase: 'exploring' }
    })
    setCurrentEnemies([])
  }, [currentEnemies])

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
          <h1>Victory!</h1>
          <p>You have defeated Ferno the Fire Dragon!</p>
          <p>The Dragon Scale has been added to Tom's shield.</p>
          <div className="victory-options">
            <button onClick={handleQuit}>Return to Title</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="beast-quest-game">
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
          canFlee={!currentEnemies.some((e) => e.type === 'boss')}
          onVictory={handleVictory}
          onDefeat={handleDefeat}
          onFlee={handleFlee}
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

      {/* Game Menu */}
      {gameState.phase === 'menu' && (
        <GameMenu
          party={gameState.party}
          playTime={gameState.playTime}
          onResume={closeMenu}
          onInventory={openInventory}
          onSkillTree={() => {}} // TODO: Implement skill tree
          onSave={handleSaveGame}
          onLoad={handleLoadGame}
          onQuit={handleQuit}
        />
      )}
    </div>
  )
}
