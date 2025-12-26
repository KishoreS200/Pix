import Phaser from 'phaser';
import LootItem from '../entities/LootItem';
import { LootConfig, getLootTypeByWeight } from '../utils/LootConfig';

export default class LootManager {
    constructor(scene) {
        this.scene = scene;
        this.lootItems = [];
    }

    spawnLootAtPosition(x, y) {
        // Check if loot should drop (70% chance)
        if (Math.random() > LootConfig.dropChance) {
            return null;
        }

        // Determine loot type based on weighted distribution
        const selectedType = getLootTypeByWeight();

        // Determine value based on type
        let value;
        if (selectedType.type === 'coin') {
            value = Phaser.Math.Between(selectedType.minValue, selectedType.maxValue);
        } else {
            value = selectedType.value;
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