// ============================================
// Errinel Village - Tom's Home Village
// ============================================
// A peaceful village with shops and NPCs

import { DungeonFloor, DungeonRoom, TileType, Dialogue } from '../types'
import { registerFloor } from './floor-registry'

// Helper to create a tile grid from string representation
function parseTileMap(map: string[]): TileType[][] {
  const tileMap: Record<string, TileType> = {
    '.': 'floor',
    '#': 'wall',
    '~': 'water',
    'D': 'door',
    'C': 'chest',
    '*': 'healing_pool',
    'E': 'exit',
  }

  return map.map((row) =>
    row.split('').map((char) => tileMap[char] || 'floor')
  )
}

// --- Village Square ---
const VILLAGE_SQUARE_MAP = [
  '################',
  '#..............#',
  '#..............#',
  '#..............#',
  'D..............D',
  '#..............#',
  '#......~~......#',
  '#......~~......#',
  '#..............#',
  '#..............#',
  '#..............#',
  '#..............#',
  '#######DD#######',
]

const villageSquare: DungeonRoom = {
  id: 'village_square',
  name: 'Errinel - Village Square',
  width: 16,
  height: 13,
  tiles: parseTileMap(VILLAGE_SQUARE_MAP),
  entities: [
    {
      id: 'npc_uncle_henry',
      type: 'npc',
      position: { col: 4, row: 3 },
      sprite: 'npc_elder',
      direction: 'south',
      interactable: true,
      metadata: { dialogueId: 'uncle_henry' },
    },
    {
      id: 'npc_aunt_maria',
      type: 'npc',
      position: { col: 6, row: 3 },
      sprite: 'npc_elder',
      direction: 'south',
      interactable: true,
      metadata: { dialogueId: 'aunt_maria' },
    },
    {
      id: 'npc_village_child',
      type: 'npc',
      position: { col: 10, row: 8 },
      sprite: 'npc_child',
      direction: 'west',
      interactable: true,
      metadata: { dialogueId: 'village_child' },
    },
    {
      id: 'village_well',
      type: 'trigger',
      position: { col: 8, row: 7 },
      sprite: 'well',
      direction: 'south',
      interactable: true,
      metadata: { action: 'heal' },
    },
  ],
  encounters: [], // No random encounters in the village
  connections: [
    {
      direction: 'east',
      targetRoomId: 'weapon_shop',
      targetPosition: { col: 1, row: 4 },
    },
    {
      direction: 'west',
      targetRoomId: 'general_store',
      targetPosition: { col: 8, row: 4 },
    },
    {
      direction: 'south',
      targetRoomId: 'village_outskirts',
      targetPosition: { col: 7, row: 1 },
    },
  ],
}

// --- Weapon Shop ---
const WEAPON_SHOP_MAP = [
  '##########',
  '#........#',
  '#........#',
  '#........#',
  'D........#',
  '#........#',
  '#........#',
  '##########',
]

const weaponShop: DungeonRoom = {
  id: 'weapon_shop',
  name: "Errinel - Blacksmith's Forge",
  width: 10,
  height: 8,
  tiles: parseTileMap(WEAPON_SHOP_MAP),
  entities: [
    {
      id: 'npc_blacksmith',
      type: 'npc',
      position: { col: 5, row: 2 },
      sprite: 'npc_shopkeeper',
      direction: 'south',
      interactable: true,
      metadata: { dialogueId: 'blacksmith', shopId: 'errinel_blacksmith' },
    },
    {
      id: 'weapon_shop_chest',
      type: 'chest',
      position: { col: 7, row: 1 },
      sprite: 'chest',
      direction: 'south',
      interactable: true,
      metadata: {},
    },
  ],
  encounters: [],
  connections: [
    {
      direction: 'west',
      targetRoomId: 'village_square',
      targetPosition: { col: 14, row: 4 },
    },
  ],
}

// --- General Store ---
const GENERAL_STORE_MAP = [
  '##########',
  '#........#',
  '#........#',
  '#........#',
  '#........D',
  '#........#',
  '#........#',
  '##########',
]

const generalStore: DungeonRoom = {
  id: 'general_store',
  name: 'Errinel - General Store',
  width: 10,
  height: 8,
  tiles: parseTileMap(GENERAL_STORE_MAP),
  entities: [
    {
      id: 'npc_shopkeeper',
      type: 'npc',
      position: { col: 4, row: 2 },
      sprite: 'npc_shopkeeper',
      direction: 'south',
      interactable: true,
      metadata: { dialogueId: 'shopkeeper', shopId: 'errinel_general_store' },
    },
    {
      id: 'general_store_chest',
      type: 'chest',
      position: { col: 2, row: 1 },
      sprite: 'chest',
      direction: 'south',
      interactable: true,
      metadata: {},
    },
  ],
  encounters: [],
  connections: [
    {
      direction: 'east',
      targetRoomId: 'village_square',
      targetPosition: { col: 1, row: 4 },
    },
  ],
}

// --- Village Outskirts ---
const VILLAGE_OUTSKIRTS_MAP = [
  '#######DD#######',
  '#..............#',
  '#..............#',
  '#..............#',
  '#..............#',
  '#..............#',
  '#..............#',
  '#..............#',
  '#..............#',
  '#..............#',
  '#######EE#######',
]

const villageOutskirts: DungeonRoom = {
  id: 'village_outskirts',
  name: 'Errinel - Village Outskirts',
  width: 16,
  height: 11,
  tiles: parseTileMap(VILLAGE_OUTSKIRTS_MAP),
  entities: [
    {
      id: 'npc_village_guard',
      type: 'npc',
      position: { col: 12, row: 7 },
      sprite: 'npc_guard',
      direction: 'west',
      interactable: true,
      metadata: { dialogueId: 'village_guard' },
    },
    {
      id: 'npc_traveler',
      type: 'npc',
      position: { col: 4, row: 5 },
      sprite: 'npc_traveler',
      direction: 'east',
      interactable: true,
      metadata: { dialogueId: 'traveler' },
    },
  ],
  encounters: [],
  connections: [
    {
      direction: 'north',
      targetRoomId: 'village_square',
      targetPosition: { col: 7, row: 11 },
    },
  ],
}

// --- Complete Village Floor ---
export const ERRINEL_VILLAGE: DungeonFloor = {
  id: 'errinel_village',
  name: 'Errinel Village',
  rooms: [villageSquare, weaponShop, generalStore, villageOutskirts],
  startRoomId: 'village_square',
  startPosition: { col: 8, row: 5 },
}

// Register with the floor registry
registerFloor(ERRINEL_VILLAGE)

// --- Chest Contents ---
export const VILLAGE_CHEST_CONTENTS: Record<string, string[]> = {
  weapon_shop_chest: ['iron_sword'],
  general_store_chest: ['potion', 'potion', 'antidote'],
}

// --- Village Dialogue Data ---
export const VILLAGE_DIALOGUES: Record<string, Dialogue> = {
  uncle_henry: {
    id: 'uncle_henry',
    nodes: [
      {
        id: 'start',
        lines: [
          { speaker: 'Uncle Henry', text: 'Tom, my boy! Be careful out there.' },
          { speaker: 'Uncle Henry', text: 'Your father was a brave man, and I see that same courage in you.' },
          { speaker: 'Uncle Henry', text: 'The kingdom needs heroes like you and Elenna now more than ever.' },
        ],
      },
    ],
    startNodeId: 'start',
  },

  aunt_maria: {
    id: 'aunt_maria',
    nodes: [
      {
        id: 'start',
        lines: [
          { speaker: 'Aunt Maria', text: "Oh Tom, you look tired. Make sure to rest at the village well." },
          { speaker: 'Aunt Maria', text: "I've packed some supplies for your journey." },
          { speaker: 'Aunt Maria', text: 'Please be safe, both of you.' },
        ],
      },
    ],
    startNodeId: 'start',
  },

  village_child: {
    id: 'village_child',
    nodes: [
      {
        id: 'start',
        lines: [
          { speaker: 'Village Child', text: "Wow, are you really Tom? THE Tom?" },
          { speaker: 'Village Child', text: 'My dad says you defeated a real dragon!' },
          { speaker: 'Village Child', text: "When I grow up, I want to be a Beast Quest hero just like you!" },
        ],
      },
    ],
    startNodeId: 'start',
  },

  blacksmith: {
    id: 'blacksmith',
    nodes: [
      {
        id: 'start',
        lines: [
          { speaker: 'Forge Master Colton', text: "Welcome to my forge, young warrior!" },
          { speaker: 'Forge Master Colton', text: "I craft the finest weapons in all of Errinel." },
          { speaker: 'Forge Master Colton', text: "If you're heading into danger, you'll want a sturdy blade at your side." },
          { speaker: 'Forge Master Colton', text: 'Take a look around. That chest in the corner has something special.' },
        ],
      },
    ],
    startNodeId: 'start',
  },

  shopkeeper: {
    id: 'shopkeeper',
    nodes: [
      {
        id: 'start',
        lines: [
          { speaker: 'Merchant Aduro', text: 'Welcome, welcome! Best supplies in Errinel!' },
          { speaker: 'Merchant Aduro', text: 'Potions, antidotes, everything an adventurer needs.' },
          { speaker: 'Merchant Aduro', text: "Take what you need from that chest - consider it a gift for Errinel's heroes." },
        ],
      },
    ],
    startNodeId: 'start',
  },

  village_guard: {
    id: 'village_guard',
    nodes: [
      {
        id: 'start',
        lines: [
          { speaker: 'Guard', text: "The road east leads to Ferno's Cave." },
          { speaker: 'Guard', text: 'Strange creatures have been spotted along the path.' },
          { speaker: 'Guard', text: "Be on your guard - it's dangerous beyond the village walls." },
        ],
      },
    ],
    startNodeId: 'start',
  },

  traveler: {
    id: 'traveler',
    nodes: [
      {
        id: 'start',
        lines: [
          { speaker: 'Traveling Merchant', text: "I've journeyed from the Northern Mountains." },
          { speaker: 'Traveling Merchant', text: 'There are rumors of a sea serpent terrorizing the Western Ocean.' },
          { speaker: 'Traveling Merchant', text: 'They call it Sepron... a terrifying Beast enslaved by dark magic.' },
          { speaker: 'Traveling Merchant', text: 'Perhaps one day a hero brave enough will free it.' },
        ],
      },
    ],
    startNodeId: 'start',
  },
}
