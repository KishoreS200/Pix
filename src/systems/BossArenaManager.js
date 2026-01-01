import Phaser from 'phaser';
import Boss from '../entities/Boss';
import BossHealthBar from './BossHealthBar';
import { getBossConfigForRegion, RegionBossMap } from '../utils/BossConfig';
import { MusicKeys } from '../utils/MusicConfig';
import { Regions } from '../utils/RegionConfig';

export default class BossArenaManager {
    constructor(scene) {
        this.scene = scene;
        
        // Boss state
        this.currentBoss = null;
        this.bossKey = null;
        this.isBossActive = false;
        this.bossDefeated = false;
        this.defeatedBosses = new Set();
        
        // Arena visuals
        this.arenaBounds = null;
        this.arenaGraphics = null;
        this.arenaParticles = null;
        
        // Boss health bar
        this.bossHealthBar = null;
        
        // Defeat notification
        this.defeatNotification = null;
        
        // Spawn trigger
        this.spawnTriggerDistance = 150; // Distance to trigger boss spawn
        this.hasTriggeredSpawn = false;
        
        // Initialize
        this._init();
    }
    
    _init() {
        // Create boss health bar
        this.bossHealthBar = new BossHealthBar(this.scene);
        
        // Create arena graphics layer
        this.arenaGraphics = this.scene.add.graphics();
        this.arenaGraphics.setDepth(5);
    }
    
    // Get arena position for a region
    getArenaPosition(region) {
        const config = getBossConfigForRegion(region);
        if (!config) return null;
        
        return config.arenaPosition;
    }
    
    // Check if player is approaching the arena
    checkArenaProximity() {
        if (this.isBossActive || this.bossDefeated || this.hasTriggeredSpawn) {
            return false;
        }
        
        const arenaPos = this.getArenaPosition(this.scene.currentRegion);
        if (!arenaPos) return false;
        
        const player = this.scene.player;
        if (!player) return false;
        
        const distance = Phaser.Math.Distance.Between(
            player.x, player.y,
            arenaPos.x, arenaPos.y
        );
        
        if (distance <= this.spawnTriggerDistance) {
            this.hasTriggeredSpawn = true;
            this.spawnBoss();
            return true;
        }
        
        return false;
    }
    
    // Spawn the boss for the current region
    spawnBoss() {
        const region = this.scene.currentRegion;
        const bossKey = RegionBossMap[region];
        
        if (!bossKey) {
            console.warn(`No boss key found for region: ${region}`);
            return null;
        }
        
        // Check if already defeated
        if (this.defeatedBosses.has(bossKey)) {
            console.log(`Boss ${bossKey} already defeated`);
            return null;
        }
        
        // Get arena position
        const arenaPos = this.getArenaPosition(region);
        if (!arenaPos) {
            console.warn(`No arena position for region: ${region}`);
            return null;
        }
        
        // Get player level
        const playerLevel = this.scene.progressionManager 
            ? this.scene.progressionManager.getCurrentLevel() 
            : 1;
        
        // Create arena visuals before spawning boss
        this.createArenaVisuals(arenaPos.x, arenaPos.y);
        
        // Create boss
        this.currentBoss = new Boss(this.scene, arenaPos.x, arenaPos.y, bossKey, playerLevel);
        this.bossKey = bossKey;
        this.isBossActive = true;
        this.bossDefeated = false;
        
        // Show boss health bar
        this.bossHealthBar.show(this.currentBoss);
        
        // Play boss music
        if (this.scene.audioManager) {
            this.scene.audioManager.playMusic(MusicKeys.BOSS_NORMAL, true, 500);
        }
        
        // Visual announcement
        this.showBossAnnouncement(this.currentBoss.name);
        
        // Emit event
        this.scene.events.emit('boss-spawned', {
            boss: this.currentBoss,
            name: this.currentBoss.name,
            region: region
        });
        
        console.log(`Boss spawned: ${this.currentBoss.name} at region ${region}`);
        
        return this.currentBoss;
    }
    
    createArenaVisuals(x, y) {
        // Clear previous arena graphics
        this.arenaGraphics.clear();
        
        // Draw arena boundary
        const arenaRadius = 200;
        
        // Outer ring
        this.arenaGraphics.lineStyle(4, 0x8b00ff, 0.5);
        this.arenaGraphics.strokeCircle(x, y, arenaRadius);
        
        // Inner ring
        this.arenaGraphics.lineStyle(2, 0x00ffff, 0.3);
        this.arenaGraphics.strokeCircle(x, y, arenaRadius - 20);
        
        // Particle effect at arena center
        this.createArenaParticles(x, y);
        
        // Create spawn trigger visual (subtle glow)
        const glow = this.scene.add.circle(x, y, arenaRadius, 0x8b00ff, 0.1);
        this.scene.tweens.add({
            targets: glow,
            scale: 1.2,
            alpha: 0,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => {
                glow.destroy();
            }
        });
    }
    
    createArenaParticles(x, y) {
        // Create floating particles around arena
        const particleCount = 12;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const radius = 180;
            const startX = x + Math.cos(angle) * radius;
            const startY = y + Math.sin(angle) * radius;
            
            const particle = this.scene.add.circle(startX, startY, 4, 0x8b00ff, 0.8);
            particle.setDepth(6);
            
            // Animate particle
            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * (radius - 20),
                y: y + Math.sin(angle) * (radius - 20),
                alpha: 0,
                duration: 2000,
                delay: i * 100,
                ease: 'Power2',
                onComplete: () => {
                    particle.destroy();
                }
            });
        }
    }
    
    showBossAnnouncement(bossName) {
        // Create announcement text
        const { width, height } = this.scene.cameras.main;
        
        const announcement = this.scene.add.text(width / 2, height / 2 - 50, 'BOSS BATTLE', {
            fontSize: '48px',
            fontFamily: 'monospace',
            color: '#ff0000',
            fontStyle: 'bold'
        });
        announcement.setOrigin(0.5);
        announcement.setScrollFactor(0);
        announcement.setDepth(300);
        announcement.setShadow(4, 4, '#000000', 8);
        
        // Glitch effect on text
        if (this.scene.effectsManager) {
            this.scene.effectsManager.glitchText(announcement, 3000);
        }
        
        // Subtitle with boss name
        const subtitle = this.scene.add.text(width / 2, height / 2 + 20, bossName, {
            fontSize: '28px',
            fontFamily: 'monospace',
            color: '#8b00ff',
            fontStyle: 'bold'
        });
        subtitle.setOrigin(0.5);
        subtitle.setScrollFactor(0);
        subtitle.setDepth(300);
        
        // Fade out animation
        this.scene.tweens.add({
            targets: [announcement, subtitle],
            alpha: 0,
            y: '-=50',
            duration: 3000,
            delay: 2000,
            ease: 'Power2',
            onComplete: () => {
                announcement.destroy();
                subtitle.destroy();
            }
        });
    }
    
    showDefeatNotification(bossName, xpReward) {
        const { width, height } = this.scene.cameras.main;
        
        // Victory background
        const bg = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
        bg.setScrollFactor(0);
        bg.setDepth(400);
        
        // Victory text
        const victoryText = this.scene.add.text(width / 2, height / 2 - 80, 'VICTORY!', {
            fontSize: '56px',
            fontFamily: 'monospace',
            color: '#FFD700',
            fontStyle: 'bold'
        });
        victoryText.setOrigin(0.5);
        victoryText.setScrollFactor(0);
        victoryText.setDepth(401);
        victoryText.setShadow(4, 4, '#000000', 8);
        
        // Boss name
        const nameText = this.scene.add.text(width / 2, height / 2, bossName, {
            fontSize: '32px',
            fontFamily: 'monospace',
            color: '#ffffff'
        });
        nameText.setOrigin(0.5);
        nameText.setScrollFactor(0);
        nameText.setDepth(401);
        
        // XP reward
        const xpText = this.scene.add.text(width / 2, height / 2 + 50, `+${xpReward} XP`, {
            fontSize: '28px',
            fontFamily: 'monospace',
            color: '#00ffff'
        });
        xpText.setOrigin(0.5);
        xpText.setScrollFactor(0);
        xpText.setDepth(401);
        
        // Pulse animation on victory text
        this.scene.tweens.add({
            targets: victoryText,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 500,
            yoyo: true,
            repeat: 2,
            ease: 'Back.easeOut'
        });
        
        // Fade out after delay
        this.scene.time.delayedCall(4000, () => {
            this.scene.tweens.add({
                targets: [bg, victoryText, nameText, xpText],
                alpha: 0,
                duration: 500,
                ease: 'Power2',
                onComplete: () => {
                    bg.destroy();
                    victoryText.destroy();
                    nameText.destroy();
                    xpText.destroy();
                }
            });
        });
    }
    
    update(player, delta) {
        // Check if player is approaching arena
        this.checkArenaProximity();
        
        // Update boss
        if (this.currentBoss && this.isBossActive) {
            this.currentBoss.update(player, delta);
        }
        
        // Update health bar
        if (this.bossHealthBar) {
            this.bossHealthBar.update();
        }
    }
    
    // Handle boss defeat
    onBossDefeated(event) {
        if (this.currentBoss && event.boss === this.currentBoss) {
            this.isBossActive = false;
            this.bossDefeated = true;
            
            if (this.bossKey) {
                this.defeatedBosses.add(this.bossKey);
            }
            
            // Show defeat notification
            this.showDefeatNotification(event.name, event.xpReward);
            
            // Emit event
            this.scene.events.emit('boss-completed', {
                boss: event.boss,
                name: event.name,
                region: this.scene.currentRegion,
                isFinalBoss: this.bossKey === 'void_entity'
            });
            
            // Clear arena visuals
            this.clearArenaVisuals();
            
            // Hide health bar after a delay
            this.scene.time.delayedCall(2000, () => {
                if (this.bossHealthBar) {
                    this.bossHealthBar.hide();
                }
            });
            
            console.log(`Boss ${event.name} defeated!`);
        }
    }
    
    clearArenaVisuals() {
        if (this.arenaGraphics) {
            this.arenaGraphics.clear();
        }
    }
    
    // Get boss for external access
    getBoss() {
        return this.currentBoss;
    }
    
    // Check if a boss is currently active
    isActive() {
        return this.isBossActive;
    }
    
    // Check if boss is defeated for a specific region
    isRegionBossDefeated(region) {
        const bossKey = RegionBossMap[region];
        return bossKey ? this.defeatedBosses.has(bossKey) : true;
    }
    
    // Reset defeated bosses (for new game)
    resetDefeatedBosses() {
        this.defeatedBosses.clear();
        this.hasTriggeredSpawn = false;
    }
    
    cleanup() {
        // Destroy current boss
        if (this.currentBoss) {
            this.currentBoss.destroy();
            this.currentBoss = null;
        }
        
        // Clean up health bar
        if (this.bossHealthBar) {
            this.bossHealthBar.cleanup();
            this.bossHealthBar = null;
        }
        
        // Clear arena visuals
        this.clearArenaVisuals();
        
        if (this.arenaGraphics) {
            this.arenaGraphics.destroy();
            this.arenaGraphics = null;
        }
        
        // Destroy defeat notification if exists
        if (this.defeatNotification) {
            this.defeatNotification.destroy();
            this.defeatNotification = null;
        }
        
        this.isBossActive = false;
        this.bossDefeated = false;
        this.bossKey = null;
    }
    
    destroy() {
        this.cleanup();
    }
}
