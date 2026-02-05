# Tutorial Overlay System

## Overview

Add a reusable tutorial overlay that appears once per trigger point when the player first encounters each game area. Tutorials are tracked via the existing `flags` system (persisted in saves). All trigger logic lives in `Game.tsx` — no changes to child components.

## New Files (3)

### 1. `src/beast-quest/data/tutorials.ts` — Tutorial content definitions

A `TUTORIALS` record keyed by flag name. Each entry has `id`, `title`, and `lines: string[]`.

Tutorials defined:
| ID | Trigger | Content |
|---|---|---|
| `tutorial_game_start` | New game started | Game aim, movement, interaction, menu controls |
| `tutorial_menu` | First time phase → `menu` | Menu navigation, what each option does |
| `tutorial_inventory` | First time phase → `inventory` | Tab switching, using items, equipping gear |
| `tutorial_skill_tree` | First time phase → `skill_tree` | Character switching, skill status icons, learning |
| `tutorial_combat` | First time phase → `combat` | Turn order, action menu (Attack/Skills/Items/Defend/Flee) |
| `tutorial_level_up` | First level up after combat victory | Suggest opening Skills menu |
| `tutorial_equipment_pickup` | First equipment-type item found in chest | Suggest opening Inventory to equip |
| `tutorial_low_hp` | Party member drops below 30% HP in combat | Suggest using Items → Potion to heal |
| `tutorial_poisoned` | Party member receives poison/burn status in combat | Explain DoT and suggest using Items → Antidote |

### 2. `src/beast-quest/components/TutorialOverlay.tsx` — Reusable overlay component

Props: `{ tutorial: TutorialDef, onDismiss: () => void }`

- Full-screen dark overlay at `z-index: 1100` (above notifications at 1000 and menus at 100)
- Centred panel with gold title, content lines, and "Press Enter to continue" footer
- Dismisses on `Enter`, `Space`, `Escape` keypress, or clicking the backdrop
- **Input blocking**: Attaches `keydown` listener with `{ capture: true }` and calls `stopImmediatePropagation()` on all keys. This prevents underlying components (Dungeon, CombatSystem, GameMenu — which all listen on `window`) from receiving input while the tutorial is visible. No changes needed to those components.

### 3. `src/beast-quest/components/TutorialOverlay.css` — Styling

Matches existing patterns from `GameMenu.css` and `Notifications.css`:
- Overlay: `position: fixed`, `background: rgba(0,0,0,0.85)`, flex centering
- Panel: `background: rgba(20,20,40,0.98)`, `border: 2px solid #4a4a6a`, `border-radius: 8px`
- Title: `color: #FFD700` (gold), monospace, `text-shadow` glow
- Lines: `color: #ccccdd`, monospace 14px
- Footer: `color: #666688`, monospace 12px, top border separator
- Animations: `fadeIn` + `slideIn` at 0.3s ease-out (same keyframe pattern as notifications)

## Modified Files (2)

### `src/beast-quest/combat/CombatSystem.tsx`

Add an optional callback prop for mid-combat tutorial triggers:

```ts
interface CombatSystemProps {
  // ... existing props ...
  onTutorialTrigger?: (tutorialId: string) => void  // NEW
}
```

**Low HP detection** — In the enemy AI `useEffect` (line 354), after the enemy executes an attack or skill (lines 385-391) and the result state is available, check if any player entity in the result state has `currentHp / maxHp < 0.3`. If so, call `onTutorialTrigger('tutorial_low_hp')`.

**Poison detection** — In the same location, after skill execution (line 385), check if any player entity in the result state has a `statusEffects` entry with `type === 'poison' || type === 'burn'`. If so, call `onTutorialTrigger('tutorial_poisoned')`.

Both checks use the result state (from `executeAttack`/`executeSkill`) directly, not the async React state, so the values are immediately available. The callback fires before the `setTimeout(() => nextTurn())` on line 405, so the tutorial overlay will appear and block input before the next turn starts.

### `src/beast-quest/Game.tsx`

**Imports** — Add `hasFlag` to the `gameState` import, plus `TutorialOverlay` and `TUTORIALS`.

**State** — Add: `const [pendingTutorial, setPendingTutorial] = useState<string | null>(null)`

**Dismiss handler**:
```ts
const dismissTutorial = useCallback(() => {
  if (!pendingTutorial) return
  setGameState(prev => prev ? setFlag(prev, pendingTutorial) : prev)
  setPendingTutorial(null)
}, [pendingTutorial])
```

**Trigger points** (6 locations in Game.tsx):

1. **`handleNewGame`** (line 58) — After `setGameState(createNewGameState())`, add `setPendingTutorial('tutorial_game_start')`. No flag check needed since new games start with empty flags.

2. **`openMenu`** (line 296) — Check `!hasFlag(prev, 'tutorial_menu')` inside the updater, then `setTimeout(() => setPendingTutorial('tutorial_menu'), 0)`.

3. **`openInventory`** (line 304) — Same pattern as menu, checks `tutorial_inventory`.

4. **`openSkillTree`** (line 312) — Same pattern, checks `tutorial_skill_tree`.

5. **`handleEncounter`** (line 133) — Inside the `setGameState` updater after setting phase to `combat`, check `tutorial_combat`. Also in `handleInteract` boss encounter path (line 206) — same check.

6. **`handleVictory`** (line 214) — Capture party levels before calling `addExperience`, compare after. If any level increased and `tutorial_level_up` flag not set, trigger tutorial.

7. **`handleInteract` chest case** (line 156) — After building the `items` array, check if any have `type` in `['weapon', 'armor', 'accessory']`. If so and `tutorial_equipment_pickup` flag not set, trigger tutorial.

8. **CombatSystem `onTutorialTrigger` callback** — Pass a callback to `CombatSystem` that checks the flag and sets `pendingTutorial`:
```tsx
<CombatSystem
  ...existing props...
  onTutorialTrigger={(id) => {
    if (gameState && !hasFlag(gameState, id) && !pendingTutorial) {
      setPendingTutorial(id)
    }
  }}
/>
```
The tutorial overlay renders above the canvas at z-index 1100 and blocks all keyboard input via the capture-phase handler, pausing combat until dismissed.

**Render** — Add `TutorialOverlay` inside the main `<div className="beast-quest-game">`, right after `Notifications`:
```tsx
{pendingTutorial && TUTORIALS[pendingTutorial] && (
  <TutorialOverlay tutorial={TUTORIALS[pendingTutorial]} onDismiss={dismissTutorial} />
)}
```

## Why `setTimeout(..., 0)` is needed

React doesn't allow calling `setPendingTutorial` from inside a `setGameState` updater. The `setTimeout` defers it to the next microtask. This is only needed for triggers inside `setGameState` updaters (menu, inventory, skill tree, combat, victory, chest). The game start trigger calls `setPendingTutorial` directly since it's outside the updater.

## Suggestions for Additional Tutorial Steps

These are **not** being implemented but would be good candidates for future tutorials:

- **First puzzle encounter** — When the player enters the Puzzle Chamber, explain the switch mechanic and that environmental puzzles require interacting with objects
- **First healing pool** — When the player first steps on/interacts with a healing pool, explain that these restore HP/MP fully
- **First boss encounter** — When approaching Ferno, warn that boss fights cannot be fled and suggest healing up beforehand
- **Defend action in combat** — After the player takes heavy damage for the first time, suggest using Defend to reduce incoming damage
- **Room transition** — First time the player walks through a door, explain that dungeons have multiple connected rooms to explore
- **Companion summons** — When Storm/Silver summon abilities are implemented, explain the companion system on first use

## Verification

1. Start a **New Game** → game start tutorial should appear immediately over the dungeon
2. Dismiss with Enter → should be explorable, tutorial should not reappear
3. Press Escape → menu tutorial should appear over the menu
4. Dismiss, select Inventory → inventory tutorial should appear
5. Close inventory, go back to menu, select Skills → skill tree tutorial should appear
6. Close skills, resume exploring, trigger a random encounter → combat tutorial should appear at battle start
7. Win the battle with enough EXP to level up → level-up tutorial should appear on return to exploration
8. Find the volcanic passage chest (contains `fire_amulet` accessory) → equipment tutorial should appear
9. Take damage from an enemy until a party member drops below 30% HP → low HP tutorial should appear mid-combat, pausing combat
10. Fight a Cave Spider and get poisoned → poison tutorial should appear mid-combat
11. **Save the game**, reload → none of the tutorials should reappear
12. Start a fresh **New Game** → all tutorials reset (new flags)
