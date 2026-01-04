# Pixel Realm: Echoes of the Glitch — Character Style Guide

This document defines the **game-wide character art direction** and the pixel-art production standards for **Player, NPCs, Enemies, and Bosses**.

> In this codebase, character art is generated procedurally at runtime (no external sprite assets). The canonical implementation lives in `src/utils/CharacterDesignSystem.js`.

---

## 1) Color Palette (Game-Wide)

| Use | Color | Hex |
|---|---:|---|
| Primary (glitch / UI highlight) | Cyan | `#00ffff` |
| Secondary (dark backgrounds / void) | Deep Purple | `#1a0033` |
| Accent (danger highlight / glitch flare) | Hot Pink | `#ff00ff` |
| Neutral (buildings / terrain / metal) | Gray | `#808080` |
| Health / Life | Green | `#00ff00` |
| Corruption / Damage | Red | `#ff0000` |
| Outline (character readability) | Near-Black Purple | `#0a0014` |

### Palette rules
- **Outlines are mandatory** (1px on the 16×16 base grid).
- Keep each character to roughly **≤16 “active” colors** (including outline + shades).
- Use **Cyan/Hot Pink sparingly** as VFX accents (glitch energy, weak spots, elite markings).

---

## 2) Pixel Art Standards

### Base resolution
- **Characters:** 16×16 base grid (drawn at runtime and scaled 2× to 32×32 on-screen).
- **Bosses:** larger base grids (32×32 and up), scaled consistently.

### Sprite sheet conventions
**Player/NPC (4-direction):**
- **Directions:** up, down, left, right
- **Animations:**
  - Idle: 2 frames
  - Walk: 4 frames
  - Attack: 2–3 frames (player uses 3)
  - Hurt: 1 frame
  - Death: 3–6 frames (player uses 4)

**Enemy/Boss (non-directional in current implementation):**
- Idle: 2 frames
- Walk: 4 frames
- Attack: 3 frames
- Hit: 1 frame
- Death: 4 frames
- Boss Special: 2 frames

### Linework + readability
- 1px outline using `#0a0014`.
- Silhouette first, detail second.
- Strong value contrast between body + accents.
- Avoid noisy dithering; prefer clean clusters.

---

## 3) Silhouette Language

### Humans (Player + NPCs)
- **Round head**, readable torso/legs block.
- Distinct “accessory shapes” to create role readability:
  - Elder: staff + beard
  - Merchant: pouch/pack
  - Healer: potion
  - Guard: armor plate + sword

### Enemies
- Exaggerated shapes and asymmetry.
- Use **angular pixels** and **glitch edges** for corruption.
- Make enemy silhouettes distinct from NPC silhouettes at a glance.

### Bosses
- Big, heavy silhouettes.
- Large “core” or weak-point cluster using cyan/pink.
- Phase changes can be communicated via **tint shifts** (already implemented) and/or palette swaps.

---

## 4) Implementation Mapping (Repo)

### Runtime sprite generation
- `src/utils/CharacterDesignSystem.js`
  - Defines palette + spec
  - Generates:
    - `player` sprite sheet
    - `npc_<id>` sprite sheets
    - `enemy_*` sprite sheets (10+)
    - `boss_<bossKey>` sprite sheets

### Scene integration
- `src/scenes/Preload.js`
  - Calls `createAllCharacterSpriteSheets(this)` before starting the game.

### Entity integration
- `src/entities/Player.js`
  - Directional idle/walk/attack animations.
- `src/entities/NPC.js`
  - Uses `npc_<id>` sheets and plays `npc_<id>-idle-down`.
- `src/entities/Enemy.js`
  - Uses a 14-frame sheet layout (idle/walk/attack/hit/death).
- `src/entities/Boss.js`
  - Uses a 16-frame sheet layout (idle/walk/attack/hit/death/special).

---

## 5) Export / Asset Pipeline Notes

If/when this project transitions from procedural generation to authored pixel art:
1. Keep the same **frame indices and sheet layouts** documented above.
2. Export at **16×16** (characters) and **32×32+** (bosses).
3. Scale 2× at runtime (no smoothing).
4. Maintain the palette rules and silhouette language.
