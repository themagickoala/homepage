# Beast Quest RPG - Game Design Document

A top-down isometric fantasy RPG with 16-bit style art, based on the Beast Quest book series.

## Source Material Summary

Beast Quest follows heroes who become "Masters of the Beasts" defending the kingdom of Avantia from magical creatures. Key elements:
- **Setting**: Avantia and connected realms (Gorgonia, Gwildor)
- **Characters**: Tom (hero), Elenna (companion), Storm (horse), Silver (wolf)
- **Beasts**: Divided into Good (protectors), Evil (threats), and Neutral
- **Themes**: Quest-based adventures, magical artifacts, creature battles, moral choices

---

## Design Decisions

### Player Character
- [x] Play as Tom from the books?
- [ ] Create custom character?
- [ ] Decision: **Play as Tom** - faithful to source material with established backstory

### Core Gameplay Loop
- [ ] Decision: **TBD**

### Combat System
- [ ] Real-time action combat?
- [x] Turn-based combat?
- [ ] Hybrid system?
- [ ] Decision: **Turn-based** - strategic, menu-based combat like classic RPGs

### Beast Interaction
- [x] Fight and defeat Beasts only?
- [ ] Tame/collect Beasts (Pokemon-style)?
- [ ] Beasts as allies that join your party?
- [ ] Decision: **Fight only** - Beasts are enemies/bosses to defeat, straightforward combat focus

### World Structure
- [ ] Open world exploration?
- [ ] Level/mission-based?
- [x] Linear chapters
- [ ] Decision: **Linear chapters** - Story-driven progression through distinct areas in sequence

### Party System
- [ ] Solo adventure?
- [x] Elenna companion?
- [ ] Full party system?
- [ ] Decision: **Elenna companion** - Elenna joins as a permanent party member with her own abilities

### Progression System
- [ ] Level-based only?
- [ ] Equipment-focused only?
- [x] Both combined?
- [ ] Decision: **Both combined** - Level up for stats AND collect equipment for bonuses. Beast tokens (collected on shield) provide additional passive bonuses and activatable abilities.

### Multiplayer
- [x] Single-player only
- [ ] Local co-op?
- [ ] Decision: **Single-player** - Player controls both Tom and Elenna in combat (Final Fantasy party-based system)

### Art Style Details
- [ ] Final Fantasy VI style?
- [ ] Chrono Trigger style?
- [x] Tactics Ogre style?
- [ ] Secret of Mana style?
- [ ] Decision: **Tactics Ogre** - Darker tones, detailed terrain, grid-focused clarity for the isometric view

### Initial Scope
- [x] Demo/prototype?
- [ ] Short game (3-4 chapters)?
- [ ] Full first arc (6 chapters)?
- [ ] Decision: **Demo/prototype** - 1 chapter, 1 Beast boss (Ferno the Fire Dragon), core mechanics only

### Demo Chapter Content
- [x] Dungeon focus (initial)?
- [ ] Village + dungeon?
- [ ] Full chapter experience?
- [ ] Decision: **Dungeon focus initially** - Short dungeon crawl with regular enemies leading to Ferno boss fight. Village/overworld to be added later for full chapter experience.

### Combat Details
- [ ] Grid-based tactical?
- [x] Traditional turn-based?
- [ ] Decision: **Traditional turn-based** - Party on one side, enemies on other, select actions from menu

### Ability System
- [ ] Simple (Attack/Defend/Item)?
- [x] Skill trees?
- [ ] Equipment abilities?
- [ ] Decision: **Skill trees** - Each character (Tom & Elenna) has unique skills that unlock as they level up

### Encounter System
- [x] Random battles?
- [ ] Visible enemies?
- [ ] Set encounters?
- [ ] Decision: **Random battles** - Classic JRPG style, encounters trigger randomly while exploring

### Animal Companions (Storm & Silver)
- [ ] Not in demo?
- [ ] Story/visual only?
- [x] Combat summons + exploration aids?
- [ ] Decision: **Combat summons + exploration aids** - Storm for fast travel, Silver for tracking in exploration; both can be summoned in battle for special attacks

### Controls
- [x] Keyboard only?
- [ ] Mouse + keyboard?
- [ ] Decision: **Keyboard only** - Arrow keys to move, Enter/Space for actions, number keys for menus

### Resource System
- [x] HP + MP?
- [ ] HP + stamina?
- [ ] HP only (cooldowns)?
- [ ] Decision: **HP + MP** - Classic health points and mana points for skills

### Enemy Design (Demo)
- [ ] Fire-themed creatures?
- [ ] Generic fantasy?
- [x] Cave + fire theme?
- [ ] Decision: **Cave creatures with fire theme** - Ferno lives in a mountain cave, so cave-based enemies (bats, cave spiders, rock golems) with some fire-themed variants (flame bats, magma slimes)

### Save System
- [ ] Auto-save only?
- [x] Save anywhere (serialized)?
- [ ] Save points?
- [ ] Decision: **Serialized state string** - Web-based with no server storage. Game state serializes to a string that player can copy/paste to save. Can save anytime from menu and load by submitting the string.

### Shield Token System
*(Correction: In the first Beast Quest series, Tom collects tokens on his shield from defeated Beasts, not Golden Armour pieces)*

- [ ] Stat bonuses only?
- [ ] Special abilities only?
- [x] Both stats + abilities?
- [ ] Decision: **Both stats + abilities** - Each Beast token grants passive stat bonuses AND unlocks an activatable ability

**Demo reward**: Defeating Ferno grants the **Dragon Scale** token - provides fire resistance when activated

### Item System
- [ ] Basic consumables only?
- [x] Consumables + equipment?
- [ ] Minimal items?
- [ ] Decision: **Consumables + equipment** - Healing potions, mana potions, antidotes, plus upgradeable weapons/armor to find in the dungeon

### Puzzle System
- [ ] Combat only?
- [ ] Simple puzzles?
- [x] Environmental puzzles?
- [ ] Decision: **Environmental puzzles** - Use character abilities to solve puzzles (e.g., Elenna's bow to hit distant switches, Tom's strength to push blocks)

### Story/Dialogue
- [ ] Minimal text?
- [x] NPC dialogue?
- [ ] Full cutscenes?
- [ ] Decision: **NPC dialogue** - Some NPCs or story moments with character dialogue, not full cutscenes but enough to establish context

---

## Summary: Demo Scope

### What We're Building
A **turn-based isometric RPG demo** featuring:
- **Tom** as the playable hero with **Elenna** as a permanent party member
- A **dungeon crawl** through Ferno's mountain cave
- **Traditional turn-based combat** with skill trees for both characters
- **Random encounters** with cave creatures (bats, spiders, golems, fire variants)
- **Environmental puzzles** using character abilities
- **Boss fight** against **Ferno the Fire Dragon**
- **Reward**: Dragon Scale token (grants fire resistance ability)

### Art Style
- **Tactics Ogre-inspired** 16-bit isometric graphics
- Darker tones, detailed terrain, clear visual hierarchy

### Core Systems
| System | Design |
|--------|--------|
| Combat | Turn-based, party vs enemies, menu-based actions |
| Resources | HP + MP |
| Progression | Level-up for stats + equipment for bonuses + Beast tokens for abilities |
| Abilities | Skill trees per character |
| Encounters | Random battles while exploring |
| Companions | Storm (fast travel/summon) and Silver (tracking/summon) |
| Controls | Keyboard only (arrows, Enter/Space, number keys) |
| Save | Serialized state string (copy/paste, no server) |

### Future Expansion (Post-Demo)
- Village hub with NPCs and shops
- Overworld exploration
- Additional Beasts (Sepron, Arcta, etc.)
- More Golden Armour... *(correction: more Beast tokens)*
- Full chapter structure with story

---

## Technical Notes (For Implementation)

### Suggested File Structure
```
src/beast-quest/
├── Game.tsx              # Main game component
├── types.ts              # All TypeScript interfaces
├── gameState.ts          # State management, save/load serialization
├── combat/
│   ├── CombatSystem.tsx  # Turn-based battle component
│   ├── actions.ts        # Attack, skill, item logic
│   └── enemies.ts        # Enemy definitions and AI
├── exploration/
│   ├── Dungeon.tsx       # Dungeon exploration component
│   ├── tiles.ts          # Tile/map definitions
│   └── puzzles.ts        # Puzzle logic
├── characters/
│   ├── tom.ts            # Tom's stats, skills, progression
│   ├── elenna.ts         # Elenna's stats, skills, progression
│   └── companions.ts     # Storm and Silver
├── render/
│   ├── sprites.ts        # Sprite rendering utilities
│   ├── isometric.ts      # Isometric projection math
│   └── ui.ts             # Menu and HUD rendering
├── data/
│   ├── skills.ts         # Skill tree definitions
│   ├── items.ts          # Item database
│   └── ferno-dungeon.ts  # Demo dungeon map data
└── components/
    ├── BattleUI.tsx      # Combat menu overlay
    ├── InventoryUI.tsx   # Item/equipment screen
    └── DialogueUI.tsx    # NPC dialogue display
```

### Key Technical Decisions
- **Canvas-based rendering** (consistent with other games in arcade)
- **React overlays** for menus and UI
- **State serialization** using JSON.stringify/parse with base64 encoding for save codes
- **Isometric math**: Standard 2:1 ratio projection

### Asset Decisions
- **Sprites**: Custom pixel art (16-bit style, Tactics Ogre-inspired)
- **Audio**: Sound effects only for demo (battle sounds, menu clicks, footsteps) - no background music initially

### Remaining Questions
- [ ] Screen resolution/canvas size?
- [ ] Animation approach? (sprite sheets, frame-by-frame?)
- [ ] Specific skill designs for Tom and Elenna?
- [ ] Detailed enemy stats and abilities?
