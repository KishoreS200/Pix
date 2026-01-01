// Boss configurations for each region
// Each boss has unique properties, phases, attacks, and loot tables

import { Regions } from './RegionConfig';

// Phase thresholds (percentage of health)
export const PhaseThresholds = {
    PHASE_1: 100,   // 100%-66%
    PHASE_2: 66,    // 66%-33%
    PHASE_3: 33     // 33%-0%
};

// Boss elements for visual effects and resistances
export const BossElements = {
    GLITCH: 'glitch',
    NATURE: 'nature',
    CRYSTAL: 'crystal',
    INDUSTRIAL: 'industrial',
    VOID: 'void'
};

// Attack types for boss attacks
export const AttackTypes = {
    MELEE_SWING: 'melee_swing',
    MELEE_LUNGE: 'melee_lunge',
    RANGED_PROJECTILE: 'ranged_projectile',
    RANGED_BLAST: 'ranged_blast',
    AREA_SLAM: 'area_slam',
    AREA_SHOCKWAVE: 'area_shockwave',
    SPECIAL_TELEPORT: 'special_teleport',
    SPECIAL_CHARGE: 'special_charge',
    SPECIAL_SUMMON: 'special_summon'
};

// Boss XP rewards (base values, scale with player level)
export const BaseBossXP = 500;

// Loot rarity weights for boss drops
const BossLootWeights = {
    LEGENDARY: 5,   // 5% chance
    EPIC: 15,       // 15% chance
    RARE: 30,       // 30% chance
    UNCOMMON: 50    // 50% chance
};

export const BossConfig = {
    // Region 1 Boss: Silent Village
    'glitch_entity': {
        name: 'Glitch Entity',
        description: 'A corrupted guard twisted by the glitch phenomenon',
        element: BossElements.GLITCH,
        
        // Health scales with player level (base * levelMultiplier)
        baseHealth: 500,
        healthPerLevel: 100,
        
        // Damage settings
        baseDamage: 25,
        damagePerLevel: 5,
        
        // Combat properties
        speed: 80,
        attackRange: 120,
        attackSpeed: 1500,  // ms between attacks
        knockbackPower: 300,
        
        // Phase thresholds (percentages)
        phaseThresholds: [100, 66, 33],
        
        // XP reward
        baseXP: BaseBossXP,
        xpPerLevel: 100,
        
        // Arena position (end of region)
        arenaPosition: { x: 1300, y: 900 },
        
        // Phases configuration
        phases: {
            1: {
                name: 'Normal',
                color: 0x00ff00,
                attackSpeedMultiplier: 1.0,
                damageMultiplier: 1.0,
                speedMultiplier: 1.0,
                attacks: [
                    { type: AttackTypes.MELEE_SWING, weight: 60, cooldown: 2000 },
                    { type: AttackTypes.RANGED_PROJECTILE, weight: 40, cooldown: 3000 }
                ],
                behaviors: ['chase', 'basic_attack']
            },
            2: {
                name: 'Aggressive',
                color: 0xffff00,
                attackSpeedMultiplier: 1.3,
                damageMultiplier: 1.2,
                speedMultiplier: 1.2,
                attacks: [
                    { type: AttackTypes.MELEE_SWING, weight: 40, cooldown: 1500 },
                    { type: AttackTypes.MELEE_LUNGE, weight: 30, cooldown: 2500 },
                    { type: AttackTypes.RANGED_PROJECTILE, weight: 30, cooldown: 2000 }
                ],
                behaviors: ['chase', 'lunge_attack', 'ranged_attack']
            },
            3: {
                name: 'Enraged',
                color: 0xff0000,
                attackSpeedMultiplier: 1.5,
                damageMultiplier: 1.5,
                speedMultiplier: 1.4,
                attacks: [
                    { type: AttackTypes.MELEE_LUNGE, weight: 35, cooldown: 2000 },
                    { type: AttackTypes.AREA_SLAM, weight: 35, cooldown: 4000 },
                    { type: AttackTypes.SPECIAL_TELEPORT, weight: 30, cooldown: 5000 }
                ],
                behaviors: ['enraged', 'slam_attack', 'teleport']
            }
        },
        
        // Loot table
        lootTable: {
            coins: { min: 100, max: 200 },
            items: [
                { type: 'potion', rarity: 'uncommon', weight: 40, value: 30 },
                { type: 'powerup', rarity: 'rare', weight: 30, value: 50 },
                { type: 'artifact', rarity: 'epic', weight: 20, value: 100 },
                { type: 'glitch_core', rarity: 'legendary', weight: 10, value: 200 }
            ]
        },
        
        // Visual settings
        size: { width: 64, height: 64 },
        tint: 0x8800ff
    },
    
    // Region 2 Boss: Forgotten Forest
    'corrupted_nature_spirit': {
        name: 'Corrupted Nature Spirit',
        description: 'An ancient spirit corrupted by the glitch contamination',
        element: BossElements.NATURE,
        
        baseHealth: 750,
        healthPerLevel: 150,
        
        baseDamage: 30,
        damagePerLevel: 8,
        
        speed: 100,
        attackRange: 150,
        attackSpeed: 1800,
        knockbackPower: 250,
        
        phaseThresholds: [100, 66, 33],
        
        baseXP: BaseBossXP * 1.5,
        xpPerLevel: 150,
        
        arenaPosition: { x: 1800, y: 1400 },
        
        phases: {
            1: {
                name: 'Nature',
                color: 0x00aa00,
                attackSpeedMultiplier: 1.0,
                damageMultiplier: 1.0,
                speedMultiplier: 1.0,
                attacks: [
                    { type: AttackTypes.RANGED_BLAST, weight: 50, cooldown: 2500 },
                    { type: AttackTypes.AREA_SHOCKWAVE, weight: 50, cooldown: 4000 }
                ],
                behaviors: ['phase_attack', 'shockwave']
            },
            2: {
                name: 'Corrupted',
                color: 0xffaa00,
                attackSpeedMultiplier: 1.2,
                damageMultiplier: 1.3,
                speedMultiplier: 1.1,
                attacks: [
                    { type: AttackTypes.RANGED_BLAST, weight: 35, cooldown: 2000 },
                    { type: AttackTypes.AREA_SHOCKWAVE, weight: 35, cooldown: 3000 },
                    { type: AttackTypes.SPECIAL_SUMMON, weight: 30, cooldown: 6000 }
                ],
                behaviors: ['corrupted', 'summon_minions', 'shockwave']
            },
            3: {
                name: 'Overgrown',
                color: 0xff0000,
                attackSpeedMultiplier: 1.6,
                damageMultiplier: 1.6,
                speedMultiplier: 1.3,
                attacks: [
                    { type: AttackTypes.AREA_SLAM, weight: 40, cooldown: 3000 },
                    { type: AttackTypes.SPECIAL_SUMMON, weight: 35, cooldown: 4000 },
                    { type: AttackTypes.SPECIAL_CHARGE, weight: 25, cooldown: 5000 }
                ],
                behaviors: ['enraged', 'mass_summon', 'charge']
            }
        },
        
        lootTable: {
            coins: { min: 150, max: 300 },
            items: [
                { type: 'potion', rarity: 'uncommon', weight: 35, value: 40 },
                { type: 'powerup', rarity: 'rare', weight: 30, value: 60 },
                { type: 'nature_essence', rarity: 'epic', weight: 25, value: 150 },
                { type: 'spirit_seed', rarity: 'legendary', weight: 10, value: 300 }
            ]
        },
        
        size: { width: 80, height: 80 },
        tint: 0x00ff88
    },
    
    // Region 3 Boss: Crystal Mines
    'crystalline_sentinel': {
        name: 'Crystalline Sentinel',
        description: 'A massive golem forged from living crystal',
        element: BossElements.CRYSTAL,
        
        baseHealth: 1000,
        healthPerLevel: 200,
        
        baseDamage: 35,
        damagePerLevel: 10,
        
        speed: 60,
        attackRange: 100,
        attackSpeed: 2000,
        knockbackPower: 400,
        
        phaseThresholds: [100, 66, 33],
        
        baseXP: BaseBossXP * 2,
        xpPerLevel: 200,
        
        arenaPosition: { x: 1200, y: 1400 },
        
        phases: {
            1: {
                name: 'Guardian',
                color: 0x00ffff,
                attackSpeedMultiplier: 1.0,
                damageMultiplier: 1.0,
                speedMultiplier: 1.0,
                attacks: [
                    { type: AttackTypes.MELEE_SWING, weight: 60, cooldown: 2500 },
                    { type: AttackTypes.RANGED_PROJECTILE, weight: 40, cooldown: 3000 }
                ],
                behaviors: ['guardian', 'crystal_shot']
            },
            2: {
                name: 'Awakened',
                color: 0xff00ff,
                attackSpeedMultiplier: 1.3,
                damageMultiplier: 1.4,
                speedMultiplier: 1.2,
                attacks: [
                    { type: AttackTypes.MELEE_SWING, weight: 30, cooldown: 1800 },
                    { type: AttackTypes.RANGED_BLAST, weight: 40, cooldown: 2500 },
                    { type: AttackTypes.AREA_SHOCKWAVE, weight: 30, cooldown: 3500 }
                ],
                behaviors: ['awakened', 'crystal_blast', 'shockwave']
            },
            3: {
                name: 'Prismatic',
                color: 0xffffff,
                attackSpeedMultiplier: 1.7,
                damageMultiplier: 1.8,
                speedMultiplier: 1.5,
                attacks: [
                    { type: AttackTypes.AREA_SLAM, weight: 35, cooldown: 3000 },
                    { type: AttackTypes.RANGED_BLAST, weight: 35, cooldown: 2000 },
                    { type: AttackTypes.SPECIAL_TELEPORT, weight: 30, cooldown: 4000 }
                ],
                behaviors: ['prismatic', 'prismatic_blast', 'teleport']
            }
        },
        
        lootTable: {
            coins: { min: 200, max: 400 },
            items: [
                { type: 'potion', rarity: 'uncommon', weight: 30, value: 50 },
                { type: 'powerup', rarity: 'rare', weight: 30, value: 70 },
                { type: 'crystal_shard', rarity: 'epic', weight: 28, value: 200 },
                { type: 'prismatic_gem', rarity: 'legendary', weight: 12, value: 400 }
            ]
        },
        
        size: { width: 96, height: 96 },
        tint: 0x00ffff
    },
    
    // Region 4 Boss: Broken City
    'industrial_titan': {
        name: 'Industrial Titan',
        description: 'A massive war machine from the old world',
        element: BossElements.INDUSTRIAL,
        
        baseHealth: 1500,
        healthPerLevel: 300,
        
        baseDamage: 45,
        damagePerLevel: 15,
        
        speed: 50,
        attackRange: 130,
        attackSpeed: 2500,
        knockbackPower: 500,
        
        phaseThresholds: [100, 66, 33],
        
        baseXP: BaseBossXP * 3,
        xpPerLevel: 300,
        
        arenaPosition: { x: 1800, y: 2000 },
        
        phases: {
            1: {
                name: 'Machine',
                color: 0xff6600,
                attackSpeedMultiplier: 1.0,
                damageMultiplier: 1.0,
                speedMultiplier: 1.0,
                attacks: [
                    { type: AttackTypes.MELEE_LUNGE, weight: 50, cooldown: 3000 },
                    { type: AttackTypes.RANGED_PROJECTILE, weight: 50, cooldown: 3500 }
                ],
                behaviors: ['mechanical', 'rocket_punch']
            },
            2: {
                name: 'Overloaded',
                color: 0xff3300,
                attackSpeedMultiplier: 1.4,
                damageMultiplier: 1.5,
                speedMultiplier: 1.3,
                attacks: [
                    { type: AttackTypes.MELEE_LUNGE, weight: 35, cooldown: 2000 },
                    { type: AttackTypes.AREA_SLAM, weight: 35, cooldown: 3500 },
                    { type: AttackTypes.RANGED_BLAST, weight: 30, cooldown: 2500 }
                ],
                behaviors: ['overloaded', 'smash', 'missile_barrage']
            },
            3: {
                name: 'Critical',
                color: 0xff0000,
                attackSpeedMultiplier: 1.8,
                damageMultiplier: 2.0,
                speedMultiplier: 1.6,
                attacks: [
                    { type: AttackTypes.AREA_SLAM, weight: 40, cooldown: 2500 },
                    { type: AttackTypes.SPECIAL_CHARGE, weight: 35, cooldown: 3500 },
                    { type: AttackTypes.AREA_SHOCKWAVE, weight: 25, cooldown: 4000 }
                ],
                behaviors: ['critical', 'self_destruct', 'charge_attack']
            }
        },
        
        lootTable: {
            coins: { min: 300, max: 600 },
            items: [
                { type: 'potion', rarity: 'uncommon', weight: 25, value: 60 },
                { type: 'powerup', rarity: 'rare', weight: 30, value: 80 },
                { type: 'scrap_metal', rarity: 'epic', weight: 30, value: 300 },
                { type: 'fusion_core', rarity: 'legendary', weight: 15, value: 600 }
            ]
        },
        
        size: { width: 128, height: 128 },
        tint: 0xff4400
    },
    
    // Region 5 Boss: The Core (Final Boss)
    'void_entity': {
        name: 'The Void Entity',
        description: 'The source of all glitch corruption',
        element: BossElements.VOID,
        
        baseHealth: 3000,
        healthPerLevel: 500,
        
        baseDamage: 60,
        damagePerLevel: 20,
        
        speed: 90,
        attackRange: 180,
        attackSpeed: 2000,
        knockbackPower: 600,
        
        phaseThresholds: [100, 75, 50, 25],  // 4 phases for final boss
        maxPhases: 4,
        
        baseXP: BaseBossXP * 10,
        xpPerLevel: 500,
        
        arenaPosition: { x: 1000, y: 1500 },
        
        phases: {
            1: {
                name: 'Void',
                color: 0x4b0082,
                attackSpeedMultiplier: 1.0,
                damageMultiplier: 1.0,
                speedMultiplier: 1.0,
                attacks: [
                    { type: AttackTypes.RANGED_BLAST, weight: 40, cooldown: 2500 },
                    { type: AttackTypes.SPECIAL_TELEPORT, weight: 35, cooldown: 4000 },
                    { type: AttackTypes.AREA_SHOCKWAVE, weight: 25, cooldown: 5000 }
                ],
                behaviors: ['void_magic', 'teleport', 'shockwave']
            },
            2: {
                name: 'Corruption',
                color: 0x8b00ff,
                attackSpeedMultiplier: 1.25,
                damageMultiplier: 1.3,
                speedMultiplier: 1.15,
                attacks: [
                    { type: AttackTypes.RANGED_BLAST, weight: 30, cooldown: 2000 },
                    { type: AttackTypes.SPECIAL_TELEPORT, weight: 30, cooldown: 3000 },
                    { type: AttackTypes.SPECIAL_SUMMON, weight: 25, cooldown: 5000 },
                    { type: AttackTypes.AREA_SLAM, weight: 15, cooldown: 4500 }
                ],
                behaviors: ['corruption', 'summon_minions', 'void_blast']
            },
            3: {
                name: 'Annihilation',
                color: 0xff0066,
                attackSpeedMultiplier: 1.5,
                damageMultiplier: 1.6,
                speedMultiplier: 1.3,
                attacks: [
                    { type: AttackTypes.AREA_SLAM, weight: 35, cooldown: 3000 },
                    { type: AttackTypes.SPECIAL_SUMMON, weight: 30, cooldown: 4000 },
                    { type: AttackTypes.SPECIAL_CHARGE, weight: 20, cooldown: 3500 },
                    { type: AttackTypes.RANGED_BLAST, weight: 15, cooldown: 1500 }
                ],
                behaviors: ['annihilation', 'mass_summon', 'charge']
            },
            4: {
                name: 'Total Chaos',
                color: 0xff0000,
                attackSpeedMultiplier: 1.8,
                damageMultiplier: 2.0,
                speedMultiplier: 1.5,
                attacks: [
                    { type: AttackTypes.AREA_SLAM, weight: 30, cooldown: 2000 },
                    { type: AttackTypes.SPECIAL_CHARGE, weight: 25, cooldown: 2500 },
                    { type: AttackTypes.SPECIAL_SUMMON, weight: 25, cooldown: 3000 },
                    { type: AttackTypes.RANGED_BLAST, weight: 20, cooldown: 1000 }
                ],
                behaviors: ['chaos', 'ultimate_summon', 'enraged_charge']
            }
        },
        
        lootTable: {
            coins: { min: 1000, max: 2000 },
            items: [
                { type: 'potion', rarity: 'uncommon', weight: 20, value: 100 },
                { type: 'powerup', rarity: 'rare', weight: 25, value: 100 },
                { type: 'void_crystal', rarity: 'epic', weight: 35, value: 500 },
                { type: 'reality_shard', rarity: 'legendary', weight: 20, value: 1000 }
            ]
        },
        
        size: { width: 160, height: 160 },
        tint: 0x220033
    }
};

// Region to boss mapping
export const RegionBossMap = {
    [Regions.SILENT_VILLAGE]: 'glitch_entity',
    [Regions.FORGOTTEN_FOREST]: 'corrupted_nature_spirit',
    [Regions.CRYSTAL_MINES]: 'crystalline_sentinel',
    [Regions.BROKEN_CITY]: 'industrial_titan',
    [Regions.THE_CORE]: 'void_entity'
};

// Helper function to get boss config by region
export function getBossConfigForRegion(region) {
    const bossKey = RegionBossMap[region];
    if (!bossKey) {
        console.warn(`No boss configured for region: ${region}`);
        return null;
    }
    return BossConfig[bossKey];
}

// Helper function to calculate boss stats based on player level
export function calculateBossStats(bossKey, playerLevel) {
    const config = BossConfig[bossKey];
    if (!config) return null;
    
    const levelMultiplier = Math.max(1, playerLevel * 0.5);
    
    return {
        name: config.name,
        maxHealth: Math.floor(config.baseHealth * levelMultiplier),
        damage: Math.floor(config.baseDamage + (config.damagePerLevel * (playerLevel - 1))),
        speed: config.speed,
        attackRange: config.attackRange,
        attackSpeed: config.attackSpeed,
        knockbackPower: config.knockbackPower,
        xpReward: Math.floor(config.baseXP + (config.xpPerLevel * (playerLevel - 1)))
    };
}
