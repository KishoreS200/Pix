export const LootConfig = {
    dropChance: 0.7, // 70% drop chance
    dropTypes: [
        {
            type: 'coin',
            weight: 50,
            minValue: 5,
            maxValue: 15,
            rarity: 'common',
            color: 0xFFD700
        },
        {
            type: 'potion',
            weight: 30,
            value: 20,
            rarity: 'uncommon',
            color: 0xDC143C
        },
        {
            type: 'powerup',
            weight: 20,
            value: 50, // 50% damage boost
            rarity: 'rare',
            color: 0x00FFFF
        }
    ],
    
    // Visual properties for each loot type
    lootVisuals: {
        coin: {
            size: 16,
            shape: 'circle',
            primaryColor: '#FFD700',
            secondaryColor: '#D4AF37'
        },
        potion: {
            size: 24,
            shape: 'square',
            primaryColor: '#DC143C',
            secondaryColor: '#B91C3C'
        },
        powerup: {
            size: 32,
            shape: 'star',
            primaryColor: '#00FFFF',
            secondaryColor: '#7FFFD4'
        }
    },
    
    // Rarity colors
    rarityColors: {
        common: 0xFFFFFF,
        uncommon: 0x4682B4,
        rare: 0xFFD700
    },
    
    // Power-up settings
    powerUpSettings: {
        damageBoostPercentage: 50,
        durationMs: 10000, // 10 seconds
        knockbackBoostPercentage: 25
    }
};

export function getLootTypeByWeight() {
    const totalWeight = LootConfig.dropTypes.reduce((sum, item) => sum + item.weight, 0);
    let randomValue = Math.random() * totalWeight;
    
    for (const item of LootConfig.dropTypes) {
        randomValue -= item.weight;
        if (randomValue <= 0) {
            return item;
        }
    }
    
    return LootConfig.dropTypes[0]; // Fallback to coins
}