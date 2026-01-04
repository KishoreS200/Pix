/**
 * NPC.js
 * Non-Player Character entity with dialogue interaction
 */

import Phaser from 'phaser';

export default class NPC extends Phaser.GameObjects.Container {
    constructor(scene, config) {
        super(scene, config.x, config.y);
        
        this.scene = scene;
        this.npcId = config.id;
        this.dialogueId = config.dialogueId;
        this.npcName = config.name;
        this.role = config.role;
        this.npcColor = config.color || 0xffffff;
        this.npcScale = config.scale || 1.0;
        
        this.interactable = true;
        this.interactionRange = 80; // Distance for interaction prompt
        
        // Create sprite graphics
        this.createSprite();
        
        // Interaction indicator (will be shown when player is near)
        this.createInteractionIndicator();
        
        // Idle animation
        this.idleTimer = 0;
        this.idleDirection = 1;
        
        // Add to scene
        scene.add.existing(this);
        
        // Set depth so NPCs appear above ground but below player
        this.setDepth(5);
    }
    
    createSprite() {
        const textureKey = `npc_${this.npcId}`;

        // Fallback (should be rare; textures are generated in Preload)
        if (!this.scene.textures.exists(textureKey)) {
            const graphics = this.scene.add.graphics();
            graphics.fillStyle(this.npcColor, 1);
            graphics.fillRect(-8, -8, 16, 24);
            const headColor = this.lightenColor(this.npcColor, 0.3);
            graphics.fillStyle(headColor, 1);
            graphics.fillCircle(0, -18, 8);
            graphics.fillStyle(0x000000, 1);
            graphics.fillCircle(-3, -18, 2);
            graphics.fillCircle(3, -18, 2);
            graphics.lineStyle(1, 0x000000, 0.5);
            graphics.strokeRect(-8, -8, 16, 24);
            graphics.strokeCircle(0, -18, 8);
            graphics.generateTexture(textureKey, 32, 48);
            graphics.destroy();
        }

        this.setupAnimations(textureKey);

        // Create sprite from generated spritesheet
        this.sprite = this.scene.add.sprite(0, 0, textureKey);
        this.sprite.setScale(this.npcScale);
        this.add(this.sprite);

        this.sprite.play(`${textureKey}-idle-down`, true);

        // Add a subtle shadow
        const shadow = this.scene.add.ellipse(0, 20, 20, 8, 0x000000, 0.3);
        this.add(shadow);
        this.sendToBack(shadow);
    }

    setupAnimations(textureKey) {
        const anims = this.scene.anims;

        if (anims.exists(`${textureKey}-idle-down`)) return;

        anims.create({
            key: `${textureKey}-idle-down`,
            frames: anims.generateFrameNumbers(textureKey, { start: 0, end: 1 }),
            frameRate: 3,
            repeat: -1
        });

        anims.create({
            key: `${textureKey}-idle-up`,
            frames: anims.generateFrameNumbers(textureKey, { start: 2, end: 3 }),
            frameRate: 3,
            repeat: -1
        });

        anims.create({
            key: `${textureKey}-idle-left`,
            frames: anims.generateFrameNumbers(textureKey, { start: 4, end: 5 }),
            frameRate: 3,
            repeat: -1
        });

        anims.create({
            key: `${textureKey}-idle-right`,
            frames: anims.generateFrameNumbers(textureKey, { start: 6, end: 7 }),
            frameRate: 3,
            repeat: -1
        });

        // Walk frames start at 8
        anims.create({
            key: `${textureKey}-walk-down`,
            frames: anims.generateFrameNumbers(textureKey, { start: 8, end: 11 }),
            frameRate: 8,
            repeat: -1
        });

        anims.create({
            key: `${textureKey}-walk-up`,
            frames: anims.generateFrameNumbers(textureKey, { start: 12, end: 15 }),
            frameRate: 8,
            repeat: -1
        });

        anims.create({
            key: `${textureKey}-walk-left`,
            frames: anims.generateFrameNumbers(textureKey, { start: 16, end: 19 }),
            frameRate: 8,
            repeat: -1
        });

        anims.create({
            key: `${textureKey}-walk-right`,
            frames: anims.generateFrameNumbers(textureKey, { start: 20, end: 23 }),
            frameRate: 8,
            repeat: -1
        });
    }
    
    createInteractionIndicator() {
        // Create 'E' key prompt that floats above NPC
        this.indicator = this.scene.add.container(0, -40);
        
        // Background circle
        const bg = this.scene.add.circle(0, 0, 14, 0x00ffff, 0.8);
        this.indicator.add(bg);
        
        // 'E' text
        const text = this.scene.add.text(0, 0, 'E', {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#000000',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.indicator.add(text);
        
        this.add(this.indicator);
        this.indicator.setVisible(false);
        
        // Pulsing animation for indicator
        this.indicatorTween = this.scene.tweens.add({
            targets: this.indicator,
            y: -45,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        this.indicatorTween.pause();
    }
    
    lightenColor(color, amount) {
        const r = (color >> 16) & 0xff;
        const g = (color >> 8) & 0xff;
        const b = color & 0xff;
        
        const newR = Math.min(255, r + (255 - r) * amount);
        const newG = Math.min(255, g + (255 - g) * amount);
        const newB = Math.min(255, b + (255 - b) * amount);
        
        return (newR << 16) | (newG << 8) | newB;
    }
    
    update(playerX, playerY) {
        if (!this.interactable) return;
        
        // Calculate distance to player
        const distance = Phaser.Math.Distance.Between(this.x, this.y, playerX, playerY);
        
        // Show/hide interaction indicator based on distance
        if (distance <= this.interactionRange) {
            if (!this.indicator.visible) {
                this.showInteractionIndicator();
            }
        } else {
            if (this.indicator.visible) {
                this.hideInteractionIndicator();
            }
        }
        
        // Idle animation - gentle bobbing
        this.idleTimer += 0.02;
        if (this.sprite) {
            this.sprite.y = Math.sin(this.idleTimer) * 2;
        }
    }
    
    showInteractionIndicator() {
        this.indicator.setVisible(true);
        if (this.indicatorTween) {
            this.indicatorTween.resume();
        }
    }
    
    hideInteractionIndicator() {
        this.indicator.setVisible(false);
        if (this.indicatorTween) {
            this.indicatorTween.pause();
        }
    }
    
    canInteract(playerX, playerY) {
        if (!this.interactable) return false;
        const distance = Phaser.Math.Distance.Between(this.x, this.y, playerX, playerY);
        return distance <= this.interactionRange;
    }
    
    interact() {
        // This will be called by the InteractionManager
        // Return the dialogue data
        return {
            npcId: this.npcId,
            dialogueId: this.dialogueId,
            name: this.npcName,
            role: this.role
        };
    }
    
    destroy() {
        if (this.indicatorTween) {
            this.indicatorTween.remove();
        }
        super.destroy();
    }
}
