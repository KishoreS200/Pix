# Pixel Realm — Character Reference Sheets

These reference sheets describe the **intended look**, **palette**, **silhouette cues**, and **animation requirements** for each major character family.

> In this repo, the “sprite-ready” output is implemented procedurally in `src/utils/CharacterDesignSystem.js`.

---

## A) Player Character — KIRO / “The Wanderer”

**Sprite Key:** `player`

**Base Size:** 16×16 (rendered 2× → 32×32)

**Design Summary:**
- Adventurer outfit: jacket + pants + boots
- Visible weapon (sword) + backpack
- Cyan “glitch” accents on edges (subtle)
- Neutral/ambiguous gender presentation

**Palette (core):**
- Outline: `#0a0014`
- Skin: `#ffcc99`
- Outfit: `#1a2a4a`
- Outfit shadow: `#0c101a`
- Weapon highlight: `#c0c0ff`
- Accents: `#00ffff`

**Animation Spec (implemented):**
- Idle: 2 frames × 4 directions
- Walk: 4 frames × 4 directions
- Attack: 3 frames × 4 directions
- Hurt: 1 frame
- Death: 4 frames

**Frame Layout (implemented):**
- Idle: down `0–1`, up `2–3`, left `4–5`, right `6–7`
- Walk: down `8–11`, up `12–15`, left `16–19`, right `20–23`
- Attack: down `24–26`, up `27–29`, left `30–32`, right `33–35`
- Hit: `36`
- Death: `37–40`

---

## B) NPCs (Silent Village + Regional NPCs)

**General rules:**
- Human silhouettes = friendly readability (round head + simple torso)
- Role readability comes from **one strong accessory**

### 1) Elder
**Sprite Key:** `npc_elder`
- Robes: deep purple (`#1a0033`), cyan trim
- White/gray hair + beard
- Staff with cyan crystal

### 2) Merchant
**Sprite Key:** `npc_merchant`
- Coat: warm red/brown, gold trim (`#daa520`)
- Coin pouch + pack
- Pink accent highlights

### 3) Healer
**Sprite Key:** `npc_healer`
- White/green robe, green accent
- Potion bottle silhouette

### 4) Guard
**Sprite Key:** `npc_guard`
- Steel/gray armor plates
- Sword at side
- Cyan “scan” accent on chest plate

### 5) Villager (Farmer)
**Sprite Key:** `npc_villager_farmer`
- Straw hat silhouette
- Green/brown clothing

### 6) Villager (Child)
**Sprite Key:** `npc_villager_child`
- Smaller proportions
- Bright hair highlight

**NPC Animations (implemented):**
- Idle: 2 frames × 4 directions
- Walk: 4 frames × 4 directions

**NPC Frame Layout (implemented per `npc_<id>`):**
- Idle: down `0–1`, up `2–3`, left `4–5`, right `6–7`
- Walk: down `8–11`, up `12–15`, left `16–19`, right `20–23`

---

## C) Enemies (10+ Designed)

**General rules:**
- Enemies use stronger angles + corruption marks.
- Glitch enemies: cyan/pink flicker clusters.
- Corruption enemies: red streaks.

### Silent Village Periphery (Weak)
1) **Glitch Sprite** — `enemy_glitch_sprite`
- Small jittering entity, clustered pixels
- Dark base with cyan/pink flicker

2) **Corrupted Rat** — `enemy_corrupted_rat`
- Low-to-ground silhouette, red corruption streaks
- Fast scurry motion

### Forgotten Forest (Medium)
3) **Thorned Beast** — `enemy_thorned_beast`
- Quadruped-like block silhouette with red thorns

4) **Forest Wraith** — `enemy_forest_wraith`
- Ghost silhouette (alpha) with cyan energy eyes

### Crystal Mines (Medium–Hard)
5) **Crystal Golem** — `enemy_crystal_golem`
- Blocky stone silhouette + cyan crystal core

6) **Mining Glitch** — `enemy_mining_glitch`
- Humanoid with pickaxe + orange hazard palette

### Broken City (Hard)
7) **Corrupted Sentinel** — `enemy_corrupted_sentinel`
- Boxy robot silhouette + pink corruption

8) **Urban Ghoul** — `enemy_urban_ghoul`
- Warped humanoid silhouette + red mouth corruption

### The Core (Very Hard)
9) **Void Entity** — `enemy_void_entity`
- Deep purple/black body + cyan rifts

10) **Corrupted Guardian** — `enemy_corrupted_guardian`
- High-contrast red/cyan crystal horns + core

**Enemy Sprite Sheet Layout (implemented; 14 frames):**
- Idle: `0–1`
- Walk: `2–5`
- Attack: `6–8`
- Hit: `9`
- Death: `10–13`

---

## D) Bosses (Regional)

Boss sprite sheets are generated per boss config key.

### 1) Glitch Entity
**Sprite Key:** `boss_glitch_entity`
- Gray base with cyan/pink glitch overlay
- Humanoid-ish geometry

### 2) Corrupted Nature Spirit
**Sprite Key:** `boss_corrupted_nature_spirit`
- Green/brown body with red corruption tendrils
- Vine silhouettes

### 3) Crystalline Sentinel
**Sprite Key:** `boss_crystalline_sentinel`
- Cyan/white crystal shards + purple energy

### 4) Industrial Titan
**Sprite Key:** `boss_industrial_titan`
- Steel plates, large shoulders, hot pink vents

### 5) The Void Entity (Final)
**Sprite Key:** `boss_void_entity`
- Deep purple void body with cyan rifts

**Boss Sprite Sheet Layout (implemented; 16 frames):**
- Idle: `0–1`
- Walk: `2–5`
- Attack: `6–8`
- Hit: `9`
- Death: `10–13`
- Special: `14–15`

---

## E) NPC Dialogue Framework (Design Requirement)

Each NPC dialogue set should support:
- Greeting
- Quest introduction
- Quest reminder
- Quest completion
- Idle chat (flavor)
- Reaction to player status (level, health, corruption)

In this repo, dialogue content is configured in `src/utils/DialogueConfig.js`.

---

## F) Enemy “Personality” Targets

- **Glitch enemies:** erratic / jittery / inconsistent movement
- **Nature enemies:** territorial / methodical
- **Crystal enemies:** defensive / slow / heavy hits
- **Corrupted enemies:** aggressive / unstable
- **Void enemies:** alien / warping / unpredictable
