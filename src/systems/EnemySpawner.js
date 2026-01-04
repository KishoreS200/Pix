import ConfiguredEnemy from '../entities/ConfiguredEnemy';
import { EnemySpawnsByRegion, EnemyTypeConfig } from '../utils/EnemyConfig';
import { isInSafeZone } from '../utils/NPCConfig';

export default class EnemySpawner {
    constructor(scene) {
        this.scene = scene;
        this.enemies = scene.physics.add.group();
        this.spawnPositions = EnemySpawnsByRegion;
    }

    spawnEnemy(enemyKey, x, y) {
        if (!EnemyTypeConfig[enemyKey]) {
            console.warn(`Unknown enemy key: ${enemyKey}`);
            return null;
        }

        const enemy = new ConfiguredEnemy(this.scene, x, y, enemyKey);

        // Scale enemy based on player level (optional difficulty scaling)
        this.scaleEnemyByPlayerLevel(enemy);

        this.enemies.add(enemy);
        return enemy;
    }
    
    scaleEnemyByPlayerLevel(enemy) {
        if (!this.scene.progressionManager) return;
        
        const playerLevel = this.scene.progressionManager.getCurrentLevel();
        
        // Only scale if player is above level 1
        if (playerLevel <= 1) return;
        
        const levelBonus = playerLevel - 1;
        
        // Store base values before scaling
        if (!enemy.baseValues) {
            enemy.baseValues = {
                health: enemy.health,
                damage: enemy.damage,
                speed: enemy.speed,
                xpReward: enemy.xpReward
            };
        }
        
        // Apply scaling
        // Enemy health: +5 per player level
        enemy.health = enemy.baseValues.health + (levelBonus * 5);
        
        // Enemy damage: +1 per player level
        enemy.damage = enemy.baseValues.damage + levelBonus;
        
        // Enemy speed: +10 per player level (but cap at reasonable max)
        enemy.speed = Math.min(enemy.baseValues.speed + (levelBonus * 10), 300);
        
        // XP reward scales slightly with player level (base + level bonus)
        enemy.xpReward = Math.floor(enemy.baseValues.xpReward + (levelBonus * 0.5));
    }

    spawnWave(region) {
        this.clearEnemies();
        const spawns = this.spawnPositions[region] || [];
        spawns.forEach(spawn => {
            // Check if spawn position is in a safe zone
            if (!isInSafeZone(region, spawn.x, spawn.y)) {
                this.spawnEnemy(spawn.key, spawn.x, spawn.y);
            } else {
                console.log(`Skipping enemy spawn at (${spawn.x}, ${spawn.y}) - in safe zone`);
            }
        });
    }

    removeEnemy(enemy) {
        this.enemies.remove(enemy, true, true);
    }

    getEnemies() {
        return this.enemies.getChildren();
    }

    clearEnemies() {
        this.enemies.clear(true, true);
    }

    update(player) {
        this.getEnemies().forEach(enemy => {
            enemy.update(player);
        });
    }
}
