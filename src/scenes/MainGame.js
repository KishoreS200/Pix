import Phaser from 'phaser';
import Player from '../entities/Player';
import InputManager from '../systems/InputManager';
import CameraManager from '../systems/CameraManager';
import CollisionManager from '../systems/CollisionManager';
import CombatManager from '../systems/CombatManager';
import EnemySpawner from '../systems/EnemySpawner';
import LootManager from '../systems/LootManager';
import ProgressionManager from '../systems/ProgressionManager';
import FloatingText from '../utils/FloatingText';
import { LootConfig } from '../utils/LootConfig';
import { RegionConfig, Regions } from '../utils/RegionConfig';

export default class MainGame extends Phaser.Scene {
    constructor() {
        super('MainGame');

        this.inputManager = null;
        this.player = null;

        this.cameraManager = null;
        this.collisionManager = null;
        this.combatManager = null;
        this.enemySpawner = null;
        this.lootManager = null;
        this.progressionManager = null;

        this.currentRegion = Regions.SILENT_VILLAGE;
        
        // Player state tracking
        this.playerCoins = 0;
        this.playerHealth = 100;
        this.powerUpActive = false;
        this.powerUpEndTime = 0;

        this.backgroundGrid = null;

        this.portals = [];
        this.portalColliders = [];
        this.isTransitioningRegion = false;

        this.regionText = null;
        this.coinText = null;
        this.healthText = null;
        this.powerUpText = null;
        this.levelText = null;
        this.xpText = null;
        this.xpBar = null;
        this.xpBarBg = null;
    }

    create() {
        console.log('MainGame scene started');
        this.inputManager = new InputManager(this);

        // Initialize collision manager
        this.collisionManager = new CollisionManager(this);
        
        // Initialize combat manager
        this.combatManager = new CombatManager(this);

        // Initialize loot manager
        this.lootManager = new LootManager(this);

        // Initialize progression manager
        this.progressionManager = new ProgressionManager(this);

        const startingRegion = RegionConfig[Regions.SILENT_VILLAGE];
        this.player = new Player(this, startingRegion.spawn.x, startingRegion.spawn.y);
        
        // Apply progression stats to player
        this.applyProgressionToPlayer();

        // Initialize enemy spawner
        this.enemySpawner = new EnemySpawner(this);
        this.enemySpawner.spawnWave(Regions.SILENT_VILLAGE);

        this.regionText = this.add.text(10, 10, '', {
            fontSize: '16px',
            fill: '#00ffff'
        }).setScrollFactor(0);

        this.add.text(10, 30, 'WASD/Arrows to Move | SPACE to Attack', {
            fontSize: '16px',
            fill: '#00ffff'
        }).setScrollFactor(0);

        // Create HUD elements
        this.createHUD();
        
        // Initialize level and XP display
        this.updateLevelText();
        this.updateXPText();
        this.updateXPBar();

        // Set up event listeners
        this.setupEventListeners();

        this.events.on('regionchanged', this.onRegionChanged, this);

        this.cameraManager = new CameraManager();
        this.cameraManager.init(this, this.player, startingRegion, {
            regionName: startingRegion.name,
            lerpFactor: 0.15,
            roundPixels: true
        });

        this.cameras.main.setZoom(1);

        // Load initial tilemap
        this.collisionManager.loadTilemap(startingRegion.name);
        this.collisionManager.setupCollisions(this.player, this.enemySpawner.enemies);
        this.collisionManager.setupEnemyCollisions(this.player, this.enemySpawner.enemies);
        this.collisionManager.setupLootCollisions(this.player, this.lootManager);
        
        console.log('Player created:', this.player);
        console.log('Enemies spawned:', this.enemySpawner.enemies.length);
    }

    createHUD() {
        // Coin counter - top right
        this.coinText = this.add.text(this.cameras.main.width - 10, 10, 'Coins: 0', {
            fontSize: '18px',
            fill: '#00ffff'
        }).setScrollFactor(0).setOrigin(1, 0);

        // Health display - below coin counter
        this.healthText = this.add.text(this.cameras.main.width - 10, 40, 'HP: 100/100', {
            fontSize: '18px',
            fill: '#00ff00'
        }).setScrollFactor(0).setOrigin(1, 0);

        // Power-up timer - below health
        this.powerUpText = this.add.text(this.cameras.main.width - 10, 70, '', {
            fontSize: '18px',
            fill: '#FFD700'
        }).setScrollFactor(0).setOrigin(1, 0);
        this.powerUpText.setVisible(false);
        
        // Level display
        this.levelText = this.add.text(this.cameras.main.width - 10, 100, 'Level: 1', {
            fontSize: '18px',
            fill: '#00ffff',
            fontStyle: 'bold'
        }).setScrollFactor(0).setOrigin(1, 0);
        
        // XP text
        this.xpText = this.add.text(this.cameras.main.width - 10, 125, 'XP: 0/100', {
            fontSize: '16px',
            fill: '#FFD700'
        }).setScrollFactor(0).setOrigin(1, 0);
        
        // XP bar background
        this.xpBarBg = this.add.graphics()
            .setScrollFactor(0)
            .setDepth(10);
        
        // XP bar fill
        this.xpBar = this.add.graphics()
            .setScrollFactor(0)
            .setDepth(11);
        
        this.updateXPBar();
    }

    setupEventListeners() {
        // Coin collection
        this.events.on('coin-collected', (amount) => {
            this.playerCoins += amount;
            this.updateCoinText();
            FloatingText.showCoins(this, this.player.x, this.player.y - 30, amount);
        });

        // Potion collection
        this.events.on('potion-collected', (amount) => {
            // Heal player, capped at max health
            const newHealth = Math.min(this.player.maxHealth, this.player.health + amount);
            const actualHealing = newHealth - this.player.health;
            
            this.player.health = newHealth;
            this.updateHealthText();
            
            FloatingText.showHealing(this, this.player.x, this.player.y - 30, actualHealing);
        });

        // Power-up collection
        this.events.on('powerup-collected', (damageBoost) => {
            this.player.activatePowerUp(
                LootConfig.powerUpSettings.damageBoostPercentage,
                LootConfig.powerUpSettings.durationMs
            );
            FloatingText.showPowerUp(this, this.player.x, this.player.y - 30);
        });

        // Power-up activation
        this.events.on('powerup-activated', (damageBoost, durationMs) => {
            this.powerUpActive = true;
            this.powerUpEndTime = this.time.now + durationMs;
            this.powerUpText.setVisible(true);
            this.updatePowerUpText(durationMs);
        });

        // Power-up updates
        this.events.on('powerup-update', (remainingTime) => {
            this.updatePowerUpText(remainingTime);
        });

        // Power-up ended
        this.events.on('powerup-ended', () => {
            this.powerUpActive = false;
            this.powerUpText.setVisible(false);
        });

        // Player damage (for updating health display)
        this.events.on('player-damage', (amount) => {
            this.updateHealthText();
        });
        
        // Enemy defeated - grant XP
        this.events.on('enemy-defeated', (data) => {
            if (this.progressionManager) {
                this.progressionManager.incrementEnemiesDefeated();
                const leveledUp = this.progressionManager.addXP(data.xpAmount);
                
                // Show floating XP text
                FloatingText.showXP(this, data.enemy.x, data.enemy.y - 50, data.xpAmount);
                
                // Update HUD
                this.updateLevelText();
                this.updateXPText();
                this.updateXPBar();
            }
        });
        
        // Level up event
        this.events.on('level-up', (data) => {
            // Show level up floating text
            FloatingText.showLevelUp(this, this.player.x, this.player.y - 80, data.level);
            
            // Screen flash effect
            this.cameras.main.flash(500, 255, 255, 200);
            
            // Apply new stats to player
            this.applyProgressionToPlayer();
            
            // Heal player to full
            this.player.healToFull();
            
            // Update HUD
            this.updateHealthText();
            this.updateLevelText();
            this.updateXPText();
            this.updateXPBar();
            
            console.log(`Level up! Player is now level ${data.level}`);
        });
        
        // Player healed event
        this.events.on('player-healed', (newHealth) => {
            this.updateHealthText();
        });
    }

    updateCoinText() {
        if (this.coinText) {
            this.coinText.setText(`Coins: ${this.playerCoins}`);
        }
    }

    updateHealthText() {
        if (this.healthText) {
            this.healthText.setText(`HP: ${this.player.health}/${this.player.maxHealth}`);
            
            // Change color based on health percentage
            const healthPercent = this.player.health / this.player.maxHealth;
            if (healthPercent <= 0.3) {
                this.healthText.setFill('#ff0000'); // Red for low health
            } else if (healthPercent <= 0.6) {
                this.healthText.setFill('#ffa500'); // Orange for medium health
            } else {
                this.healthText.setFill('#00ff00'); // Green for high health
            }
        }
    }

    updatePowerUpText(remainingTime) {
        if (this.powerUpText) {
            const seconds = (remainingTime / 1000).toFixed(1);
            this.powerUpText.setText(`BOOST: ${seconds}s`);
        }
    }
    
    updateLevelText() {
        if (this.levelText && this.progressionManager) {
            this.levelText.setText(`Level: ${this.progressionManager.getCurrentLevel()}`);
        }
    }
    
    updateXPText() {
        if (this.xpText && this.progressionManager) {
            const currentXP = this.progressionManager.getCurrentXP();
            const xpForNextLevel = this.progressionManager.getXPForNextLevel();
            this.xpText.setText(`XP: ${currentXP}/${xpForNextLevel}`);
        }
    }
    
    updateXPBar() {
        if (!this.xpBar || !this.xpBarBg || !this.progressionManager) return;
        
        const currentXP = this.progressionManager.getCurrentXP();
        const xpForNextLevel = this.progressionManager.getXPForNextLevel();
        const progress = Math.min(1, currentXP / xpForNextLevel);
        
        // Bar dimensions
        const barWidth = 150;
        const barHeight = 8;
        const x = this.cameras.main.width - 10 - barWidth;
        const y = 168; // Positioned below XP text
        
        // Clear previous graphics
        this.xpBar.clear();
        this.xpBarBg.clear();
        
        // Draw background
        this.xpBarBg.fillStyle(0x333333, 0.8);
        this.xpBarBg.fillRect(x, y, barWidth, barHeight);
        this.xpBarBg.lineStyle(2, 0x00ffff, 0.5);
        this.xpBarBg.strokeRect(x, y, barWidth, barHeight);
        
        // Draw fill (gradient effect with multiple rectangles)
        if (progress > 0) {
            const fillWidth = barWidth * progress;
            
            // Cyan to green gradient
            this.xpBar.fillStyle(0x00ffff, 0.8);
            this.xpBar.fillRect(x, y, fillWidth * 0.5, barHeight);
            
            this.xpBar.fillStyle(0x00ffaa, 0.8);
            this.xpBar.fillRect(x + fillWidth * 0.5, y, fillWidth * 0.3, barHeight);
            
            this.xpBar.fillStyle(0x00ff00, 0.8);
            this.xpBar.fillRect(x + fillWidth * 0.8, y, fillWidth * 0.2, barHeight);
        }
    }
    
    applyProgressionToPlayer() {
        if (this.progressionManager && this.player) {
            const stats = this.progressionManager.getCurrentStats();
            this.player.applyStatBases(stats);
            console.log('Applied progression stats:', stats);
        }
    }

    onRegionChanged(regionName, bounds) {
        this.currentRegion = regionName;

        if (this.backgroundGrid) {
            this.backgroundGrid.destroy();
        }

        this.backgroundGrid = this.add
            .grid(bounds.minX, bounds.minY, bounds.width, bounds.height, 32, 32, 0x050505, 1, 0x111111, 1)
            .setOrigin(0)
            .setDepth(-10);

        // Load new tilemap for the region
        if (this.collisionManager) {
            this.collisionManager.loadTilemap(regionName);
            this.collisionManager.setupCollisions(this.player, this.enemySpawner ? this.enemySpawner.enemies : null);
            
            if (this.enemySpawner) {
                this.enemySpawner.spawnWave(regionName);
            }
        }

        this._rebuildPortals();

        if (this.regionText) {
            this.regionText.setText(`Region: ${regionName}`);
        }
    }

    _rebuildPortals() {
        this.portalColliders.forEach((collider) => collider.destroy());
        this.portalColliders = [];

        this.portals.forEach((portal) => portal.destroy());
        this.portals = [];

        const region = RegionConfig[this.currentRegion];
        if (!region?.portals?.length) return;

        region.portals.forEach((portalConfig) => {
            const zone = this.add.zone(
                portalConfig.rect.x + portalConfig.rect.width / 2,
                portalConfig.rect.y + portalConfig.rect.height / 2,
                portalConfig.rect.width,
                portalConfig.rect.height
            );

            this.physics.add.existing(zone, true);

            const collider = this.physics.add.overlap(this.player, zone, () => {
                this._handlePortalOverlap(portalConfig);
            });

            this.portalColliders.push(collider);
            this.portals.push(zone);
        });
    }

    _handlePortalOverlap(portalConfig) {
        if (this.isTransitioningRegion) return;

        const nextRegion = RegionConfig[portalConfig.toRegion];
        if (!nextRegion) {
            console.log(`[Region Transition] Unknown region: ${portalConfig.toRegion}`);
            return;
        }

        console.log(`[Region Transition] ${this.currentRegion} -> ${portalConfig.toRegion}`);

        this.isTransitioningRegion = true;
        this.player.setVelocity(0, 0);

        this.cameraManager
            .transitionToRegion(portalConfig.toRegion, { ...nextRegion, spawn: portalConfig.spawn }, 500)
            .then(() => {
                this.isTransitioningRegion = false;
            });
    }

    update(time, delta) {
        if (!this.isTransitioningRegion) {
            const movementVector = this.inputManager.getMovementVector();
            this.player.update(movementVector);

            if (this.enemySpawner) {
                this.enemySpawner.update(this.player);
            }

            if (this.inputManager.isAttackJustPressed()) {
                this.player.attack();
            }

            if (this.collisionManager) {
                this.collisionManager.update(this.player);
            }

            // Update power-up state
            this.player.updatePowerUp(time);
        } else {
            this.player.setVelocity(0, 0);
        }

        this.cameraManager.update(time, delta);
    }

    shutdown() {
        if (this.combatManager) {
            this.combatManager.cleanup();
        }
        
        if (this.collisionManager) {
            this.collisionManager.destroy();
        }
        
        if (this.lootManager) {
            this.lootManager.destroy();
        }
        
        // Clean up XP bar graphics
        if (this.xpBar) {
            this.xpBar.destroy();
        }
        
        if (this.xpBarBg) {
            this.xpBarBg.destroy();
        }
    }
}
