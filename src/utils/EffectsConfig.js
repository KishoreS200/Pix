export const EffectsConfig = {
    particles: {
        hit: {
            count: 10,
            duration: 300,
            spread: 'full'
        },
        loot: {
            coin: { count: 10, duration: 600 },
            potion: { count: 12, duration: 600 },
            powerup: { count: 15, duration: 700 }
        },
        death: {
            normal: { count: 20, duration: 500 },
            boss: { count: 40, duration: 1200 }
        },
        levelup: {
            count: 30,
            duration: 800
        }
    },
    
    screen: {
        flash: {
            damage: { color: 0xff0000, duration: 100, intensity: 0.4 },
            levelup: { color: 0xFFD700, duration: 150, intensity: 0.5 },
            boss: { color: 0x8b00ff, duration: 200, intensity: 0.6 }
        },
        shake: {
            damage: { intensity: 8, duration: 150 },
            levelup: { intensity: 10, duration: 200 },
            boss: { intensity: 15, duration: 300 }
        },
        chromatic: {
            levelup: { duration: 200, intensity: 6 },
            boss: { duration: 300, intensity: 8 }
        }
    },
    
    colors: {
        factions: {
            glitch_fauna: 0xff00ff,
            corrupted_human: 0x808080,
            sentinel_machine: 0x00ffff
        },
        regions: {
            'Silent Village': 0x00ffff,
            'Forgotten Forest': 0x00ff00,
            'Crystal Mines': 0xffffff,
            'Broken City': 0xff4500,
            'The Core': 0x8b00ff
        },
        effects: {
            player_hit: 0xff0000,
            damage: 0xffffff,
            healing: 0x00ff00,
            coin: 0xFFD700,
            potion: 0xff1493,
            powerup: 0x00ffff,
            levelup: 0xFFD700,
            boss: 0x8b00ff
        }
    }
};
