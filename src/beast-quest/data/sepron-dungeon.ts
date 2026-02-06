// ============================================
// Sepron's Lair Dungeon Map Data
// ============================================
// The second dungeon - Sepron the Sea Serpent's ocean cave

import { DungeonFloor, DungeonRoom, TileType, EncounterZone } from '../types'
import { registerFloor } from './floor-registry'

// Helper to create a tile grid from string representation
function parseTileMap(map: string[]): TileType[][] {
  const tileMap: Record<string, TileType> = {
    '.': 'floor',
    '#': 'wall',
    '~': 'water',
    'L': 'lava',
    'O': 'pit',
    'D': 'door',
    'C': 'chest',
    'S': 'switch',
    '^': 'stairs_up',
    'v': 'stairs_down',
    '*': 'healing_pool',
  }

  return map.map((row) =>
    row.split('').map((char) => tileMap[char] || 'floor')
  )
}

// --- Room 1: Coastal Grotto (Entry) ---
const GROTTO_MAP = [
  '##########',
  '#........#',
  '#.~~.....#',
  '#.~~..*..#',
  '#........#',
  '#........#',
  '#........D',
  '#........#',
  '#........#',
  '##########',
]

const grottoRoom: DungeonRoom = {
  id: 'grotto',
  name: 'Coastal Grotto',
  width: 10,
  height: 10,
  tiles: parseTileMap(GROTTO_MAP),
  entities: [
    {
      id: 'npc_fisherman',
      type: 'npc',
      position: { col: 2, row: 2 },
      sprite: 'npc_fisherman',
      direction: 'south',
      interactable: true,
      metadata: { dialogueId: 'fisherman_intro' },
    },
  ],
  encounters: [
    {
      bounds: { minCol: 1, minRow: 4, maxCol: 8, maxRow: 8 },
      encounterRate: 0.08,
      possibleEncounters: [
        { enemies: ['tide_crab'], weight: 35 },
        { enemies: ['tide_crab', 'tide_crab'], weight: 25 },
        { enemies: ['sea_slug'], weight: 25 },
        { enemies: ['sea_slug', 'tide_crab'], weight: 15 },
      ],
    },
  ],
  connections: [
    {
      direction: 'east',
      targetRoomId: 'tidal_cavern',
      targetPosition: { col: 1, row: 5 },
    },
  ],
}

// --- Room 2: Tidal Cavern ---
const TIDAL_CAVERN_MAP = [
  '##############',
  '#............#',
  '#....~~......#',
  '#...~~~~.....#',
  '#...~~~~.....#',
  'D....~~......D',
  '#............#',
  '#............#',
  '#....~~......#',
  '#....~~......#',
  '#............#',
  '##############',
]

const tidalCavernRoom: DungeonRoom = {
  id: 'tidal_cavern',
  name: 'Tidal Cavern',
  width: 14,
  height: 12,
  tiles: parseTileMap(TIDAL_CAVERN_MAP),
  entities: [
    {
      id: 'tidal_cavern_chest_1',
      type: 'chest',
      position: { col: 3, row: 7 },
      sprite: 'chest',
      direction: 'south',
      interactable: true,
      metadata: {},
    },
    {
      id: 'tidal_cavern_chest_2',
      type: 'chest',
      position: { col: 10, row: 3 },
      sprite: 'chest',
      direction: 'south',
      interactable: true,
      metadata: {},
    },
  ],
  encounters: [
    {
      bounds: { minCol: 1, minRow: 1, maxCol: 12, maxRow: 10 },
      encounterRate: 0.1,
      possibleEncounters: [
        { enemies: ['sea_slug', 'sea_slug'], weight: 25 },
        { enemies: ['reef_guard'], weight: 25 },
        { enemies: ['tide_crab', 'ice_jellyfish'], weight: 25 },
        { enemies: ['tide_crab', 'tide_crab', 'sea_slug'], weight: 25 },
      ],
    },
  ],
  connections: [
    {
      direction: 'west',
      targetRoomId: 'grotto',
      targetPosition: { col: 8, row: 6 },
    },
    {
      direction: 'east',
      targetRoomId: 'submerged_passage',
      targetPosition: { col: 1, row: 5 },
    },
  ],
}

// --- Room 3: Submerged Passage (Puzzle Room) ---
const SUBMERGED_PASSAGE_MAP = [
  '############',
  '#..........#',
  '#..........#',
  '#..........#',
  'D..........#',
  '#....~~....#',
  '#....~~....#',
  '#..........#',
  '#..........#',
  '#..........D',
  '#..........#',
  '############',
]

const submergedPassageRoom: DungeonRoom = {
  id: 'submerged_passage',
  name: 'Submerged Passage',
  width: 12,
  height: 12,
  tiles: parseTileMap(SUBMERGED_PASSAGE_MAP),
  entities: [
    {
      id: 'tidal_switch_1',
      type: 'switch',
      position: { col: 2, row: 2 },
      sprite: 'switch_off',
      direction: 'south',
      interactable: true,
      metadata: { activated: false, targetId: 'tidal_gate' },
    },
    {
      id: 'tidal_switch_2',
      type: 'switch',
      position: { col: 9, row: 4 },
      sprite: 'switch_off',
      direction: 'south',
      interactable: true,
      metadata: { activated: false, targetId: 'tidal_gate' },
    },
    {
      id: 'tidal_switch_3',
      type: 'switch',
      position: { col: 5, row: 9 },
      sprite: 'switch_off',
      direction: 'south',
      interactable: true,
      metadata: { activated: false, targetId: 'tidal_gate' },
    },
  ],
  encounters: [
    {
      bounds: { minCol: 1, minRow: 1, maxCol: 10, maxRow: 10 },
      encounterRate: 0.08,
      possibleEncounters: [
        { enemies: ['ice_jellyfish', 'ice_jellyfish'], weight: 25 },
        { enemies: ['reef_guard'], weight: 25 },
        { enemies: ['frost_serpent'], weight: 25 },
        { enemies: ['sea_slug', 'ice_jellyfish'], weight: 25 },
      ],
    },
  ],
  connections: [
    {
      direction: 'west',
      targetRoomId: 'tidal_cavern',
      targetPosition: { col: 12, row: 5 },
    },
    {
      direction: 'east',
      targetRoomId: 'coral_tunnel',
      targetPosition: { col: 1, row: 5 },
      requiredPuzzle: 'tidal_locks',
    },
  ],
}

// --- Room 4: Coral Reef Tunnel ---
const CORAL_TUNNEL_MAP = [
  '################',
  '#..~~~~........#',
  '#..~~~~........#',
  '#..............#',
  '#..........~~..#',
  'D..........~~..D',
  '#..........~~..#',
  '#..............#',
  '#..~~~~........#',
  '#..~~~~..*.....#',
  '#..............#',
  '################',
]

const coralTunnelRoom: DungeonRoom = {
  id: 'coral_tunnel',
  name: 'Coral Reef Tunnel',
  width: 16,
  height: 12,
  tiles: parseTileMap(CORAL_TUNNEL_MAP),
  entities: [
    {
      id: 'coral_tunnel_chest',
      type: 'chest',
      position: { col: 11, row: 2 },
      sprite: 'chest',
      direction: 'south',
      interactable: true,
      metadata: {},
    },
  ],
  encounters: [
    {
      bounds: { minCol: 1, minRow: 1, maxCol: 14, maxRow: 10 },
      encounterRate: 0.12,
      possibleEncounters: [
        { enemies: ['frost_serpent', 'ice_jellyfish'], weight: 25 },
        { enemies: ['aqua_guardian'], weight: 20 },
        { enemies: ['frost_serpent', 'frost_serpent'], weight: 25 },
        { enemies: ['reef_guard', 'frost_serpent'], weight: 30 },
      ],
    },
  ],
  connections: [
    {
      direction: 'west',
      targetRoomId: 'submerged_passage',
      targetPosition: { col: 10, row: 9 },
    },
    {
      direction: 'east',
      targetRoomId: 'sepron_depths',
      targetPosition: { col: 1, row: 6 },
    },
  ],
}

// --- Room 5: Sepron's Depths (Boss Room) ---
const SEPRON_DEPTHS_MAP = [
  '##################',
  '#................#',
  '#..~~~~~~~~~~~~..#',
  '#..~..........~..#',
  '#..~..........~..#',
  '#..~..........~..#',
  'D................#',
  '#..~..........~..#',
  '#..~..........~..#',
  '#..~..........~..#',
  '#..~~~~~~~~~~~~..#',
  '#................#',
  '##################',
]

const sepronDepthsRoom: DungeonRoom = {
  id: 'sepron_depths',
  name: "Sepron's Depths",
  width: 18,
  height: 13,
  tiles: parseTileMap(SEPRON_DEPTHS_MAP),
  entities: [
    {
      id: 'boss_sepron',
      type: 'enemy',
      position: { col: 9, row: 6 },
      sprite: 'boss_sepron',
      direction: 'west',
      interactable: true,
      metadata: { enemyId: 'sepron', isBoss: true },
    },
  ],
  encounters: [], // No random encounters in boss room
  connections: [
    {
      direction: 'west',
      targetRoomId: 'coral_tunnel',
      targetPosition: { col: 14, row: 5 },
    },
  ],
}

// --- Complete Dungeon Floor ---
export const SEPRON_DUNGEON: DungeonFloor = {
  id: 'sepron_lair',
  name: "Sepron's Lair",
  rooms: [grottoRoom, tidalCavernRoom, submergedPassageRoom, coralTunnelRoom, sepronDepthsRoom],
  startRoomId: 'grotto',
  startPosition: { col: 5, row: 7 },
}

registerFloor(SEPRON_DUNGEON)

/**
 * Get a room by ID
 */
export function getRoom(roomId: string): DungeonRoom | undefined {
  return SEPRON_DUNGEON.rooms.find((room) => room.id === roomId)
}

/**
 * Get all rooms in the dungeon
 */
export function getAllRooms(): DungeonRoom[] {
  return SEPRON_DUNGEON.rooms
}

/**
 * Check if position is within an encounter zone
 */
export function getEncounterZone(
  room: DungeonRoom,
  position: { col: number; row: number }
): EncounterZone | null {
  for (const zone of room.encounters) {
    if (
      position.col >= zone.bounds.minCol &&
      position.col <= zone.bounds.maxCol &&
      position.row >= zone.bounds.minRow &&
      position.row <= zone.bounds.maxRow
    ) {
      return zone
    }
  }
  return null
}

// --- Chest Contents ---
export const CHEST_CONTENTS: Record<string, string[]> = {
  'tidal_cavern_chest_1': ['potion', 'potion', 'antidote'],
  'tidal_cavern_chest_2': ['ether', 'ice_shard'],
  'coral_tunnel_chest': ['hi_potion', 'tidal_pendant'],
}

// --- Dialogue Data ---
export const DUNGEON_DIALOGUES = {
  fisherman_intro: {
    id: 'fisherman_intro',
    nodes: [
      {
        id: 'start',
        lines: [
          { speaker: 'Old Fisherman', text: "Careful, young ones! These waters belong to Sepron." },
          { speaker: 'Old Fisherman', text: 'The Sea Serpent has terrorised the Western Ocean for centuries.' },
          {
            speaker: 'Old Fisherman',
            text: 'Its fangs can crush a ship, and its tidal waves can flatten a village.',
          },
        ],
        nextNodeId: 'advice',
      },
      {
        id: 'advice',
        lines: [
          { speaker: 'Old Fisherman', text: "The deep passage is sealed by three ancient tidal locks." },
          { speaker: 'Old Fisherman', text: 'Find and activate all three switches to drain the way forward.' },
          { speaker: 'Old Fisherman', text: "Sepron is weak to lightning and fire. Use that to your advantage!" },
        ],
      },
    ],
    startNodeId: 'start',
  },
}
