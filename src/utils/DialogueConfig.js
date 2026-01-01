/**
 * DialogueConfig.js
 * Defines all NPC dialogue for the game
 */

export const DialogueConfig = {
    // ===== SILENT VILLAGE NPCs =====
    
    elder: {
        name: "Village Elder",
        dialogues: [
            "Welcome, traveler. You've arrived at Silent Village, one of the last safe havens in this corrupted realm.",
            "The Glitch has spread far beyond The Core, corrupting everything in its path. Few dare venture into the wilderness.",
            "If you seek to restore this world, you must grow stronger. Defeat the corruption at its source - The Core itself.",
            "May the old code protect you on your journey."
        ],
        questOffers: [
            {
                questId: 'scout-mines',
                dialogue: "Traveler, we need information. The Crystal Mines have been silent for weeks. Can you investigate and report back what you find there?",
                acceptDialogue: "Be careful. Strange energy readings have been coming from below the mines. Return when you know more."
            },
            {
                questId: 'defeat-final-boss',
                dialogue: "The time has come. The Void Entity at The Core is the source of all corruption. You have proven yourself worthy. Will you face it?",
                acceptDialogue: "This is a task of legends. May the old code guide you, brave warrior."
            }
        ]
    },
    
    merchant: {
        name: "Village Merchant",
        dialogues: [
            "Ah, a customer! Well... I would sell you goods if I had any inventory left.",
            "The supply caravans stopped coming weeks ago. Too dangerous out there.",
            "If you find any coins in your travels, hold onto them. One day they'll be worth something again.",
            "Safe travels, friend. And watch out for the Corrupted Humans - they were once like us."
        ],
        questOffers: [
            {
                questId: 'defeat-second-boss',
                dialogue: "The path to the city is blocked by a Crystalline Sentinel in the mines. Can you destroy it so trade can resume?",
                acceptDialogue: "With the Sentinel gone, we may finally restore some commerce. Thank you!"
            }
        ]
    },
    
    healer: {
        name: "Village Healer",
        dialogues: [
            "You look weary, traveler. The wilderness takes its toll on even the strongest warriors.",
            "I've prepared healing potions from the few uncorrupted herbs that remain. You'll find them scattered throughout the regions.",
            "Remember: your health will naturally regenerate over time, but potions provide instant relief in combat.",
            "Stay safe out there. I'll be here when you need to rest."
        ],
        questOffers: [
            {
                questId: 'gather-herbs',
                dialogue: "My healing supplies are running low. Can you help me by collecting 3 health potions from your travels?",
                acceptDialogue: "Thank you! These potions will help many in need of healing."
            }
        ]
    },
    
    guard: {
        name: "Village Guard",
        dialogues: [
            "I stand watch to ensure no corrupted creatures breach our walls.",
            "The Forgotten Forest to the east is crawling with Glitch Fauna - twisted creatures corrupted by the anomaly.",
            "If you venture out there, stay alert. The enemies grow stronger the deeper you go.",
            "Your combat skills will improve with each victory. Don't give up!"
        ],
        questOffers: [
            {
                questId: 'hunt-forest-creatures',
                dialogue: "Adventurer, I need your help. The forest is teeming with corrupted creatures. Can you hunt 5 of them to make our village safer?",
                acceptDialogue: "Excellent! The forest creatures are dangerous, but I trust in your abilities. Return when you've completed the hunt."
            },
            {
                questId: 'defeat-first-boss',
                dialogue: "The Corrupted Nature Spirit has corrupted the heart of the forest. Someone must put it to rest. Will you do it?",
                acceptDialogue: "This task is not for the faint of heart. The Spirit is powerful, but you are stronger. Bring honor to our village!"
            }
        ]
    },
    
    villager1: {
        name: "Villager",
        dialogues: [
            "It's been so quiet lately... hence the name, I suppose.",
            "I miss the old days, before the Glitch corrupted everything.",
            "Do you think we'll ever see blue skies again?",
            "Stay safe out there, stranger."
        ]
    },
    
    villager2: {
        name: "Villager",
        dialogues: [
            "My family managed to escape from Broken City before it fell completely.",
            "We lost so much... but at least we're alive.",
            "The Crystal Mines used to be a source of prosperity. Now they're filled with machines gone mad.",
            "Thank you for protecting us."
        ]
    },
    
    villager3: {
        name: "Young Villager",
        dialogues: [
            "Wow, you're a real adventurer! That's so cool!",
            "I want to be brave like you when I grow up!",
            "My mom says the monsters are scary, but you're not afraid, right?",
            "Good luck out there! I believe in you!"
        ]
    },
    
    // ===== FORGOTTEN FOREST NPCs =====
    
    shrineKeeper: {
        name: "Shrine Keeper",
        dialogues: [
            "Welcome to the Sacred Shrine, a place of peace amidst the chaos.",
            "The forest has changed... the creatures that once lived in harmony are now twisted by corruption.",
            "I maintain this shrine to preserve what little sanctity remains in this world.",
            "Rest here, traveler. The corruption cannot reach this sacred ground.",
            "To the south lie the Crystal Mines - a place of beauty turned to madness."
        ],
        questOffers: [
            {
                questId: 'clear-forest-insects',
                dialogue: "The shrine grounds are infested with corrupted insects. Can you clear 10 of them to restore peace?",
                acceptDialogue: "The shrine is peaceful once more. Your service honors the spirits."
            }
        ]
    },
    
    hermit: {
        name: "Forest Hermit",
        dialogues: [
            "You're not corrupted... good. I can't say the same for most visitors these days.",
            "I've lived in these woods for decades. Watched them slowly decay into this nightmare.",
            "The Glitch Bugs are the least of your worries. Watch out for the Corrupted Wolves - they hunt in patterns.",
            "I'd leave, but... where would I go? This forest is my home, corrupted or not."
        ],
        questOffers: [
            {
                questId: 'hunt-wolves',
                dialogue: "The Corrupted Wolves have become too aggressive lately. Hunt 5 of them for me?",
                acceptDialogue: "Good. The forest will be safer for it. Be careful out there."
            }
        ]
    },
    
    // ===== CRYSTAL MINES NPCs =====
    
    miner: {
        name: "Stranded Miner",
        dialogues: [
            "Thank the old code, another living soul! I thought I was the last one down here.",
            "The mining operation collapsed when the machines went rogue. Sentinel units everywhere now.",
            "I'm stuck here in this safe zone until someone can clear a path out.",
            "Those turrets will blast anything that moves. And the patrol drones... they never stop hunting.",
            "If you're heading deeper, watch your step. The automated defenses don't discriminate."
        ],
        questOffers: [
            {
                questId: 'destroy-turrets',
                dialogue: "The turrets at the mine entrance are blocking any movement. Can you destroy 3 of them?",
                acceptDialogue: "Finally, we can move around freely! Thank you, friend!"
            }
        ]
    },
    
    crystalMerchant: {
        name: "Crystal Merchant",
        dialogues: [
            "These crystals used to be valuable. Now they're just pretty paperweights.",
            "I set up shop here hoping to salvage what I could from the mines. Not much luck so far.",
            "The deeper tunnels are completely overrun. I wouldn't go down there without serious firepower.",
            "Strange energy readings have been coming from below. Something's wrong with the crystal formations."
        ],
        questOffers: [
            {
                questId: 'clear-drones',
                dialogue: "Those patrol drones in the upper mines are making it impossible to work. Clear 5 of them?",
                acceptDialogue: "Much appreciated! Now I might actually get some business done."
            }
        ]
    },
    
    // ===== BROKEN CITY NPCs =====
    
    survivor: {
        name: "City Survivor",
        dialogues: [
            "You made it through the mines? Impressive. Most don't survive the journey.",
            "This city was once a marvel - thousands of people, technology, culture. Now look at it.",
            "The corrupted guards still patrol the streets, following their old orders even in death.",
            "We've established a few safe zones in the ruins. It's not much, but it's home.",
            "Beyond the southern border lies The Core. That's where this all started. That's where it must end."
        ],
        questOffers: [
            {
                questId: 'defeat-third-boss',
                dialogue: "The Industrial Titan has enslaved this city for too long. Can you defeat it and free us?",
                acceptDialogue: "You're our savior! The city can finally begin to heal."
            }
        ]
    },
    
    trader: {
        name: "Scrap Trader",
        dialogues: [
            "Trading in the apocalypse - not the career I envisioned, but here we are.",
            "I've scavenged what I can from the ruins. Mostly worthless now, but old habits die hard.",
            "The Sentinel Machines in this sector are military-grade. Much more dangerous than the mining units.",
            "If you're planning to assault The Core, you'd better be at peak strength. No one's come back from there."
        ],
        questOffers: [
            {
                questId: 'destroy-sentinels',
                dialogue: "Those Sentinel Machines are the biggest threat in the city. Can you destroy 4 of them?",
                acceptDialogue: "Excellent! With those gone, maybe we can rebuild something here."
            }
        ]
    },
    
    cityGuard: {
        name: "Resistance Guard",
        dialogues: [
            "I'm part of what's left of the city's defense force. Not much to defend anymore.",
            "We've fortified these safe zones as best we can, but we're fighting a losing battle.",
            "The Core pulses with corrupted energy. You can feel it even from here.",
            "If you can reach The Core and stop the Void Entity... maybe we can reclaim our world.",
            "We're counting on you, traveler. You might be our last hope."
        ],
        questOffers: [
            {
                questId: 'eliminate-guards',
                dialogue: "The corrupted guards are mindless but still dangerous. Destroy 6 of them to clear the streets.",
                acceptDialogue: "Good work. At least the city will be a little safer now."
            }
        ]
    }
};

/**
 * Get dialogue for an NPC by ID
 */
export function getNPCDialogue(npcId) {
    return DialogueConfig[npcId] || {
        name: "Unknown NPC",
        dialogues: ["..."]
    };
}

/**
 * Get a random dialogue line from an NPC
 */
export function getRandomDialogue(npcId) {
    const npcData = getNPCDialogue(npcId);
    const dialogues = npcData.dialogues;
    return dialogues[Math.floor(Math.random() * dialogues.length)];
}
