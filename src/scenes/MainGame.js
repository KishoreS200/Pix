import Phaser from 'phaser';
import Player from '../entities/Player';
import InputManager from '../systems/InputManager';
import CameraManager from '../systems/CameraManager';
import CollisionManager from '../systems/CollisionManager';
import CombatManager from '../systems/CombatManager';
import EnemySpawner from '../systems/EnemySpawner';
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

        this.currentRegion = Regions.SILENT_VILLAGE;

        this.backgroundGrid = null;

        this.portals = [];
        this.portalColliders = [];
        this.isTransitioningRegion = false;

        this.regionText = null;
    }

    create() {
        console.log('MainGame scene started');
        this.inputManager = new InputManager(this);

        // Initialize collision manager
        this.collisionManager = new CollisionManager(this);
        
        // Initialize combat manager
        this.combatManager = new CombatManager(this);

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
        
        console.log('Player created:', this.player);
        console.log('Enemies spawned:', this.enemySpawner.enemies.length);
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
    }
}
