# Beast Quest RPG

A turn-based isometric RPG demo built with React, TypeScript, and the Canvas API. Based on the Beast Quest book series, it features a single-chapter dungeon crawl through Ferno's volcanic cave. No external game engine is used; all rendering is custom.

See [PLANNING.md](PLANNING.md) for the original design decisions and rationale.

---

## Tech Stack

- **React** for UI overlays (menus, inventory, skill tree, dialogue)
- **Canvas 2D** for real-time game rendering (dungeon, combat, sprites)
- **TypeScript** with comprehensive type definitions in [types.ts](types.ts)
- **No game engine** -- all rendering, collision, and game logic is hand-rolled

---

## Architecture

### Hybrid React + Canvas Pattern

React manages UI state and overlay components. Canvas handles the real-time game world (isometric dungeon, combat scenes, procedural sprites). The main orchestrator is [Game.tsx](Game.tsx), which owns the `GameState` and delegates to the appropriate renderer/component based on the current `GamePhase`.

### State Management

All game state lives in a single `GameState` object defined in [gameState.ts](gameState.ts). State is treated immutably -- all update functions return new objects. This enables the serialisation-based save system (JSON to base64 string, copy/paste).

Key state functions: `createNewGameState()`, `serializeGameState()`, `deserializeGameState()`, `addExperience()`, `equipItem()`, `learnSkill()`, `changeRoom()`, `openChest()`, `restoreParty()`.

### Game Phases

The game transitions between phases via the `GamePhase` enum:

```
title -> exploring -> combat -> dialogue -> menu -> inventory -> skill_tree -> game_over -> victory
```

[Game.tsx](Game.tsx) renders the appropriate component for the current phase.

---

## File Structure

```
src/beast-quest/
├── Game.tsx                 # Main orchestrator, phase routing, state owner
├── Game.css                 # Game styling
├── types.ts                 # All TypeScript interfaces and types
├── gameState.ts             # State management, save/load, all state mutations
├── PLANNING.md              # Original design document
│
├── combat/
│   ├── CombatSystem.tsx     # Turn-based battle renderer and input handling
│   ├── actions.ts           # Damage calc, skill execution, item use, defend/flee
│   └── enemies.ts           # Enemy stats, AI patterns, encounter definitions
│
├── exploration/
│   ├── Dungeon.tsx          # Isometric dungeon renderer, movement, interaction
│   ├── tiles.ts             # Tile type definitions and colour palettes
│   └── puzzles.ts           # Environmental puzzle logic (switches, bridges)
│
├── characters/
│   ├── tom.ts               # Tom's base stats, level-up bonuses, skill tree
│   ├── elenna.ts            # Elenna's base stats, level-up bonuses, skill tree
│   └── companions.ts        # Storm (horse) and Silver (wolf) definitions
│
├── data/
│   ├── items.ts             # Full item database (consumables, weapons, armour, accessories)
│   ├── shield-tokens.ts     # Beast token definitions and abilities
│   └── ferno-dungeon.ts     # Dungeon map data (5 rooms, entities, encounters)
│
├── render/
│   ├── isometric.ts         # 2:1 isometric projection, coordinate conversion, depth sort
│   ├── sprites.ts           # Procedural sprite drawing (all characters and enemies)
│   └── ui.ts                # HUD, bars, panels, text rendering utilities
│
└── components/
    ├── SkillTree.tsx         # Skill tree navigation and learning UI
    ├── GameMenu.tsx          # Pause menu, save/load, status view
    ├── InventoryUI.tsx       # Item management and equipment
    ├── DialogueUI.tsx        # NPC conversation display
    ├── Notifications.tsx     # Toast notification system
    └── *.css                 # Component styles
```

---

## Core Systems

### Combat ([combat/](combat/))

Turn-based, party-vs-enemies, menu-driven. Speed stat determines turn order. Player controls both Tom and Elenna.

**Actions**: Attack (physical damage formula: `attacker.attack * power - defender.defense * 0.5`, +/-10% variance, min 1), Skills (MP cost, typed effects), Items (consumables), Defend (+50% defense for one turn), Flee (50% chance, blocked in boss fights).

**Enemy AI** ([enemies.ts](combat/enemies.ts)): Pattern-based -- `aggressive`, `defensive`, `balanced`, `support`, `boss_ferno`. ~30% chance to use special skills per turn.

**Status effects**: Poison/burn (DoT), stat buffs/debuffs (duration-based), HoT, stun.

### Exploration ([exploration/](exploration/))

Arrow keys / WASD movement on an isometric grid. Rooms are interconnected via doors. Features: chests (one-time loot), switches (puzzle elements), healing pools (restore HP/MP), NPCs, random encounters.

**Random encounters** trigger per-step with a probability check (8-10% per step depending on room). Encounter tables are defined per-room in [ferno-dungeon.ts](data/ferno-dungeon.ts). MP regenerates passively (+1 per 3 steps).

### Dungeon Layout (5 rooms)

1. **Entrance** -- Starting area, hermit NPC, small pool
2. **Main Cavern** -- Central hub, 2 chests, multiple exits
3. **Puzzle Chamber** -- 2-switch puzzle to create a bridge across water
4. **Volcanic Passage** -- Fire-themed enemies, late-game difficulty
5. **Ferno's Lair** -- Boss arena, cannot flee

### Characters ([characters/](characters/))

| Character | Role    | Strengths               | Base HP/MP  |
|-----------|---------|-------------------------|-------------|
| Tom       | Warrior | High HP/DEF, physical   | 50 HP, 20 MP |
| Elenna    | Ranger  | High SPD/MP, ranged     | 40 HP, 30 MP |

Each has 8 skills in a linear tree (level-gated, prerequisite-chained). Tom's tree emphasises physical power and party defence. Elenna's focuses on ranged attacks and support healing.

### Items ([data/items.ts](data/items.ts))

**Consumables**: Potions, Ethers, Antidotes, Phoenix Feather (revive). **Equipment**: Weapons (+ATK), Armour (+DEF/HP, may affect SPD), Accessories (various bonuses). Each character can equip one weapon, one armour, one accessory.

### Shield Tokens ([data/shield-tokens.ts](data/shield-tokens.ts))

Defeating a Beast boss grants a token for Tom's shield. Each token provides passive stat bonuses and an activatable combat ability (free, once per battle). Only the Dragon Scale (from Ferno) is in the demo.

### Skill Trees ([characters/tom.ts](characters/tom.ts), [characters/elenna.ts](characters/elenna.ts))

Skills unlock at specific levels and have prerequisite chains. No skill point cost -- meeting requirements is enough. Skills have types (attack, magic, support, passive), target modes (single/all enemy/ally/self), elements (physical, fire, ice, lightning, holy, dark), and MP costs.

### Puzzles ([exploration/puzzles.ts](exploration/puzzles.ts))

The demo has one implemented puzzle type: switch puzzles (activate all switches to unlock a path). The puzzle chamber requires activating 2 switches to bridge a water gap. Block-pushing, shooting targets, and strength doors are defined but not implemented.

---

## Rendering

### Isometric Projection ([render/isometric.ts](render/isometric.ts))

Standard 2:1 ratio. Tile size: 64x32px. Origin at canvas centre (400, 100).

```
Screen X = origin.x + (col - row) * 32
Screen Y = origin.y + (col + row) * 16
```

Depth sorting: entities rendered back-to-front by `(row + col)` sum. Walls rendered with 3D cube effect (top/left/right faces with different shading).

### Sprites ([render/sprites.ts](render/sprites.ts))

All sprites are procedurally drawn with Canvas shapes -- no image assets. Characters have directional facing, walking animation (leg alternation + bounce), and equipment indicators. Enemy sprites have idle animations (wing flapping, leg movement, wobble, flame flicker).

### Canvas Dimensions

800x600 pixels. All fonts are monospace. Colour scheme: dark blue panels, green HP bars, blue MP bars, white/purple text.

---

## Controls

| Key              | Action                        |
|------------------|-------------------------------|
| Arrow keys / WASD| Move (exploration)            |
| Enter / Space    | Interact / Confirm            |
| Escape           | Open menu / Back              |
| I                | Open inventory                |
| K                | Open skill tree               |

---

## Save System

JSON state serialised to base64. Players copy/paste save codes via the pause menu. No server storage. Includes a version field for future migration support.

---

## Enemy Roster (Demo)

| Enemy          | Level | HP  | ATK | Notes                        | EXP |
|----------------|-------|-----|-----|------------------------------|-----|
| Cave Bat       | 1     | 15  | 6   | Weak, common                 | 8   |
| Cave Spider    | 2     | 20  | 8   | Poison bite                  | 12  |
| Rock Golem     | 3     | 40  | 10  | High DEF, tanky              | 25  |
| Flame Bat      | 3     | 18  | 8   | Fire-themed bat              | 15  |
| Magma Slime    | 3     | 25  | 7   | Fire resist                  | 18  |
| Fire Elemental | 5     | 60  | 14  | Elite, fire resist           | 50  |
| **Ferno**      | 5     | 150 | 16  | Boss, 4 skills, cannot flee  | 300 |

---

## Difficulty Progression

Early rooms: bats and spiders. Mid rooms: golems and mixed groups. Late rooms: fire-themed enemies and the Fire Elemental elite. Boss: Ferno with 150 HP and multi-target attacks. Players typically reach level 5-8 by the boss fight.

---

## Known Limitations / Not Yet Implemented

- Sound effects and music (none)
- Block-pushing, shooting target, and strength door puzzles (defined but unused)
- Storm and Silver companion summon abilities in combat
- Village hub, shops, overworld
- Additional Beast chapters beyond Ferno
- Pixel art sprites (currently procedural shapes)
- Mouse/touch input (keyboard only)
