import Phaser from 'phaser';

export default class CollisionManager {
    constructor(scene) {
        this.scene = scene;
        this.tilemap = null;
        this.solidLayer = null;
        this.hazardLayer = null;
        this.slowLayer = null;
        this.hazardTimer = null;
        this.currentRegionName = null;
        this.playerSpeedModifier = 1.0;
    }

    loadTilemap(regionName) {
        this.currentRegionName = regionName;
        const key = this.getTilemapKey(regionName);
        
        // Clean up previous tilemap
        if (this.tilemap) {
            if (this.solidLayer) this.solidLayer.destroy();
            if (this.hazardLayer) this.hazardLayer.destroy();
            if (this.slowLayer) this.slowLayer.destroy();
            this.tilemap.destroy();
        }

        // Create new tilemap
        this.tilemap = this.scene.add.tilemap(key);
        const tileset = this.tilemap.addTilesetImage('tileset', 'tiles');

        // Create layers
        this.solidLayer = this.tilemap.createLayer('terrain', tileset, 0, 0);
        this.hazardLayer = this.tilemap.createLayer('hazard', tileset, 0, 0);
        this.slowLayer = this.tilemap.createLayer('slow', tileset, 0, 0);

        // Configure collision
        if (this.solidLayer && this.tilemap.getLayer('collision')) {
            const collisionData = this.tilemap.getLayer('collision').data;
            const solidTileIds = [];
            
            // Find all tile IDs that are marked as solid (value = 1)
            for (let row = 0; row < collisionData.length; row++) {
                for (let col = 0; col < collisionData[row].length; col++) {
                    if (collisionData[row][col] === 1) {
                        solidTileIds.push(collisionData[row][col]);
                    }
                }
            }
            
            if (solidTileIds.length > 0) {
                this.solidLayer.setCollision(solidTileIds);
            }
        }

        return this.tilemap;
    }

    getTilemapKey(regionName) {
        const keyMap = {
            'Silent Village': 'silent-village',
            'Forgotten Forest': 'forgotten-forest',
            'Crystal Mines': 'crystal-mines',
            'Broken City': 'broken-city',
            'The Core': 'the-core'
        };
        return keyMap[regionName];
    }

    setupCollisions(player, enemies) {
        // Solid collision
        if (this.solidLayer) {
            this.scene.physics.add.collider(player, this.solidLayer);
            if (enemies) {
                this.scene.physics.add.collider(enemies, this.solidLayer);
            }
        }

        // Setup overlap checks for hazard and slow tiles
        this.setupHazardOverlap(player);
        this.setupSlowOverlap(player);
    }

    setupEnemyCollisions(player, enemies) {
        // Enemy collisions are now handled by enemy attack logic in Enemy.js
        // Just set up collision to prevent enemies from overlapping with player physically
        this.scene.physics.add.collider(player, enemies);
    }

    setupHazardOverlap(player) {
        this.scene.physics.add.overlap(player, this.hazardLayer, (player) => {
            this.handleHazardOverlap(player);
        }, null, this);
    }

    setupSlowOverlap(player) {
        this.scene.physics.add.overlap(player, this.slowLayer, (player) => {
            this.handleSlowOverlap(player);
        }, null, this);
    }

    handleHazardOverlap(player) {
        if (!this.hazardTimer) {
            this.hazardTimer = this.scene.time.addEvent({
                delay: 100,
                callback: () => this.applyHazardDamage(player),
                callbackScope: this,
                loop: true
            });
        }
    }

    applyHazardDamage(player) {
        const isOverHazard = this.hazardLayer && this.tilemap.getLayer('hazard') && 
                           this.hazardLayer.hasTileAtWorldXY(player.x, player.y);
        if (isOverHazard) {
            player.health = Math.max(0, player.health - 10);
            console.log(`Hazard damage! Health: ${player.health}`);
            
            if (player.health <= 0) {
                this.scene.events.emit('player-death');
            }
        }
    }

    handleSlowOverlap(player) {
        this.playerSpeedModifier = 0.5; // 50% speed reduction
    }

    update(player) {
        // Check if still over slow tiles
        const isOverSlow = this.slowLayer && this.tilemap.getLayer('slow') && 
                          this.slowLayer.hasTileAtWorldXY(player.x, player.y);
        
        if (!isOverSlow) {
            this.playerSpeedModifier = 1.0;
        }

        // Check if still over hazard tiles
        const isOverHazard = this.hazardLayer && this.tilemap.getLayer('hazard') && 
                            this.hazardLayer.hasTileAtWorldXY(player.x, player.y);

        if (this.hazardTimer && !isOverHazard) {
            this.hazardTimer.remove();
            this.hazardTimer = null;
        }
    }

    destroy() {
        if (this.hazardTimer) {
            this.hazardTimer.remove();
            this.hazardTimer = null;
        }
    }

    getPlayerSpeedModifier() {
        return this.playerSpeedModifier;
    }
}