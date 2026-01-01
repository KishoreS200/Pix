/**
 * NPCConfig.js
 * Defines NPC placements and properties for each region
 */

import { Regions } from './RegionConfig';

export const NPCConfig = {
    [Regions.SILENT_VILLAGE]: [
        {
            id: 'elder',
            dialogueId: 'elder',
            name: 'Village Elder',
            role: 'elder',
            x: 800,
            y: 600,
            color: 0x8b4513, // Brown robes
            scale: 1.2,
            questsOffered: ['scout-mines', 'defeat-final-boss']
        },
        {
            id: 'merchant',
            dialogueId: 'merchant',
            name: 'Village Merchant',
            role: 'merchant',
            x: 600,
            y: 400,
            color: 0xdaa520, // Goldenrod
            scale: 1.0,
            questsOffered: ['defeat-second-boss']
        },
        {
            id: 'healer',
            dialogueId: 'healer',
            name: 'Village Healer',
            role: 'healer',
            x: 1000,
            y: 400,
            color: 0x90ee90, // Light green
            scale: 1.0,
            questsOffered: ['gather-herbs']
        },
        {
            id: 'guard',
            dialogueId: 'guard',
            name: 'Village Guard',
            role: 'guard',
            x: 400,
            y: 600,
            color: 0x4682b4, // Steel blue (armor)
            scale: 1.1,
            questsOffered: ['hunt-forest-creatures', 'defeat-first-boss']
        },
        {
            id: 'villager1',
            dialogueId: 'villager1',
            name: 'Villager',
            role: 'villager',
            x: 500,
            y: 800,
            color: 0xdcdcdc, // Light grey
            scale: 0.9,
            questsOffered: []
        },
        {
            id: 'villager2',
            dialogueId: 'villager2',
            name: 'Villager',
            role: 'villager',
            x: 1100,
            y: 800,
            color: 0xf5deb3, // Wheat
            scale: 0.9,
            questsOffered: []
        },
        {
            id: 'villager3',
            dialogueId: 'villager3',
            name: 'Young Villager',
            role: 'villager',
            x: 900,
            y: 800,
            color: 0xffb6c1, // Light pink
            scale: 0.7,
            questsOffered: []
        }
    ],
    
    [Regions.FORGOTTEN_FOREST]: [
        {
            id: 'shrineKeeper',
            dialogueId: 'shrineKeeper',
            name: 'Shrine Keeper',
            role: 'shrine_keeper',
            x: 1200,
            y: 900,
            color: 0x9370db, // Medium purple (mystic)
            scale: 1.1,
            questsOffered: ['clear-forest-insects']
        },
        {
            id: 'hermit',
            dialogueId: 'hermit',
            name: 'Forest Hermit',
            role: 'hermit',
            x: 600,
            y: 1200,
            color: 0x556b2f, // Dark olive green
            scale: 1.0,
            questsOffered: ['hunt-wolves']
        }
    ],
    
    [Regions.CRYSTAL_MINES]: [
        {
            id: 'miner',
            dialogueId: 'miner',
            name: 'Stranded Miner',
            role: 'miner',
            x: 800,
            y: 400,
            color: 0xff8c00, // Dark orange (safety vest)
            scale: 1.0,
            questsOffered: ['destroy-turrets']
        },
        {
            id: 'crystalMerchant',
            dialogueId: 'crystalMerchant',
            name: 'Crystal Merchant',
            role: 'merchant',
            x: 1200,
            y: 600,
            color: 0x00ced1, // Dark turquoise
            scale: 1.0,
            questsOffered: ['clear-drones']
        }
    ],
    
    [Regions.BROKEN_CITY]: [
        {
            id: 'survivor',
            dialogueId: 'survivor',
            name: 'City Survivor',
            role: 'survivor',
            x: 400,
            y: 1200,
            color: 0x696969, // Dim grey (tattered clothes)
            scale: 0.95,
            questsOffered: ['defeat-third-boss']
        },
        {
            id: 'trader',
            dialogueId: 'trader',
            name: 'Scrap Trader',
            role: 'merchant',
            x: 800,
            y: 1400,
            color: 0xcd853f, // Peru brown
            scale: 1.0,
            questsOffered: ['destroy-sentinels']
        },
        {
            id: 'cityGuard',
            dialogueId: 'cityGuard',
            name: 'Resistance Guard',
            role: 'guard',
            x: 1200,
            y: 1600,
            color: 0x2f4f4f, // Dark slate grey (damaged armor)
            scale: 1.1,
            questsOffered: ['eliminate-guards']
        }
    ],
    
    [Regions.THE_CORE]: [
        // No NPCs in The Core - it's the final dangerous area
    ]
};

/**
 * Safe zones - areas where enemies won't spawn
 * These are typically around villages, shrines, and camps
 */
export const SafeZones = {
    [Regions.SILENT_VILLAGE]: [
        // Main village area - covers most of the central area
        {
            x: 300,
            y: 300,
            width: 1000,
            height: 600,
            name: 'Village Center'
        }
    ],
    
    [Regions.FORGOTTEN_FOREST]: [
        // Shrine area - central safe clearing
        {
            x: 1000,
            y: 700,
            width: 400,
            height: 400,
            name: 'Sacred Shrine'
        },
        // Hermit's grove
        {
            x: 450,
            y: 1050,
            width: 300,
            height: 300,
            name: 'Hermit Grove'
        }
    ],
    
    [Regions.CRYSTAL_MINES]: [
        // Surface mining camp
        {
            x: 600,
            y: 200,
            width: 400,
            height: 600,
            name: 'Mining Camp'
        }
    ],
    
    [Regions.BROKEN_CITY]: [
        // Safe zone shelter
        {
            x: 200,
            y: 1000,
            width: 400,
            height: 400,
            name: 'Survivor Shelter'
        },
        // Resistance outpost
        {
            x: 1000,
            y: 1400,
            width: 400,
            height: 400,
            name: 'Resistance Outpost'
        }
    ],
    
    [Regions.THE_CORE]: [
        // No safe zones in The Core
    ]
};

/**
 * Check if a position is within any safe zone for the given region
 */
export function isInSafeZone(region, x, y) {
    const zones = SafeZones[region];
    if (!zones || zones.length === 0) return false;
    
    for (const zone of zones) {
        if (x >= zone.x && x <= zone.x + zone.width &&
            y >= zone.y && y <= zone.y + zone.height) {
            return true;
        }
    }
    
    return false;
}

/**
 * Get all NPCs for a specific region
 */
export function getNPCsForRegion(region) {
    return NPCConfig[region] || [];
}
