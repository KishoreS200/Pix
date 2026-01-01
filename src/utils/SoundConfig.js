// Sound effect configurations for Web Audio API generation
// Each sound is defined with parameters for procedural synthesis

export const SoundConfig = {
    // Combat Sounds
    'attack-swing': {
        type: 'sweep',
        startFreq: 400,
        endFreq: 200,
        duration: 0.15,
        volume: 0.3,
        envelope: { attack: 0.01, decay: 0.05, sustain: 0.3, release: 0.1 }
    },
    'attack-hit': {
        type: 'impact',
        frequency: 150,
        duration: 0.1,
        volume: 0.4,
        noise: true,
        envelope: { attack: 0.005, decay: 0.03, sustain: 0.2, release: 0.06 }
    },
    'enemy-hit': {
        type: 'tone',
        frequency: 300,
        duration: 0.08,
        volume: 0.35,
        envelope: { attack: 0.01, decay: 0.03, sustain: 0.3, release: 0.04 }
    },
    'knockback': {
        type: 'sweep',
        startFreq: 200,
        endFreq: 100,
        duration: 0.2,
        volume: 0.3,
        envelope: { attack: 0.01, decay: 0.08, sustain: 0.2, release: 0.1 }
    },
    'player-hurt': {
        type: 'sweep',
        startFreq: 500,
        endFreq: 200,
        duration: 0.25,
        volume: 0.4,
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.14 }
    },
    'death': {
        type: 'sweep',
        startFreq: 400,
        endFreq: 50,
        duration: 0.5,
        volume: 0.4,
        noise: true,
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.29 }
    },
    
    // Loot Sounds
    'coin-pickup': {
        type: 'arpeggio',
        frequencies: [523.25, 659.25, 783.99], // C5, E5, G5
        noteDuration: 0.08,
        duration: 0.3,
        volume: 0.35,
        envelope: { attack: 0.01, decay: 0.02, sustain: 0.5, release: 0.05 }
    },
    'potion-pickup': {
        type: 'chord',
        frequencies: [349.23, 440, 523.25], // F4, A4, C5
        duration: 0.3,
        volume: 0.3,
        envelope: { attack: 0.02, decay: 0.1, sustain: 0.4, release: 0.18 }
    },
    'powerup-pickup': {
        type: 'sweep',
        startFreq: 400,
        endFreq: 800,
        duration: 0.4,
        volume: 0.35,
        modulation: true,
        envelope: { attack: 0.05, decay: 0.1, sustain: 0.6, release: 0.25 }
    },
    'boss-loot': {
        type: 'fanfare',
        frequencies: [523.25, 659.25, 783.99, 1046.5], // C5, E5, G5, C6
        noteDuration: 0.15,
        duration: 0.7,
        volume: 0.4,
        envelope: { attack: 0.05, decay: 0.05, sustain: 0.7, release: 0.05 }
    },
    
    // UI Sounds
    'level-up': {
        type: 'arpeggio',
        frequencies: [523.25, 659.25, 783.99, 1046.5], // C5, E5, G5, C6
        noteDuration: 0.12,
        duration: 0.6,
        volume: 0.4,
        envelope: { attack: 0.01, decay: 0.05, sustain: 0.6, release: 0.06 }
    },
    'boss-phase': {
        type: 'alarm',
        frequency: 440,
        duration: 0.5,
        volume: 0.35,
        pulseRate: 8,
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.8, release: 0.09 }
    },
    'boss-defeated': {
        type: 'fanfare',
        frequencies: [523.25, 659.25, 783.99, 1046.5, 1318.5], // C5, E5, G5, C6, E6
        noteDuration: 0.2,
        duration: 1.2,
        volume: 0.45,
        envelope: { attack: 0.05, decay: 0.08, sustain: 0.7, release: 0.07 }
    },
    'game-over': {
        type: 'sweep',
        startFreq: 300,
        endFreq: 100,
        duration: 1.0,
        volume: 0.35,
        envelope: { attack: 0.05, decay: 0.3, sustain: 0.3, release: 0.35 }
    },
    'menu-select': {
        type: 'tone',
        frequency: 440,
        duration: 0.1,
        volume: 0.25,
        envelope: { attack: 0.01, decay: 0.03, sustain: 0.5, release: 0.06 }
    },
    'menu-confirm': {
        type: 'chord',
        frequencies: [523.25, 659.25], // C5, E5
        duration: 0.2,
        volume: 0.3,
        envelope: { attack: 0.02, decay: 0.05, sustain: 0.6, release: 0.13 }
    },
    
    // Boss Attack Sounds
    'boss-swing': {
        type: 'sweep',
        startFreq: 300,
        endFreq: 150,
        duration: 0.25,
        volume: 0.4,
        envelope: { attack: 0.01, decay: 0.08, sustain: 0.4, release: 0.1 }
    },
    'boss-slam': {
        type: 'impact',
        frequency: 80,
        duration: 0.4,
        volume: 0.5,
        noise: true,
        envelope: { attack: 0.01, decay: 0.15, sustain: 0.3, release: 0.14 }
    },
    'boss-projectile': {
        type: 'sweep',
        startFreq: 600,
        endFreq: 300,
        duration: 0.3,
        volume: 0.35,
        modulation: true,
        envelope: { attack: 0.02, decay: 0.1, sustain: 0.5, release: 0.1 }
    },
    'boss-teleport': {
        type: 'tone',
        frequency: 880,
        duration: 0.3,
        volume: 0.2,
        envelope: { attack: 0.05, decay: 0.15, sustain: 0.3, release: 0.1 }
    },
    'boss-charge': {
        type: 'sweep',
        startFreq: 100,
        endFreq: 400,
        duration: 0.5,
        volume: 0.35,
        noise: true,
        envelope: { attack: 0.1, decay: 0.2, sustain: 0.2, release: 0.2 }
    },
    'boss-summon': {
        type: 'arpeggio',
        frequencies: [440, 554, 659, 880],
        noteDuration: 0.1,
        duration: 0.5,
        volume: 0.3,
        envelope: { attack: 0.02, decay: 0.08, sustain: 0.5, release: 0.1 }
    }
};

// Categories for easier management
export const SoundCategories = {
    COMBAT: ['attack-swing', 'attack-hit', 'enemy-hit', 'knockback', 'player-hurt', 'death', 'boss-swing', 'boss-slam', 'boss-projectile', 'boss-teleport', 'boss-charge', 'boss-summon'],
    LOOT: ['coin-pickup', 'potion-pickup', 'powerup-pickup', 'boss-loot'],
    UI: ['level-up', 'boss-phase', 'boss-defeated', 'game-over', 'menu-select', 'menu-confirm']
};
