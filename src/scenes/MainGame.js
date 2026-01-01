import Phaser from 'phaser';
import Player from '../entities/Player';
import InputManager from '../systems/InputManager';
import CameraManager from '../systems/CameraManager';
import CollisionManager from '../systems/CollisionManager';
import CombatManager from '../systems/CombatManager';
import EnemySpawner from '../systems/EnemySpawner';
import LootManager from '../systems/LootManager';
import ProgressionManager from '../systems/ProgressionManager';
import ParticleManager from '../systems/ParticleManager';
import EffectsManager from '../systems/EffectsManager';
import AudioManager from '../systems/AudioManager';
import CombatIntensityManager from '../systems/CombatIntensityManager';
import BossArenaManager from '../systems/BossArenaManager';
import SettingsMenu from '../systems/SettingsMenu';
import InteractionManager from '../systems/InteractionManager';
import SafeZoneVisualizer from '../systems/SafeZoneVisualizer';
import FloatingText from '../utils/FloatingText';
import { LootConfig } from '../utils/LootConfig';
import { RegionConfig, Regions } from '../utils/RegionConfig';
import { RegionMusicMap } from '../utils/MusicConfig';

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
        this.particleManager = null;
        this.effectsManager = null;
        this.audioManager = null;
        this.combatIntensityManager = null;
        this.bossArenaManager = null;
        this.settingsMenu = null;
        this.interactionManager = null;
        this.safeZoneVisualizer = null;

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

        this._xpBarState = { progress: 0 };
        this._xpBarTween = null;
    }

    create() {
        console.log('MainGame scene started');
        this.inputManager = new InputManager(this);

        // Initialize audio manager
        this.audioManager = AudioManager.getInstance(this);

        // Initialize collision manager
        this.collisionManager = new CollisionManager(this);
        
        // Initialize combat manager
        this.combatManager = new CombatManager(this);

        // Initialize loot manager
        this.lootManager = new LootManager(this);

        // Initialize progression manager
        this.progressionManager = new ProgressionManager(this);

        // Initialize particle manager
        this.particleManager = new ParticleManager(this);

        // Initialize effects manager
        this.effectsManager = new EffectsManager(this);

        // Initialize settings menu
        this.settingsMenu = new SettingsMenu(this);
        
        // Initialize interaction manager
        this.interactionManager = new InteractionManager(this);
        
        // Initialize safe zone visualizer
        this.safeZoneVisualizer = new SafeZoneVisualizer(this);

        const startingRegion = RegionConfig[Regions.SILENT_VILLAGE];
        this.player = new Player(this, startingRegion.spawn.x, startingRegion.spawn.y);
        
        // Apply progression stats to player
        this.applyProgressionToPlayer();

        // Initialize enemy spawner
        this.enemySpawner = new EnemySpawner(this);
        this.enemySpawner.spawnWave(Regions.SILENT_VILLAGE);

        // Initialize combat intensity manager for dynamic music (after audioManager exists)
        this.combatIntensityManager = new CombatIntensityManager(this, this.audioManager);

        // Initialize boss arena manager (after other managers)
        this.bossArenaManager = new BossArenaManager(this);
        
        // Spawn NPCs for the starting region
        this.interactionManager.spawnNPCs(Regions.SILENT_VILLAGE);
        
        // Visualize safe zones
        this.safeZoneVisualizer.visualizeSafeZones(Regions.SILENT_VILLAGE);

        this.regionText = this.add.text(10, 10, '', {
            fontSize: '16px',
            fill: '#00ffff'
        }).setScrollFactor(0);

        this.add.text(10, 30, 'WASD/Arrows to Move | SPACE to Attack | E to Interact | ESC for Settings', {
            fontSize: '14px',
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

        // Preload/generate audio assets (procedural)
        if (this.audioManager) {
            this.audioManager.preloadAudio(this);

            const musicKey = RegionMusicMap[this.currentRegion];
            if (musicKey) {
                this.audioManager.playMusic(musicKey, true, 500);
            }

            this.events.once('shutdown', () => {
                this.audioManager.stopMusic(500);
            });
        }

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

        // Music intensity indicator - top center
        this.createMusicIntensityIndicator();
    }

    createMusicIntensityIndicator() {
        const { width } = this.cameras.main;
        const x = width / 2;
        const y = 10;
        
        // Container for the intensity indicator
        this.musicIntensityContainer = this.add.container(x, y).setScrollFactor(0).setDepth(100);
        
        // Background circle
        this.musicIntensityBg = this.add.graphics();
        this.musicIntensityContainer.add(this.musicIntensityBg);
        
        // Intensity bars (4 vertical bars)
        this.intensityBars = [];
        for (let i = 0; i < 4; i++) {
            const bar = this.add.graphics();
            this.intensityBars.push(bar);
            this.musicIntensityContainer.add(bar);
        }
        
        // Label
        this.musicIntensityLabel = this.add.text(0, 25, 'MUSIC', {
            fontSize: '10px',
            fill: '#00ffff',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0);
        
        this.musicIntensityContainer.add(this.musicIntensityLabel);
        
        // Set initial state
        this.updateMusicIntensityIndicator(0);
    }

    updateMusicIntensityIndicator(intensity) {
        if (!this.musicIntensityContainer || !this.intensityBars || !this.musicIntensityBg) return;
        
        const level = Math.floor(intensity / 25); // 0-4 levels
        
        // Colors based on intensity level
        let primaryColor, secondaryColor, bgColor;
        if (level < 2) {
            primaryColor = 0x00aaff; // Blue (Calm)
            secondaryColor = 0x0066aa;
            bgColor = 0x001122;
        } else if (level < 3) {
            primaryColor = 0xffff00; // Yellow (Alert)
            secondaryColor = 0xaaaa00;
            bgColor = 0x222200;
        } else {
            primaryColor = 0xff3300; // Red (Combat)
            secondaryColor = 0xaa2200;
            bgColor = 0x220000;
        }

        // Update background
        this.musicIntensityBg.clear();
        this.musicIntensityBg.fillStyle(bgColor, 0.8);
        this.musicIntensityBg.fillCircle(0, 0, 15);
        this.musicIntensityBg.lineStyle(2, secondaryColor, 0.6);
        this.musicIntensityBg.strokeCircle(0, 0, 15);

        // Update bars
        this.intensityBars.forEach((bar, index) => {
            bar.clear();
            const barHeight = 2 + (index * 3);
            const barY = -8 + (index * 5);
            const barX = -10 + (index * 7);

            if (index <= level) {
                // Active bar
                bar.fillStyle(primaryColor, 0.8);
                bar.fillRect(barX, barY, 4, barHeight);
                
                // Add glow effect for high intensity
                if (level >= 3) {
                    bar.lineStyle(1, 0xffaa00, 0.5);
                    bar.strokeRect(barX, barY, 4, barHeight);
                }
            } else {
                // Inactive bar
                bar.fillStyle(secondaryColor, 0.2);
                bar.fillRect(barX, barY, 4, barHeight);
            }
        });
        
        // Update label color
        if (this.musicIntensityLabel) {
            const colorStr = '#' + primaryColor.toString(16).padStart(6, '0');
            this.musicIntensityLabel.setColor(colorStr);
        }
    }

    setupEventListeners() {
        // Coin collection
        this.events.on('coin-collected', (amount) => {
            this.playerCoins += amount;
            this.updateCoinText();
            FloatingText.showCoins(this, this.player.x, this.player.y - 30, amount);
            
            if (this.audioManager) {
                this.audioManager.playSound('coin-pickup');
            }
        });

        // Potion collection
        this.events.on('potion-collected', (amount) => {
            // Heal player, capped at max health
            const newHealth = Math.min(this.player.maxHealth, this.player.health + amount);
            const actualHealing = newHealth - this.player.health;
            
            this.player.health = newHealth;
            this.updateHealthText();
            
            FloatingText.showHealing(this, this.player.x, this.player.y - 30, actualHealing);
            
            if (this.audioManager) {
                this.audioManager.playSound('potion-pickup');
            }
        });

        // Power-up collection
        this.events.on('powerup-collected', (damageBoost) => {
            this.player.activatePowerUp(
                LootConfig.powerUpSettings.damageBoostPercentage,
                LootConfig.powerUpSettings.durationMs
            );
            FloatingText.showPowerUp(this, this.player.x, this.player.y - 30);
            
            if (this.audioManager) {
                this.audioManager.playSound('powerup-pickup');
            }
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

        // Player damage (for updating health display and combat intensity)
        this.events.on('player-damage', (amount) => {
            this.updateHealthText();
            
            // Brief red flash on health text
            if (this.healthText) {
                this.tweens.add({
                    targets: this.healthText,
                    scaleX: 1.3,
                    scaleY: 1.3,
                    duration: 80,
                    yoyo: true,
                    ease: 'Back.easeOut'
                });
            }
            
            // Notify combat intensity manager
            if (this.combatIntensityManager) {
                this.combatIntensityManager.onPlayerHit();
            }
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
                
                // Notify combat intensity manager
                if (this.combatIntensityManager) {
                    this.combatIntensityManager.onEnemyDefeated(data.enemy);
                }
            }
        });
        
        // Level up event
        this.events.on('level-up', (data) => {
            // Show level up floating text
            FloatingText.showLevelUp(this, this.player.x, this.player.y - 80, data.level);
            
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

        // Game over (player death)
        this.events.on('player-death', () => {
            if (this.audioManager) {
                this.audioManager.playSound('game-over');
                this.audioManager.stopMusic(800);
            }
        });

        // Boss events
        this.events.on('boss-spawned', (data) => {
            console.log(`Boss spawned: ${data.name} in ${data.region}`);
            
            // Pause regular combat intensity during boss fight
            if (this.combatIntensityManager) {
                this.combatIntensityManager.setBossActive(true);
            }
        });

        this.events.on('boss-defeated', (data) => {
            console.log(`Boss defeated: ${data.name}`);
            
            // Resume normal combat intensity
            if (this.combatIntensityManager) {
                this.combatIntensityManager.setBossActive(false);
            }
        });

        this.events.on('boss-completed', (data) => {
            console.log(`Boss encounter completed: ${data.region}`);
            
            // If final boss was defeated, show game complete message
            if (data.isFinalBoss) {
                this.showGameCompleteMessage();
            }
        });
    }

    showGameCompleteMessage() {
        const { width, height } = this.cameras.main;
        
        // Dark overlay
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.9);
        overlay.setScrollFactor(0);
        overlay.setDepth(500);
        
        // Victory text
        const text = this.add.text(width / 2, height / 2, 'GAME COMPLETE!', {
            fontSize: '64px',
            fontFamily: 'monospace',
            color: '#FFD700',
            fontStyle: 'bold'
        });
        text.setOrigin(0.5);
        text.setScrollFactor(0);
        text.setDepth(501);
        text.setShadow(4, 4, '#000000', 8);
        
        // Subtitle
        const subtitle = this.add.text(width / 2, height / 2 + 80, 'You have conquered the Void!', {
            fontSize: '24px',
            fontFamily: 'monospace',
            color: '#ffffff'
        });
        subtitle.setOrigin(0.5);
        subtitle.setScrollFactor(0);
        subtitle.setDepth(501);
        
        // Play victory fanfare
        if (this.audioManager) {
            this.audioManager.playMusic('music-boss-defeated', false, 500);
        }
    }

    updateCoinText() {
        if (this.coinText) {
            this.coinText.setText(`Coins: ${this.playerCoins}`);
            
            // Pulse animation on coin gain
            this.tweens.add({
                targets: this.coinText,
                scaleX: 1.2,
                scaleY: 1.2,
                duration: 100,
                yoyo: true,
                ease: 'Back.easeOut'
            });
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
        const targetProgress = Math.min(1, currentXP / xpForNextLevel);
        
        // Bar dimensions
        const barWidth = 150;
        const barHeight = 8;
        const x = this.cameras.main.width - 10 - barWidth;
        const y = 168; // Positioned below XP text
        
        // Clear previous graphics
        this.xpBarBg.clear();
        
        // Draw background
        this.xpBarBg.fillStyle(0x333333, 0.8);
        this.xpBarBg.fillRect(x, y, barWidth, barHeight);
        this.xpBarBg.lineStyle(2, 0x00ffff, 0.5);
        this.xpBarBg.strokeRect(x, y, barWidth, barHeight);
        
        // Animate fill progress smoothly
        if (this._xpBarTween) {
            this._xpBarTween.stop();
        }
        
        this._xpBarTween = this.tweens.add({
            targets: this._xpBarState,
            progress: targetProgress,
            duration: 300,
            ease: 'Power2',
            onUpdate: () => {
                const progress = this._xpBarState.progress;
                
                // Clear and redraw
                this.xpBar.clear();
                
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
                
                // Glow effect on near completion
                if (progress > 0.9) {
                    this.xpBar.lineStyle(2, 0xFFD700, (progress - 0.9) * 5);
                    this.xpBar.strokeRect(x - 1, y - 1, barWidth + 2, barHeight + 2);
                }
            }
        });
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

        // Region-specific music
        if (this.audioManager) {
            const musicKey = RegionMusicMap[regionName];
            if (musicKey) {
                this.audioManager.playMusic(musicKey, true, 500);
            } else {
                this.audioManager.stopMusic(500);
            }
        }

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
        
        // Spawn NPCs for the new region
        if (this.interactionManager) {
            this.interactionManager.spawnNPCs(regionName);
        }
        
        // Visualize safe zones for new region
        if (this.safeZoneVisualizer) {
            this.safeZoneVisualizer.visualizeSafeZones(regionName);
        }

        this._rebuildPortals();

        if (this.regionText) {
            this.regionText.setText(`Region: ${regionName}`);
        }
    }

    update() {
        // Update settings menu if it exists and is open
        if (this.settingsMenu) {
            this.settingsMenu.update();
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
            
            // Update boss arena manager (checks for boss spawn proximity)
            if (this.bossArenaManager) {
                this.bossArenaManager.update(this.player, delta);
            }
            
            // Update interaction manager (check for NPC interactions)
            if (this.interactionManager) {
                this.interactionManager.update(this.player);
            }
        } else {
            this.player.setVelocity(0, 0);
        }

        this.cameraManager.update(time, delta);

        // Update audio intensity system
        if (this.audioManager) {
            this.audioManager.update(time, delta);
        }
        
        // Update combat intensity manager
        if (this.combatIntensityManager) {
            this.combatIntensityManager.update(time, delta);
        }
        
        // Update music intensity indicator
        if (this.musicIntensityContainer && this.audioManager) {
            const currentIntensity = this.audioManager.getCombatIntensity();
            this.updateMusicIntensityIndicator(currentIntensity);
        }
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
        
        if (this.particleManager) {
            this.particleManager.destroy();
        }
        
        if (this.effectsManager) {
            this.effectsManager.destroy();
        }
        
        if (this.combatIntensityManager) {
            this.combatIntensityManager.destroy();
        }
        
        if (this.bossArenaManager) {
            this.bossArenaManager.destroy();
            this.bossArenaManager = null;
        }
        
        if (this.settingsMenu) {
            this.settingsMenu.destroy();
        }
        
        if (this.interactionManager) {
            this.interactionManager.shutdown();
        }
        
        if (this.safeZoneVisualizer) {
            this.safeZoneVisualizer.destroy();
        }
        
        // Clean up XP bar graphics
        if (this.xpBar) {
            this.xpBar.destroy();
        }
        
        if (this.xpBarBg) {
            this.xpBarBg.destroy();
        }

        if (this.musicIntensityContainer) {
            this.musicIntensityContainer.destroy();
        }
    }
}
