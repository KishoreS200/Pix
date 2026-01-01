import Phaser from 'phaser';
import LootItem from '../entities/LootItem';
import { LootConfig, getLootTypeByWeight } from '../utils/LootConfig';

export default class LootManager {
    constructor(scene) {
        this.scene = scene;
        this.lootItems = [];
    }

    spawnLootAtPosition(x, y, forcedType = null, forcedValue = null) {
        // Check if loot should drop (70% chance for regular enemies, 100% for boss)
        if (Math.random() > (forcedType ? 1 : LootConfig.dropChance)) {
            return null;
        }

        // Determine loot type
        let selectedType;
        let value;

        if (forcedType) {
            // Boss loot or forced loot
            selectedType = LootConfig.dropTypes.find(t => t.type === forcedType) || LootConfig.dropTypes[0];
            value = forcedValue || selectedType.value;
        } else {
            // Regular enemy loot
            selectedType = getLootTypeByWeight();
            if (selectedType.type === 'coin') {
                value = Phaser.Math.Between(selectedType.minValue, selectedType.maxValue);
            } else {
                value = selectedType.value;
            }
        }

        // Create loot item
        const lootItem = new LootItem(this.scene, x, y, selectedType.type, value);
        this.lootItems.push(lootItem);

        // Loot drop effects
        if (this.scene.particleManager) {
            this.scene.particleManager.createLootSparkles(x, y, selectedType.type);
        }

        if (this.scene.effectsManager) {
            // Subtle screen flash for drops
            if (selectedType.type === 'coin') {
                this.scene.effectsManager.screenFlash(0xffffcc, 120, 0.25);
            } else if (selectedType.type === 'potion') {
                this.scene.effectsManager.screenFlash(0xff88aa, 120, 0.2);
            } else if (selectedType.type === 'powerup') {
                this.scene.effectsManager.screenFlash(0x88ffff, 150, 0.3);
            } else if (forcedType && forcedType !== 'coin') {
                // Boss item - stronger effect
                this.scene.effectsManager.screenFlash(0xffd700, 150, 0.5);
            }
        }

        // Sound hook
        this.scene.events.emit('effect-loot-drop', { x, y, type: selectedType.type, value });

        // Auto-despawn after 30 seconds
        this.scene.time.delayedCall(30000, () => {
            this.despawnLootItem(lootItem);
        });

        return lootItem;
    }

    // Spawn boss-specific loot items (artifacts, essence, etc.)
    spawnBossLoot(x, y, itemType, value, rarity = 'epic') {
        const visuals = LootConfig.lootVisuals[itemType] || LootConfig.lootVisuals.powerup;
        
        // Create loot item with custom type
        const lootItem = new LootItem(this.scene, x, y, itemType, value);
        lootItem.rarity = rarity;
        lootItem.setTint(LootConfig.rarityColors[rarity] || 0xffffff);
        this.lootItems.push(lootItem);
        
        // Enhanced visual effects for boss loot
        if (this.scene.particleManager) {
            this.scene.particleManager.createLootSparkles(x, y, itemType);
            // Additional sparkles for boss loot
            this.scene.particleManager.createDeathExplosion(x, y, 'boss', 10);
        }
        
        if (this.scene.effectsManager) {
            this.scene.effectsManager.screenFlash(0xffd700, 150, 0.4);
        }
        
        // Boss loot sound
        if (this.scene.audioManager) {
            this.scene.audioManager.playSound('boss-loot');
        }
        
        // Emit event
        this.scene.events.emit('boss-loot-dropped', { x, y, type: itemType, value, rarity });
        
        // Auto-despawn after 60 seconds for boss loot
        this.scene.time.delayedCall(60000, () => {
            this.despawnLootItem(lootItem);
        });
        
        return lootItem;
    }

    despawnLootItem(lootItem) {
        const index = this.lootItems.indexOf(lootItem);
        if (index > -1) {
            this.lootItems.splice(index, 1);
        }
        if (lootItem && lootItem.active) {
            lootItem.destroy();
        }
    }

    cleanup() {
        this.lootItems.forEach(lootItem => {
            if (lootItem && lootItem.active) {
                lootItem.destroy();
            }
        });
        this.lootItems = [];
    }

    destroy() {
        this.cleanup();
    }
}