import Phaser from 'phaser';
import Player from '../entities/Player';
import InputManager from '../systems/InputManager';
import CameraManager from '../systems/CameraManager';
import CollisionManager from '../systems/CollisionManager';
import CombatManager from '../systems/CombatManager';
import EnemySpawner from '../systems/EnemySpawner';
import LootManager from '../systems/LootManager';
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

        const startingRegion = RegionConfig[Regions.SILENT_VILLAGE];
        this.player = new Player(this, startingRegion.spawn.x, startingRegion.spawn.y);

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
            // Heal player, capped at 100
            const newHealth = Math.min(100, this.player.health + amount);
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
    }

    updateCoinText() {
        if (this.coinText) {
            this.coinText.setText(`Coins: ${this.playerCoins}`);
        }
    }

    updateHealthText() {
        if (this.healthText) {
            this.healthText.setText(`HP: ${this.player.health}/100`);
            
            // Change color based on health
            if (this.player.health <= 30) {
                this.healthText.setFill('#ff0000'); // Red for low health
            } else if (this.player.health <= 60) {
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
    }
}
