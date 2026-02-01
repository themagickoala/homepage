// ============================================
// Item Database
// ============================================
// All items in the game: consumables, weapons, armor, accessories

import { Item, InventorySlot } from '../types'

// --- Consumables ---

export const ITEMS: Record<string, Item> = {
  // Healing items
  potion: {
    id: 'potion',
    name: 'Potion',
    description: 'Restores 30 HP',
    type: 'consumable',
    value: 25,
    stackable: true,
    maxStack: 99,
    effect: { type: 'heal_hp', value: 30 },
  },
  hi_potion: {
    id: 'hi_potion',
    name: 'Hi-Potion',
    description: 'Restores 80 HP',
    type: 'consumable',
    value: 75,
    stackable: true,
    maxStack: 99,
    effect: { type: 'heal_hp', value: 80 },
  },
  ether: {
    id: 'ether',
    name: 'Ether',
    description: 'Restores 20 MP',
    type: 'consumable',
    value: 50,
    stackable: true,
    maxStack: 99,
    effect: { type: 'heal_mp', value: 20 },
  },
  hi_ether: {
    id: 'hi_ether',
    name: 'Hi-Ether',
    description: 'Restores 50 MP',
    type: 'consumable',
    value: 150,
    stackable: true,
    maxStack: 99,
    effect: { type: 'heal_mp', value: 50 },
  },
  antidote: {
    id: 'antidote',
    name: 'Antidote',
    description: 'Cures poison',
    type: 'consumable',
    value: 30,
    stackable: true,
    maxStack: 99,
    effect: { type: 'cure_status', value: 0 }, // Value indicates status type
  },
  phoenix_feather: {
    id: 'phoenix_feather',
    name: 'Phoenix Feather',
    description: 'Revives a fallen ally with 25% HP',
    type: 'consumable',
    value: 200,
    stackable: true,
    maxStack: 10,
    effect: { type: 'heal_hp', value: -25 }, // Negative indicates percentage revival
  },

  // --- Weapons ---

  // Tom's weapons (swords)
  iron_sword: {
    id: 'iron_sword',
    name: 'Iron Sword',
    description: 'A standard iron blade',
    type: 'weapon',
    value: 100,
    stackable: false,
    maxStack: 1,
    equipStats: { attack: 5 },
  },
  steel_sword: {
    id: 'steel_sword',
    name: 'Steel Sword',
    description: 'A well-forged steel blade',
    type: 'weapon',
    value: 250,
    stackable: false,
    maxStack: 1,
    equipStats: { attack: 10 },
  },
  flame_sword: {
    id: 'flame_sword',
    name: 'Flame Sword',
    description: 'A blade imbued with fire magic',
    type: 'weapon',
    value: 500,
    stackable: false,
    maxStack: 1,
    equipStats: { attack: 15, maxMp: 5 },
  },

  // Elenna's weapons (bows)
  short_bow: {
    id: 'short_bow',
    name: 'Short Bow',
    description: 'A simple hunting bow',
    type: 'weapon',
    value: 80,
    stackable: false,
    maxStack: 1,
    equipStats: { attack: 4, speed: 2 },
  },
  long_bow: {
    id: 'long_bow',
    name: 'Long Bow',
    description: 'A powerful longbow with greater range',
    type: 'weapon',
    value: 220,
    stackable: false,
    maxStack: 1,
    equipStats: { attack: 8, speed: 3 },
  },
  hunters_bow: {
    id: 'hunters_bow',
    name: "Hunter's Bow",
    description: 'A masterwork bow favored by skilled hunters',
    type: 'weapon',
    value: 450,
    stackable: false,
    maxStack: 1,
    equipStats: { attack: 12, speed: 5 },
  },

  // --- Armor ---

  // Tom's armor (heavy)
  leather_armor: {
    id: 'leather_armor',
    name: 'Leather Armor',
    description: 'Basic protective gear',
    type: 'armor',
    value: 80,
    stackable: false,
    maxStack: 1,
    equipStats: { defense: 4, maxHp: 10 },
  },
  chainmail: {
    id: 'chainmail',
    name: 'Chainmail',
    description: 'Interlocking metal rings provide good protection',
    type: 'armor',
    value: 200,
    stackable: false,
    maxStack: 1,
    equipStats: { defense: 8, maxHp: 20 },
  },
  plate_armor: {
    id: 'plate_armor',
    name: 'Plate Armor',
    description: 'Heavy armor offering excellent defense',
    type: 'armor',
    value: 400,
    stackable: false,
    maxStack: 1,
    equipStats: { defense: 14, maxHp: 30, speed: -2 },
  },

  // Elenna's armor (light)
  cloth_tunic: {
    id: 'cloth_tunic',
    name: 'Cloth Tunic',
    description: 'Light clothing allowing free movement',
    type: 'armor',
    value: 50,
    stackable: false,
    maxStack: 1,
    equipStats: { defense: 2, speed: 2 },
  },
  ranger_cloak: {
    id: 'ranger_cloak',
    name: 'Ranger Cloak',
    description: 'A forest cloak with hidden pockets',
    type: 'armor',
    value: 180,
    stackable: false,
    maxStack: 1,
    equipStats: { defense: 5, speed: 3, maxMp: 10 },
  },
  shadow_vest: {
    id: 'shadow_vest',
    name: 'Shadow Vest',
    description: 'Dark leather vest enhancing agility',
    type: 'armor',
    value: 350,
    stackable: false,
    maxStack: 1,
    equipStats: { defense: 8, speed: 5, maxMp: 15 },
  },

  // --- Accessories ---

  iron_ring: {
    id: 'iron_ring',
    name: 'Iron Ring',
    description: 'A simple ring that boosts defense',
    type: 'accessory',
    value: 100,
    stackable: false,
    maxStack: 1,
    equipStats: { defense: 3 },
  },
  fire_amulet: {
    id: 'fire_amulet',
    name: 'Fire Amulet',
    description: 'Provides resistance to fire damage',
    type: 'accessory',
    value: 300,
    stackable: false,
    maxStack: 1,
    equipStats: { maxHp: 15 }, // Fire resistance would be a special property
  },
  swift_boots: {
    id: 'swift_boots',
    name: 'Swift Boots',
    description: 'Enchanted boots that increase speed',
    type: 'accessory',
    value: 250,
    stackable: false,
    maxStack: 1,
    equipStats: { speed: 5 },
  },
  warrior_belt: {
    id: 'warrior_belt',
    name: 'Warrior Belt',
    description: 'A sturdy belt that increases attack power',
    type: 'accessory',
    value: 200,
    stackable: false,
    maxStack: 1,
    equipStats: { attack: 5 },
  },

  // --- Key Items ---

  dungeon_key: {
    id: 'dungeon_key',
    name: 'Dungeon Key',
    description: 'Opens locked doors in the dungeon',
    type: 'key',
    value: 0,
    stackable: false,
    maxStack: 1,
  },
  boss_key: {
    id: 'boss_key',
    name: 'Boss Key',
    description: "Opens the door to Ferno's lair",
    type: 'key',
    value: 0,
    stackable: false,
    maxStack: 1,
  },
}

/**
 * Get an item by ID
 */
export function getItem(id: string): Item | undefined {
  return ITEMS[id]
}

/**
 * Create starting inventory for new game
 */
export function createStartingInventory(): InventorySlot[] {
  return [
    { item: ITEMS.potion, quantity: 3 },
    { item: ITEMS.ether, quantity: 1 },
  ]
}

/**
 * Create starting equipment for Tom
 */
export function getTomStartingEquipment() {
  return {
    weapon: ITEMS.iron_sword,
    armor: ITEMS.leather_armor,
    accessory: null,
  }
}

/**
 * Create starting equipment for Elenna
 */
export function getElennaStartingEquipment() {
  return {
    weapon: ITEMS.short_bow,
    armor: ITEMS.cloth_tunic,
    accessory: null,
  }
}

/**
 * Add item to inventory (handles stacking)
 */
export function addItemToInventory(
  inventory: InventorySlot[],
  item: Item,
  quantity: number = 1
): InventorySlot[] {
  const newInventory = [...inventory]

  if (item.stackable) {
    const existingSlot = newInventory.find((slot) => slot.item.id === item.id)
    if (existingSlot) {
      existingSlot.quantity = Math.min(existingSlot.quantity + quantity, item.maxStack)
      return newInventory
    }
  }

  newInventory.push({ item, quantity: Math.min(quantity, item.maxStack) })
  return newInventory
}

/**
 * Remove item from inventory
 */
export function removeItemFromInventory(
  inventory: InventorySlot[],
  itemId: string,
  quantity: number = 1
): InventorySlot[] {
  const newInventory = [...inventory]
  const slotIndex = newInventory.findIndex((slot) => slot.item.id === itemId)

  if (slotIndex === -1) return newInventory

  newInventory[slotIndex].quantity -= quantity

  if (newInventory[slotIndex].quantity <= 0) {
    newInventory.splice(slotIndex, 1)
  }

  return newInventory
}

/**
 * Check if inventory has item
 */
export function hasItem(inventory: InventorySlot[], itemId: string, quantity: number = 1): boolean {
  const slot = inventory.find((s) => s.item.id === itemId)
  return slot !== undefined && slot.quantity >= quantity
}
