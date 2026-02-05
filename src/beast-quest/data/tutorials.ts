// ============================================
// Tutorial Definitions
// ============================================
// Static content for all tutorial overlays

export interface TutorialDef {
  id: string
  title: string
  lines: string[]
}

export const TUTORIALS: Record<string, TutorialDef> = {
  tutorial_game_start: {
    id: 'tutorial_game_start',
    title: 'Welcome to Beast Quest',
    lines: [
      'Your quest: venture deep into the cave and defeat Ferno the Fire Dragon.',
      'Use Arrow Keys or WASD to move through the dungeon.',
      'Press Enter or Space to interact with NPCs, chests, and switches.',
      'Press Escape to open the menu where you can save, view skills, and manage inventory.',
      'Watch out — enemies lurk in the shadows and will attack as you explore!',
    ],
  },
  tutorial_menu: {
    id: 'tutorial_menu',
    title: 'Game Menu',
    lines: [
      'Use Up/Down arrows to navigate and Enter to select an option.',
      'Inventory — manage your items and equip weapons and armour.',
      'Skills — learn new abilities as you level up.',
      'Status — view detailed stats for your party.',
      'Save — generate a save code you can copy and store.',
      'Load — paste a save code to restore your progress.',
    ],
  },
  tutorial_inventory: {
    id: 'tutorial_inventory',
    title: 'Inventory',
    lines: [
      'Use the tabs at the top to switch between Items, Equipment, and Key Items.',
      'Select a consumable and choose a party member to use it on.',
      'Select a piece of equipment to equip it — any currently worn gear will be swapped out.',
      'Navigate with Arrow Keys, confirm with Enter, and press Escape to close.',
    ],
  },
  tutorial_skill_tree: {
    id: 'tutorial_skill_tree',
    title: 'Skills',
    lines: [
      'Each character has a unique set of skills to learn.',
      'Skills marked with a star are available to learn at your current level.',
      'Locked skills show what level or prerequisite skills you need first.',
      'Use Left/Right to switch between characters, Up/Down to browse skills.',
    ],
  },
  tutorial_combat: {
    id: 'tutorial_combat',
    title: 'Combat',
    lines: [
      'Combat is turn-based — choose actions when it is your turn.',
      'Attack — a basic physical strike against one enemy.',
      'Skills — spend MP to use powerful abilities.',
      'Items — use potions and other consumables from your inventory.',
      'Defend — brace yourself to take less damage this turn.',
      'Flee — attempt to escape the battle (unavailable against bosses).',
    ],
  },
  tutorial_level_up: {
    id: 'tutorial_level_up',
    title: 'Level Up!',
    lines: [
      'Your party has grown stronger!',
      'New skills may now be available to learn.',
      'Open the menu with Escape and select Skills to see what you can unlock.',
    ],
  },
  tutorial_equipment_pickup: {
    id: 'tutorial_equipment_pickup',
    title: 'Equipment Found',
    lines: [
      'You found a piece of equipment!',
      'Open the menu with Escape and go to Inventory to equip it.',
      'Better gear increases your stats and makes combat easier.',
    ],
  },
  tutorial_low_hp: {
    id: 'tutorial_low_hp',
    title: 'Low Health!',
    lines: [
      'One of your party members is running low on HP!',
      'Select Items from the combat menu to use a Potion and restore health.',
      'Keep an eye on your HP bars — if a character falls to 0, they are knocked out.',
    ],
  },
  tutorial_poisoned: {
    id: 'tutorial_poisoned',
    title: 'Status Effect: Poison',
    lines: [
      'A party member has been poisoned!',
      'Poison deals damage at the start of each turn until it wears off.',
      'Use Items from the combat menu and select an Antidote to cure it.',
    ],
  },
}
