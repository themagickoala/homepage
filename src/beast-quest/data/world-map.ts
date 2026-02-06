// ============================================
// World Map Location Data
// ============================================
// Defines all overworld locations, positions, connections, and shop inventories

import { WorldMapLocation, ShopData } from '../types'

// Locations positioned to match the avantia.png map (1000x700 canvas)
export const WORLD_MAP_LOCATIONS: Record<string, WorldMapLocation> = {
  errinel_village: {
    id: 'errinel_village',
    name: 'Errinel Village',
    type: 'village',
    x: 180,
    y: 480,
    floorId: 'errinel_village',
    connectedTo: ['ferno_cave'],
    unlockCondition: null,
    description: "Tom's home village, a peaceful hamlet in Avantia.",
  },
  ferno_cave: {
    id: 'ferno_cave',
    name: "Ferno's Cave",
    type: 'dungeon',
    x: 350,
    y: 350,
    floorId: 'ferno_cave',
    connectedTo: ['errinel_village', 'western_ocean', 'kings_city'],
    unlockCondition: null,
    description: 'A volcanic cave where Ferno the Fire Dragon dwells.',
  },
  western_ocean: {
    id: 'western_ocean',
    name: 'Western Ocean',
    type: 'dungeon',
    x: 100,
    y: 250,
    floorId: 'sepron_lair',
    connectedTo: ['ferno_cave'],
    unlockCondition: 'ferno_defeated',
    description: 'The deep waters where Sepron the Sea Serpent lurks.',
  },
  kings_city: {
    id: 'kings_city',
    name: "King Hugo's City",
    type: 'village',
    x: 750,
    y: 380,
    floorId: 'kings_city',
    connectedTo: ['ferno_cave', 'dark_jungle'],
    unlockCondition: 'ferno_defeated',
    description: 'The grand capital of Avantia, ruled by King Hugo.',
  },
  dark_jungle: {
    id: 'dark_jungle',
    name: 'The Dark Jungle',
    type: 'dungeon',
    x: 600,
    y: 250,
    floorId: 'dark_jungle',
    connectedTo: ['kings_city', 'stonewin'],
    unlockCondition: 'sepron_defeated',
    description: 'A treacherous jungle hiding an ancient beast.',
  },
  stonewin: {
    id: 'stonewin',
    name: 'Stonewin Volcano',
    type: 'dungeon',
    x: 800,
    y: 150,
    floorId: 'stonewin',
    connectedTo: ['dark_jungle'],
    unlockCondition: 'arcta_defeated',
    description: 'A massive volcano crackling with dark energy.',
  },
}

/**
 * Get all locations visible on the world map (discovered + connected to discovered)
 */
export function getVisibleLocations(
  discoveredLocations: string[]
): WorldMapLocation[] {
  const visible = new Set<string>()

  for (const id of discoveredLocations) {
    visible.add(id)
    const loc = WORLD_MAP_LOCATIONS[id]
    if (loc) {
      for (const connId of loc.connectedTo) {
        visible.add(connId)
      }
    }
  }

  return Array.from(visible)
    .map((id) => WORLD_MAP_LOCATIONS[id])
    .filter((loc): loc is WorldMapLocation => loc !== undefined)
}

// --- Shop Data ---

export const SHOPS: Record<string, ShopData> = {
  errinel_general_store: {
    id: 'errinel_general_store',
    name: "Merchant Aduro's Shop",
    items: [
      { itemId: 'potion', stock: -1 },
      { itemId: 'hi_potion', stock: -1 },
      { itemId: 'ether', stock: -1 },
      { itemId: 'antidote', stock: -1 },
      { itemId: 'phoenix_feather', stock: 3 },
    ],
  },
  errinel_blacksmith: {
    id: 'errinel_blacksmith',
    name: "Forge Master Colton's Forge",
    items: [
      { itemId: 'iron_sword', stock: 1 },
      { itemId: 'steel_sword', stock: 1 },
      { itemId: 'short_bow', stock: 1 },
      { itemId: 'long_bow', stock: 1 },
      { itemId: 'leather_armor', stock: 1 },
      { itemId: 'chainmail', stock: 1 },
      { itemId: 'cloth_tunic', stock: 1 },
      { itemId: 'iron_ring', stock: 2 },
    ],
  },
}
