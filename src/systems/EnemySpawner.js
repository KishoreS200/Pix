import GlitchFauna from '../entities/GlitchFauna';
import CorruptedHuman from '../entities/CorruptedHuman';
import SentinelMachine from '../entities/SentinelMachine';
import { Regions } from '../utils/RegionConfig';

export default class EnemySpawner {
    constructor(scene) {
        this.scene = scene;
        this.enemies = scene.physics.add.group();
        this.spawnPositions = {
            [Regions.SILENT_VILLAGE]: [
                { type: 'corrupted_human', x: 300, y: 400 },
                { type: 'corrupted_human', x: 1300, y: 800 }
            ],
            [Regions.FORGOTTEN_FOREST]: [
                { type: 'glitch_fauna', x: 400, y: 300, subType: 'glitch_bug' },
                { type: 'glitch_fauna', x: 800, y: 600, subType: 'glitch_bug' },
                { type: 'glitch_fauna', x: 1200, y: 400, subType: 'glitch_bug' },
                { type: 'glitch_fauna', x: 500, y: 1200, subType: 'glitch_bug' },
                { type: 'glitch_fauna', x: 1500, y: 1000, subType: 'corrupted_wolf' },
                { type: 'glitch_fauna', x: 200, y: 1500, subType: 'corrupted_wolf' }
            ],
            [Regions.CRYSTAL_MINES]: [
                { type: 'sentinel_machine', x: 300, y: 300, subType: 'turret' },
                { type: 'sentinel_machine', x: 1500, y: 300, subType: 'turret' },
                { type: 'sentinel_machine', x: 900, y: 1500, subType: 'turret' },
                { type: 'sentinel_machine', x: 600, y: 800, subType: 'patrol_drone' },
                { type: 'sentinel_machine', x: 1200, y: 1200, subType: 'patrol_drone' }
            ],
            [Regions.BROKEN_CITY]: [
                { type: 'corrupted_human', x: 500, y: 500, subType: 'city_guard' },
                { type: 'corrupted_human', x: 1500, y: 500, subType: 'city_guard' },
                { type: 'corrupted_human', x: 1000, y: 1500, subType: 'city_guard' },
                { type: 'sentinel_machine', x: 400, y: 1000, subType: 'patrol_drone' },
                { type: 'sentinel_machine', x: 1600, y: 1000, subType: 'patrol_drone' },
                { type: 'sentinel_machine', x: 200, y: 1800, subType: 'patrol_drone' },
                { type: 'sentinel_machine', x: 1800, y: 1800, subType: 'patrol_drone' },
                { type: 'sentinel_machine', x: 1000, y: 1000, subType: 'turret' },
                { type: 'sentinel_machine', x: 1000, y: 200, subType: 'turret' }
            ],
            [Regions.THE_CORE]: []
        };
    }

    spawnEnemy(type, x, y, subType) {
        let enemy;
        switch (type) {
            case 'glitch_fauna':
                enemy = new GlitchFauna(this.scene, x, y, subType);
                break;
            case 'corrupted_human':
                enemy = new CorruptedHuman(this.scene, x, y, subType);
                break;
            case 'sentinel_machine':
                enemy = new SentinelMachine(this.scene, x, y, subType);
                break;
            default:
                console.warn(`Unknown enemy type: ${type}`);
                return null;
        }

        if (enemy) {
            // Scale enemy based on player level (optional difficulty scaling)
            this.scaleEnemyByPlayerLevel(enemy);
            
            this.enemies.add(enemy);
        }
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
            this.spawnEnemy(spawn.type, spawn.x, spawn.y, spawn.subType);
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
