import { Regions } from './RegionConfig';

export const EnemyKeys = {
    GLITCH_SPRITE: 'enemy_glitch_sprite',
    CORRUPTED_RAT: 'enemy_corrupted_rat',
    THORNED_BEAST: 'enemy_thorned_beast',
    FOREST_WRAITH: 'enemy_forest_wraith',
    CRYSTAL_GOLEM: 'enemy_crystal_golem',
    MINING_GLITCH: 'enemy_mining_glitch',
    CORRUPTED_SENTINEL: 'enemy_corrupted_sentinel',
    URBAN_GHOUL: 'enemy_urban_ghoul',
    VOID_ENTITY: 'enemy_void_entity',
    CORRUPTED_GUARDIAN: 'enemy_corrupted_guardian'
};

export const EnemyFactions = {
    GLITCH: 'faction_glitch',
    BEAST: 'faction_beast',
    CRYSTAL: 'faction_crystal',
    INDUSTRIAL: 'faction_industrial',
    VOID: 'faction_void',
    CORRUPTION: 'faction_corruption'
};

export const EnemyTypeConfig = {
    [EnemyKeys.GLITCH_SPRITE]: {
        name: 'Glitch Sprite',
        faction: EnemyFactions.GLITCH,
        behavior: 'jitter',
        size: 'small',
        health: 16,
        speed: 240,
        detectionRadius: 180,
        damage: 4,
        attackRange: 80,
        attackCooldown: 900,
        xpReward: 8
    },
    [EnemyKeys.CORRUPTED_RAT]: {
        name: 'Corrupted Rat',
        faction: EnemyFactions.CORRUPTION,
        behavior: 'scurry',
        size: 'small',
        health: 14,
        speed: 260,
        detectionRadius: 160,
        damage: 5,
        attackRange: 70,
        attackCooldown: 850,
        xpReward: 9
    },
    [EnemyKeys.THORNED_BEAST]: {
        name: 'Thorned Beast',
        faction: EnemyFactions.BEAST,
        behavior: 'pounce',
        size: 'medium',
        health: 38,
        speed: 160,
        detectionRadius: 220,
        damage: 10,
        attackRange: 100,
        attackCooldown: 1100,
        xpReward: 16
    },
    [EnemyKeys.FOREST_WRAITH]: {
        name: 'Forest Wraith',
        faction: EnemyFactions.GLITCH,
        behavior: 'phase',
        size: 'medium',
        health: 30,
        speed: 140,
        detectionRadius: 250,
        damage: 12,
        attackRange: 120,
        attackCooldown: 1200,
        xpReward: 18
    },
    [EnemyKeys.CRYSTAL_GOLEM]: {
        name: 'Crystal Golem',
        faction: EnemyFactions.CRYSTAL,
        behavior: 'slow_chase',
        size: 'large',
        health: 80,
        speed: 80,
        detectionRadius: 260,
        damage: 16,
        attackRange: 130,
        attackCooldown: 1500,
        xpReward: 28
    },
    [EnemyKeys.MINING_GLITCH]: {
        name: 'Mining Glitch',
        faction: EnemyFactions.CORRUPTION,
        behavior: 'chase',
        size: 'medium',
        health: 45,
        speed: 120,
        detectionRadius: 220,
        damage: 12,
        attackRange: 110,
        attackCooldown: 1150,
        xpReward: 22
    },
    [EnemyKeys.CORRUPTED_SENTINEL]: {
        name: 'Corrupted Sentinel',
        faction: EnemyFactions.INDUSTRIAL,
        behavior: 'turret_or_patrol',
        size: 'large',
        health: 70,
        speed: 140,
        detectionRadius: 300,
        damage: 18,
        attackRange: 180,
        attackCooldown: 1300,
        xpReward: 32
    },
    [EnemyKeys.URBAN_GHOUL]: {
        name: 'Urban Ghoul',
        faction: EnemyFactions.CORRUPTION,
        behavior: 'aggressive',
        size: 'medium',
        health: 55,
        speed: 170,
        detectionRadius: 260,
        damage: 16,
        attackRange: 120,
        attackCooldown: 950,
        xpReward: 26
    },
    [EnemyKeys.VOID_ENTITY]: {
        name: 'Void Entity',
        faction: EnemyFactions.VOID,
        behavior: 'warp',
        size: 'large',
        health: 95,
        speed: 150,
        detectionRadius: 320,
        damage: 22,
        attackRange: 170,
        attackCooldown: 1100,
        xpReward: 40
    },
    [EnemyKeys.CORRUPTED_GUARDIAN]: {
        name: 'Corrupted Guardian',
        faction: EnemyFactions.VOID,
        behavior: 'elite',
        size: 'large',
        health: 120,
        speed: 170,
        detectionRadius: 340,
        damage: 26,
        attackRange: 190,
        attackCooldown: 1050,
        xpReward: 55
    }
};

export const EnemySpawnsByRegion = {
    [Regions.SILENT_VILLAGE]: [
        { key: EnemyKeys.GLITCH_SPRITE, x: 150, y: 200 },
        { key: EnemyKeys.CORRUPTED_RAT, x: 1450, y: 300 },
        { key: EnemyKeys.GLITCH_SPRITE, x: 200, y: 1000 },
        { key: EnemyKeys.CORRUPTED_RAT, x: 1400, y: 1000 }
    ],
    [Regions.FORGOTTEN_FOREST]: [
        { key: EnemyKeys.THORNED_BEAST, x: 400, y: 300 },
        { key: EnemyKeys.FOREST_WRAITH, x: 2000, y: 600 },
        { key: EnemyKeys.THORNED_BEAST, x: 2100, y: 400 },
        { key: EnemyKeys.FOREST_WRAITH, x: 300, y: 1600 },
        { key: EnemyKeys.THORNED_BEAST, x: 1800, y: 1200 },
        { key: EnemyKeys.FOREST_WRAITH, x: 2200, y: 1500 }
    ],
    [Regions.CRYSTAL_MINES]: [
        { key: EnemyKeys.CRYSTAL_GOLEM, x: 300, y: 1000 },
        { key: EnemyKeys.MINING_GLITCH, x: 1500, y: 300 },
        { key: EnemyKeys.CRYSTAL_GOLEM, x: 900, y: 1500 },
        { key: EnemyKeys.MINING_GLITCH, x: 400, y: 1200 },
        { key: EnemyKeys.MINING_GLITCH, x: 1200, y: 1200 }
    ],
    [Regions.BROKEN_CITY]: [
        { key: EnemyKeys.CORRUPTED_SENTINEL, x: 800, y: 500 },
        { key: EnemyKeys.URBAN_GHOUL, x: 1500, y: 500 },
        { key: EnemyKeys.URBAN_GHOUL, x: 2000, y: 1500 },
        { key: EnemyKeys.CORRUPTED_SENTINEL, x: 1600, y: 2000 },
        { key: EnemyKeys.CORRUPTED_SENTINEL, x: 800, y: 800 },
        { key: EnemyKeys.URBAN_GHOUL, x: 1800, y: 1000 }
    ],
    [Regions.THE_CORE]: [
        { key: EnemyKeys.VOID_ENTITY, x: 600, y: 600 },
        { key: EnemyKeys.VOID_ENTITY, x: 1400, y: 800 },
        { key: EnemyKeys.CORRUPTED_GUARDIAN, x: 1000, y: 1200 }
    ]
};
