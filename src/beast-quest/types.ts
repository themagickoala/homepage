// ============================================
// Beast Quest RPG - Type Definitions
// ============================================

// --- Core Types ---

export interface Vector2D {
  x: number
  y: number
}

// Isometric position (grid coordinates)
export interface IsoPosition {
  col: number
  row: number
}

// Direction for movement and facing
export type Direction = 'north' | 'south' | 'east' | 'west'

// --- Character Types ---

export interface CharacterStats {
  maxHp: number
  currentHp: number
  maxMp: number
  currentMp: number
  attack: number
  defense: number
  speed: number
  level: number
  experience: number
  experienceToNextLevel: number
}

export interface Equipment {
  weapon: Item | null
  armor: Item | null
  accessory: Item | null
}

export interface Character {
  id: string
  name: string
  stats: CharacterStats
  equipment: Equipment
  skills: Skill[]
  unlockedSkillIds: string[]
  sprite: string // Sprite key for rendering
}

// Player party member (Tom or Elenna)
export interface PartyMember extends Character {
  skillPoints: number
  skillTree: SkillTreeNode[]
}

// --- Skill Types ---

export type SkillType = 'attack' | 'magic' | 'support' | 'passive'
export type TargetType = 'single_enemy' | 'all_enemies' | 'single_ally' | 'all_allies' | 'self'
export type ElementType = 'physical' | 'fire' | 'ice' | 'lightning' | 'holy' | 'dark'

export interface Skill {
  id: string
  name: string
  description: string
  type: SkillType
  targetType: TargetType
  element: ElementType
  mpCost: number
  power: number // Base damage/healing multiplier
  effects?: SkillEffect[]
}

export interface SkillEffect {
  type: 'buff' | 'debuff' | 'status' | 'heal_percent' | 'drain' | 'dot'
  stat?: keyof CharacterStats
  value: number
  duration?: number // Turns
}

export interface SkillTreeNode {
  skill: Skill
  levelRequired: number
  prerequisiteSkillIds: string[]
  position: Vector2D // Position in skill tree UI
}

// --- Item Types ---

export type ItemType = 'consumable' | 'weapon' | 'armor' | 'accessory' | 'key'

export interface Item {
  id: string
  name: string
  description: string
  type: ItemType
  value: number // Gold value
  stackable: boolean
  maxStack: number
  effect?: ItemEffect
  equipStats?: Partial<CharacterStats>
}

export interface ItemEffect {
  type: 'heal_hp' | 'heal_mp' | 'cure_status' | 'buff' | 'damage'
  value: number
  duration?: number
}

export interface InventorySlot {
  item: Item
  quantity: number
}

// --- Enemy Types ---

export type EnemyType = 'normal' | 'elite' | 'boss'

export interface Enemy {
  id: string
  name: string
  stats: CharacterStats
  sprite: string
  type: EnemyType
  experienceReward: number
  goldReward: number
  lootTable: LootEntry[]
  skills: Skill[]
  aiPattern: AIPattern
  weaknesses: ElementType[]
  resistances: ElementType[]
}

export interface LootEntry {
  itemId: string
  dropRate: number // 0-1
}

export type AIPattern = 'aggressive' | 'defensive' | 'balanced' | 'support' | 'boss_ferno'

// --- Combat Types ---

export type CombatPhase =
  | 'start'
  | 'player_turn'
  | 'selecting_action'
  | 'selecting_target'
  | 'executing_action'
  | 'enemy_turn'
  | 'victory'
  | 'defeat'
  | 'fleeing'

export interface CombatAction {
  type: 'attack' | 'skill' | 'item' | 'defend' | 'flee'
  actorId: string
  targetIds: string[]
  skillId?: string
  itemId?: string
}

export interface CombatEntity {
  id: string
  name: string
  stats: CharacterStats
  isPlayer: boolean
  isDefending: boolean
  statusEffects: StatusEffect[]
  turnOrder: number
}

export interface StatusEffect {
  id: string
  name: string
  type: 'buff' | 'debuff' | 'dot' | 'hot' | 'stun' | 'poison' | 'burn'
  stat?: keyof CharacterStats
  value: number
  remainingTurns: number
}

export interface CombatState {
  phase: CombatPhase
  turn: number
  entities: CombatEntity[]
  currentEntityIndex: number
  pendingAction: CombatAction | null
  battleLog: BattleLogEntry[]
  canFlee: boolean
}

export interface BattleLogEntry {
  turn: number
  message: string
  type: 'action' | 'damage' | 'heal' | 'status' | 'info'
}

// --- Dungeon/Exploration Types ---

export type TileType =
  | 'floor'
  | 'wall'
  | 'water'
  | 'lava'
  | 'pit'
  | 'door'
  | 'chest'
  | 'switch'
  | 'stairs_up'
  | 'stairs_down'
  | 'save_point'

export interface Tile {
  type: TileType
  walkable: boolean
  sprite: string
  interactable: boolean
  metadata?: Record<string, unknown>
}

export interface MapEntity {
  id: string
  type: 'npc' | 'enemy' | 'chest' | 'switch' | 'trigger'
  position: IsoPosition
  sprite: string
  direction: Direction
  interactable: boolean
  metadata?: Record<string, unknown>
}

export interface DungeonRoom {
  id: string
  name: string
  width: number
  height: number
  tiles: TileType[][]
  entities: MapEntity[]
  encounters: EncounterZone[]
  connections: RoomConnection[]
}

export interface RoomConnection {
  direction: Direction
  targetRoomId: string
  targetPosition: IsoPosition
  requiredPuzzle?: string // Puzzle ID that must be solved to use this connection
}

export interface EncounterZone {
  bounds: { minCol: number; minRow: number; maxCol: number; maxRow: number }
  encounterRate: number // 0-1, chance per step
  possibleEncounters: EncounterGroup[]
}

export interface EncounterGroup {
  enemies: string[] // Enemy IDs
  weight: number // Relative probability
}

export interface DungeonFloor {
  id: string
  name: string
  rooms: DungeonRoom[]
  startRoomId: string
  startPosition: IsoPosition
}

// --- Companion Types (Storm & Silver) ---

export type CompanionType = 'storm' | 'silver'

export interface Companion {
  id: CompanionType
  name: string
  sprite: string
  combatSkill: Skill
  explorationAbility: string
  isUnlocked: boolean
}

// --- Shield Token Types ---

export interface ShieldToken {
  id: string
  name: string
  description: string
  beastName: string
  sprite: string
  passiveBonus: Partial<CharacterStats>
  activeAbility: Skill
  isCollected: boolean
}

// --- Dialogue Types ---

export interface DialogueLine {
  speaker: string
  text: string
  portrait?: string
}

export interface DialogueChoice {
  text: string
  nextNodeId: string
  condition?: string
}

export interface DialogueNode {
  id: string
  lines: DialogueLine[]
  choices?: DialogueChoice[]
  nextNodeId?: string
  onComplete?: string // Event to trigger
}

export interface Dialogue {
  id: string
  nodes: DialogueNode[]
  startNodeId: string
}

// --- Game State Types ---

export type GamePhase =
  | 'title'
  | 'exploring'
  | 'combat'
  | 'dialogue'
  | 'menu'
  | 'inventory'
  | 'skill_tree'
  | 'game_over'
  | 'victory'

export interface ExplorationState {
  currentFloorId: string
  currentRoomId: string
  playerPosition: IsoPosition
  playerDirection: Direction
  visitedRooms: string[]
  openedChests: string[]
  activatedSwitches: string[]
  stepsSinceLastEncounter: number
}

export interface GameState {
  phase: GamePhase
  party: PartyMember[]
  inventory: InventorySlot[]
  gold: number
  companions: Companion[]
  shieldTokens: ShieldToken[]
  exploration: ExplorationState
  combat: CombatState | null
  currentDialogue: Dialogue | null
  currentDialogueNodeId: string | null
  flags: Record<string, boolean> // Story flags
  playTime: number // In seconds
}

// --- Save/Load Types ---

export interface SaveData {
  version: string
  timestamp: number
  gameState: GameState
}

// --- Input Types ---

export type InputAction =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'confirm'
  | 'cancel'
  | 'menu'
  | 'skill1'
  | 'skill2'
  | 'skill3'
  | 'skill4'

export interface InputState {
  [key: string]: boolean
}

// --- Rendering Types ---

export interface SpriteFrame {
  x: number
  y: number
  width: number
  height: number
}

export interface SpriteAnimation {
  frames: SpriteFrame[]
  frameDuration: number // ms per frame
  loop: boolean
}

export interface Sprite {
  image: string // Image key
  animations: Record<string, SpriteAnimation>
  currentAnimation: string
  currentFrame: number
  frameTimer: number
}

// --- UI Types ---

export interface MenuItem {
  id: string
  label: string
  enabled: boolean
  onSelect: () => void
}

export interface MenuState {
  items: MenuItem[]
  selectedIndex: number
  isOpen: boolean
}
