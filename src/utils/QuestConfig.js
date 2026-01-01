/**
 * QuestConfig.js
 * Defines all quests for the game
 */

export const QuestConfig = {
    // ===== SILENT VILLAGE QUESTS =====
    
    'hunt-forest-creatures': {
        questId: 'hunt-forest-creatures',
        giver: 'guard',
        title: 'Clear the Forest',
        description: 'Help the village by hunting down 5 corrupted creatures in the Forgotten Forest.',
        objectives: [
            {
                type: 'kill',
                target: 'any-enemy',
                region: 'Forgotten Forest',
                count: 5,
                current: 0
            }
        ],
        rewards: {
            coins: 100,
            xp: 200
        },
        onCompleteDialogue: 'Excellent work! The forest is safer thanks to your efforts.'
    },
    
    'gather-herbs': {
        questId: 'gather-herbs',
        giver: 'healer',
        title: 'Gather Healing Herbs',
        description: 'Collect 3 health potions to help restock the healer\'s supplies.',
        objectives: [
            {
                type: 'collect',
                target: 'health-potion',
                region: 'any',
                count: 3,
                current: 0
            }
        ],
        rewards: {
            coins: 50,
            xp: 150
        },
        onCompleteDialogue: 'These herbs will help many villagers. Thank you for your kindness.'
    },
    
    'scout-mines': {
        questId: 'scout-mines',
        giver: 'elder',
        title: 'Investigate the Crystal Mines',
        description: 'Travel to the Crystal Mines and report back what you find there.',
        objectives: [
            {
                type: 'explore',
                target: 'Crystal Mines',
                region: 'Crystal Mines',
                count: 1,
                current: 0
            }
        ],
        rewards: {
            coins: 75,
            xp: 250
        },
        onCompleteDialogue: 'The Crystal Mines... I feared this day would come. We must prepare ourselves.'
    },
    
    'defeat-first-boss': {
        questId: 'defeat-first-boss',
        giver: 'guard',
        title: 'Defeat the Corrupted Guardian',
        description: 'The Forgotten Forest is plagued by a Corrupted Nature Spirit. Defeat it to restore balance.',
        objectives: [
            {
                type: 'defeat-boss',
                target: 'corrupted-nature-spirit',
                region: 'Forgotten Forest',
                count: 1,
                current: 0
            }
        ],
        rewards: {
            coins: 500,
            xp: 1000
        },
        onCompleteDialogue: 'A mighty deed! You have struck a blow against the corruption.'
    },
    
    'defeat-second-boss': {
        questId: 'defeat-second-boss',
        giver: 'merchant',
        title: 'End the Crystal Menace',
        description: 'The Crystalline Sentinel in the mines blocks passage to the city. Destroy it!',
        objectives: [
            {
                type: 'defeat-boss',
                target: 'crystalline-sentinel',
                region: 'Crystal Mines',
                count: 1,
                current: 0
            }
        ],
        rewards: {
            coins: 750,
            xp: 1500
        },
        onCompleteDialogue: 'The mines are finally free! You\'ve done us a great service.'
    },
    
    'defeat-third-boss': {
        questId: 'defeat-third-boss',
        giver: 'survivor',
        title: 'Liberate the City',
        description: 'The Industrial Titan rules the Broken City with an iron fist. Free the survivors!',
        objectives: [
            {
                type: 'defeat-boss',
                target: 'industrial-titan',
                region: 'Broken City',
                count: 1,
                current: 0
            }
        ],
        rewards: {
            coins: 1000,
            xp: 2000
        },
        onCompleteDialogue: 'The city... it\'s finally quiet. We can begin rebuilding now.'
    },
    
    'defeat-final-boss': {
        questId: 'defeat-final-boss',
        giver: 'elder',
        title: 'Face the Void',
        description: 'The Void Entity at The Core is the source of all corruption. End it once and for all!',
        objectives: [
            {
                type: 'defeat-boss',
                target: 'void-entity',
                region: 'The Core',
                count: 1,
                current: 0
            }
        ],
        rewards: {
            coins: 5000,
            xp: 5000
        },
        onCompleteDialogue: 'You have done the impossible. The world is saved. May peace return at last.'
    },
    
    // ===== FORGOTTEN FOREST QUESTS =====
    
    'clear-forest-insects': {
        questId: 'clear-forest-insects',
        giver: 'shrineKeeper',
        title: 'Purge the Glitch Fauna',
        description: 'The shrine is surrounded by corrupted insects. Clear 10 of them.',
        objectives: [
            {
                type: 'kill',
                target: 'glitch-bug',
                region: 'Forgotten Forest',
                count: 10,
                current: 0
            }
        ],
        rewards: {
            coins: 150,
            xp: 300
        },
        onCompleteDialogue: 'Peace returns to the shrine grounds. The spirits thank you.'
    },
    
    'hunt-wolves': {
        questId: 'hunt-wolves',
        giver: 'hermit',
        title: 'Wolf Hunter',
        description: 'The Corrupted Wolves are aggressive. Hunt 5 of them.',
        objectives: [
            {
                type: 'kill',
                target: 'corrupted-wolf',
                region: 'Forgotten Forest',
                count: 5,
                current: 0
            }
        ],
        rewards: {
            coins: 200,
            xp: 400
        },
        onCompleteDialogue: 'Good riddance. Those wolves were terrorizing the forest.'
    },
    
    // ===== CRYSTAL MINES QUESTS =====
    
    'destroy-turrets': {
        questId: 'destroy-turrets',
        giver: 'miner',
        title: 'Disable the Defenses',
        description: 'Destroy 3 automated turrets blocking the mine entrance.',
        objectives: [
            {
                type: 'kill',
                target: 'turret',
                region: 'Crystal Mines',
                count: 3,
                current: 0
            }
        ],
        rewards: {
            coins: 175,
            xp: 350
        },
        onCompleteDialogue: 'At last, we can move freely again! Thank you!'
    },
    
    'clear-drones': {
        questId: 'clear-drones',
        giver: 'crystalMerchant',
        title: 'Drone Patrol',
        description: 'Eliminate 5 patrol drones in the upper mines.',
        objectives: [
            {
                type: 'kill',
                target: 'patrol-drone',
                region: 'Crystal Mines',
                count: 5,
                current: 0
            }
        ],
        rewards: {
            coins: 225,
            xp: 450
        },
        onCompleteDialogue: 'Much better. I might actually get some trade done now.'
    },
    
    // ===== BROKEN CITY QUESTS =====
    
    'eliminate-guards': {
        questId: 'eliminate-guards',
        giver: 'cityGuard',
        title: 'Corrupted Guards',
        description: 'The city guards are mindless now. Destroy 6 of them.',
        objectives: [
            {
                type: 'kill',
                target: 'corrupted-guard',
                region: 'Broken City',
                count: 6,
                current: 0
            }
        ],
        rewards: {
            coins: 250,
            xp: 500
        },
        onCompleteDialogue: 'Their suffering is over. You did what had to be done.'
    },
    
    'destroy-sentinels': {
        questId: 'destroy-sentinels',
        giver: 'trader',
        title: 'Sentinel Machines',
        description: 'The military Sentinel Machines are the biggest threat. Destroy 4.',
        objectives: [
            {
                type: 'kill',
                target: 'sentinel-machine',
                region: 'Broken City',
                count: 4,
                current: 0
            }
        ],
        rewards: {
            coins: 300,
            xp: 600
        },
        onCompleteDialogue: 'The military-grade machines are gone. The city is ours again.'
    }
};

/**
 * Get quest configuration by ID
 */
export function getQuestConfig(questId) {
    return QuestConfig[questId] || null;
}

/**
 * Get all quests offered by an NPC
 */
export function getQuestsForNPC(npcId) {
    const quests = [];
    
    for (const questId in QuestConfig) {
        const quest = QuestConfig[questId];
        if (quest.giver === npcId) {
            quests.push(quest);
        }
    }
    
    return quests;
}

/**
 * Get all quests for a region
 */
export function getQuestsForRegion(region) {
    const quests = [];
    
    for (const questId in QuestConfig) {
        const quest = QuestConfig[questId];
        // Check if any objective is in this region
        const hasRegionObjective = quest.objectives.some(obj => 
            obj.region === 'any' || obj.region === region
        );
        
        if (hasRegionObjective) {
            quests.push(quest);
        }
    }
    
    return quests;
}
