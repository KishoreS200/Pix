import Phaser from 'phaser';
import { LootConfig } from '../utils/LootConfig';

export default class LootItem extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, type, value) {
        // Create a temporary texture for the loot item
        const size = LootItem.getSizeForType(type);
        const textureKey = `loot-${type}-${size}`;
        
        // Check if texture already exists, if not create it
        if (!scene.textures.exists(textureKey)) {
            LootItem.createLootTexture(scene, textureKey, type, size);
        }

        super(scene, x, y, textureKey);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.type = type;
        this.value = value;
        this.rarity = this.determineRarity(type, value);

        // Set up physics
        this.body.setAllowGravity(true);
        this.body.setBounce(0.3, 0.3);
        this.body.setVelocity(Phaser.Math.Between(-50, 50), Phaser.Math.Between(-100, -50));
        this.body.setDrag(100, 100);

        // Set up visual properties based on type and rarity
        this.setUpVisualProperties();

        // Start idle animation (gentle bob/float)
        this.startIdleAnimation();
    }

    static getSizeForType(type) {
        switch (type) {
            case 'coin': return 16;
            case 'potion': return 24;
            case 'powerup': return 32;
            default: return 20;
        }
    }

    determineRarity(type, value) {
        // Find the loot type config
        const lootType = LootConfig.dropTypes.find(item => item.type === type);
        if (lootType && lootType.rarity) {
            return lootType.rarity;
        }
        
        // Fallback logic
        if (type === 'powerup') return 'rare';
        if (type === 'potion') return 'uncommon';
        if (type === 'coin') {
            if (value >= 12) return 'uncommon';
            return 'common';
        }
        return 'common';
    }

    static createLootTexture(scene, textureKey, type, size) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Draw different shapes based on type
        switch (type) {
            case 'coin':
                // Golden circle
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#D4AF37';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // Add coin detail
                ctx.fillStyle = '#F5DEB3';
                ctx.beginPath();
                ctx.arc(size / 2, size / 2, size / 4, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'potion':
                // Red potion bottle
                ctx.fillStyle = '#DC143C';
                ctx.fillRect(2, 2, size - 4, size - 4);
                
                // Bottle neck
                ctx.fillStyle = '#B91C3C';
                ctx.fillRect(size / 3, 2, size / 3, size / 4);
                
                // Liquid
                ctx.fillStyle = '#FF6B8B';
                ctx.fillRect(4, size / 2, size - 8, size / 2 - 4);
                break;

            case 'powerup':
                // Cyan star/gem
                ctx.fillStyle = '#00FFFF';
                ctx.beginPath();
                ctx.moveTo(size / 2, 2);
                ctx.lineTo(size - 2, size / 2);
                ctx.lineTo(size / 2, size - 2);
                ctx.lineTo(2, size / 2);
                ctx.closePath();
                ctx.fill();
                
                // Inner glow
                ctx.fillStyle = '#7FFFD4';
                ctx.beginPath();
                ctx.arc(size / 2, size / 2, size / 4, 0, Math.PI * 2);
                ctx.fill();
                break;
        }

        scene.textures.addImage(textureKey, canvas);
    }

    setUpVisualProperties() {
        // Set tint based on rarity from config
        const rarityColor = LootConfig.rarityColors[this.rarity];
        if (rarityColor) {
            this.setTint(rarityColor);
        }

        // Set depth so loot appears above ground but below player
        this.setDepth(5);
    }

    startIdleAnimation() {
        // Gentle bob/float animation using tween
        this.scene.tweens.add({
            targets: this,
            y: this.y - 5,
            duration: 1500,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
    }

    playCollectAnimation() {
        // Scale up and fade out animation
        return new Promise((resolve) => {
            this.scene.tweens.add({
                targets: this,
                scale: 1.5,
                alpha: 0,
                duration: 300,
                ease: 'Power2',
                onComplete: () => {
                    this.destroy();
                    resolve();
                }
            });
        });
    }

    update() {
        // Loot items don't need complex update logic
        // Physics handles movement
    }
}