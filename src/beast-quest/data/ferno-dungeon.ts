// ============================================
// Ferno's Cave Dungeon Map Data
// ============================================
// The dungeon layout for the demo - Ferno's mountain cave

import { DungeonFloor, DungeonRoom, TileType, EncounterZone } from '../types'

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
    '*': 'save_point',
  }

  return map.map((row) =>
    row.split('').map((char) => tileMap[char] || 'floor')
  )
}

// --- Room 1: Cave Entrance ---
const ENTRANCE_MAP = [
  '##########',
  '#........#',
  '#........#',
  '#..*.....#',
  '#........#',
  '#........#',
  '#........D',
  '#........#',
  '#........#',
  '##########',
]

const entranceRoom: DungeonRoom = {
  id: 'entrance',
  name: 'Cave Entrance',
  width: 10,
  height: 10,
  tiles: parseTileMap(ENTRANCE_MAP),
  entities: [
    {
      id: 'npc_hermit',
      type: 'npc',
      position: { col: 2, row: 2 },
      sprite: 'npc_hermit',
      direction: 'south',
      interactable: true,
      metadata: { dialogueId: 'hermit_intro' },
    },
  ],
  encounters: [
    {
      bounds: { minCol: 1, minRow: 4, maxCol: 8, maxRow: 8 },
      encounterRate: 0.08,
      possibleEncounters: [
        { enemies: ['cave_bat'], weight: 50 },
        { enemies: ['cave_bat', 'cave_bat'], weight: 30 },
        { enemies: ['cave_spider'], weight: 20 },
      ],
    },
  ],
  connections: [
    {
      direction: 'east',
      targetRoomId: 'main_cavern',
      targetPosition: { col: 1, row: 5 },
    },
  ],
}

// --- Room 2: Main Cavern ---
const MAIN_CAVERN_MAP = [
  '##############',
  '#............#',
  '#....##......#',
  '#....##......#',
  '#............#',
  'D............D',
  '#............#',
  '#............#',
  '#....##......#',
  '#....##......#',
  '#............#',
  '##############',
]

const mainCavernRoom: DungeonRoom = {
  id: 'main_cavern',
  name: 'Main Cavern',
  width: 14,
  height: 12,
  tiles: parseTileMap(MAIN_CAVERN_MAP),
  entities: [
    {
      id: 'main_cavern_chest_1',
      type: 'chest',
      position: { col: 3, row: 7 },
      sprite: 'chest',
      direction: 'south',
      interactable: true,
      metadata: {},
    },
    {
      id: 'main_cavern_chest_2',
      type: 'chest',
      position: { col: 9, row: 3 },
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
        { enemies: ['cave_bat', 'cave_spider'], weight: 30 },
        { enemies: ['cave_spider', 'cave_spider'], weight: 25 },
        { enemies: ['rock_golem'], weight: 25 },
        { enemies: ['cave_bat', 'cave_bat', 'cave_spider'], weight: 20 },
      ],
    },
  ],
  connections: [
    {
      direction: 'west',
      targetRoomId: 'entrance',
      targetPosition: { col: 8, row: 6 },
    },
    {
      direction: 'east',
      targetRoomId: 'puzzle_room',
      targetPosition: { col: 1, row: 4 },
    },
  ],
}

// --- Room 3: Puzzle Room ---
const PUZZLE_ROOM_MAP = [
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

const puzzleRoom: DungeonRoom = {
  id: 'puzzle_room',
  name: 'Puzzle Chamber',
  width: 12,
  height: 12,
  tiles: parseTileMap(PUZZLE_ROOM_MAP),
  entities: [
    {
      id: 'puzzle_block_1',
      type: 'switch',
      position: { col: 3, row: 2 },
      sprite: 'switch_off',
      direction: 'south',
      interactable: true,
      metadata: { activated: false, targetId: 'puzzle_bridge' },
    },
    {
      id: 'puzzle_block_2',
      type: 'switch',
      position: { col: 8, row: 8 },
      sprite: 'switch_off',
      direction: 'south',
      interactable: true,
      metadata: { activated: false, targetId: 'puzzle_bridge' },
    },
  ],
  encounters: [
    {
      bounds: { minCol: 1, minRow: 1, maxCol: 10, maxRow: 10 },
      encounterRate: 0.08,
      possibleEncounters: [
        { enemies: ['cave_spider', 'cave_spider'], weight: 40 },
        { enemies: ['rock_golem'], weight: 30 },
        { enemies: ['flame_bat'], weight: 30 },
      ],
    },
  ],
  connections: [
    {
      direction: 'west',
      targetRoomId: 'main_cavern',
      targetPosition: { col: 12, row: 5 },
    },
    {
      direction: 'east',
      targetRoomId: 'volcanic_passage',
      targetPosition: { col: 1, row: 5 },
    },
  ],
}

// --- Room 4: Volcanic Passage ---
const VOLCANIC_PASSAGE_MAP = [
  '################',
  '#..LLLL........#',
  '#..LLLL........#',
  '#..............#',
  '#..........LL..#',
  'D..........LL..D',
  '#..........LL..#',
  '#..............#',
  '#..LLLL........#',
  '#..LLLL..*.....#',
  '#..............#',
  '################',
]

const volcanicPassageRoom: DungeonRoom = {
  id: 'volcanic_passage',
  name: 'Volcanic Passage',
  width: 16,
  height: 12,
  tiles: parseTileMap(VOLCANIC_PASSAGE_MAP),
  entities: [
    {
      id: 'volcanic_passage_chest',
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
        { enemies: ['flame_bat', 'flame_bat'], weight: 30 },
        { enemies: ['magma_slime', 'magma_slime'], weight: 25 },
        { enemies: ['flame_bat', 'magma_slime'], weight: 25 },
        { enemies: ['fire_elemental'], weight: 20 },
      ],
    },
  ],
  connections: [
    {
      direction: 'west',
      targetRoomId: 'puzzle_room',
      targetPosition: { col: 10, row: 9 },
    },
    {
      direction: 'east',
      targetRoomId: 'ferno_lair',
      targetPosition: { col: 1, row: 6 },
    },
  ],
}

// --- Room 5: Ferno's Lair (Boss Room) ---
const FERNO_LAIR_MAP = [
  '##################',
  '#................#',
  '#..LLLLLLLLLLLL..#',
  '#..L..........L..#',
  '#..L..........L..#',
  '#..L..........L..#',
  'D................#',
  '#..L..........L..#',
  '#..L..........L..#',
  '#..L..........L..#',
  '#..LLLLLLLLLLLL..#',
  '#................#',
  '##################',
]

const fernoLairRoom: DungeonRoom = {
  id: 'ferno_lair',
  name: "Ferno's Lair",
  width: 18,
  height: 13,
  tiles: parseTileMap(FERNO_LAIR_MAP),
  entities: [
    {
      id: 'boss_ferno',
      type: 'enemy',
      position: { col: 9, row: 6 },
      sprite: 'boss_ferno',
      direction: 'west',
      interactable: true,
      metadata: { enemyId: 'ferno', isBoss: true },
    },
  ],
  encounters: [], // No random encounters in boss room
  connections: [
    {
      direction: 'west',
      targetRoomId: 'volcanic_passage',
      targetPosition: { col: 14, row: 5 },
    },
  ],
}

// --- Complete Dungeon Floor ---
export const FERNO_DUNGEON: DungeonFloor = {
  id: 'ferno_cave',
  name: "Ferno's Cave",
  rooms: [entranceRoom, mainCavernRoom, puzzleRoom, volcanicPassageRoom, fernoLairRoom],
  startRoomId: 'entrance',
  startPosition: { col: 5, row: 7 },
}

/**
 * Get a room by ID
 */
export function getRoom(roomId: string): DungeonRoom | undefined {
  return FERNO_DUNGEON.rooms.find((room) => room.id === roomId)
}

/**
 * Get all rooms in the dungeon
 */
export function getAllRooms(): DungeonRoom[] {
  return FERNO_DUNGEON.rooms
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
  'main_cavern_chest_1': ['potion', 'potion'],
  'main_cavern_chest_2': ['ether', 'antidote'],
  'volcanic_passage_chest': ['hi_potion', 'fire_amulet'],
}

// --- Dialogue Data ---
export const DUNGEON_DIALOGUES = {
  hermit_intro: {
    id: 'hermit_intro',
    nodes: [
      {
        id: 'start',
        lines: [
          { speaker: 'Hermit', text: "Ah, young heroes! You seek Ferno, don't you?" },
          { speaker: 'Hermit', text: 'The Fire Dragon dwells deep within this cave.' },
          {
            speaker: 'Hermit',
            text: 'Be warned - the path ahead is treacherous, filled with creatures of flame.',
          },
        ],
        nextNodeId: 'advice',
      },
      {
        id: 'advice',
        lines: [
          { speaker: 'Hermit', text: "You'll need to solve the ancient puzzle to proceed." },
          { speaker: 'Hermit', text: 'Two switches must be pressed in the correct order.' },
          { speaker: 'Hermit', text: 'Good luck, and may your courage never falter!' },
        ],
      },
    ],
    startNodeId: 'start',
  },
}
