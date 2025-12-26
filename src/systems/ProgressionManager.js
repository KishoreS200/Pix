export default class ProgressionManager {
    constructor(scene) {
        this.scene = scene;
        
        // Base stats at level 1
        this.baseStats = {
            health: 100,
            damage: 15,
            speed: 200,
            knockbackForce: 250
        };
        
        // Per-level stat growth
        this.statGrowth = {
            health: 10,
            damage: 2,
            speed: 20,
            knockbackForce: 25
        };
        
        // Initialize or load from scene registry
        this.loadProgression();
    }
    
    loadProgression() {
        const registry = this.scene.game.registry;
        
        // Get values from registry or use defaults
        this.currentLevel = registry.get('playerLevel') || 1;
        this.currentXP = registry.get('playerXP') || 0;
        this.totalXP = registry.get('playerTotalXP') || 0;
        this.enemiesDefeated = registry.get('enemiesDefeated') || 0;
    }
    
    saveProgression() {
        const registry = this.scene.game.registry;
        registry.set('playerLevel', this.currentLevel);
        registry.set('playerXP', this.currentXP);
        registry.set('playerTotalXP', this.totalXP);
        registry.set('enemiesDefeated', this.enemiesDefeated);
    }
    
    addXP(amount) {
        this.currentXP += amount;
        this.totalXP += amount;
        
        // Check for level up (handle multiple level ups)
        let leveledUp = false;
        while (this.currentXP >= this.getXPForNextLevel()) {
            const xpNeeded = this.getXPForNextLevel();
            this.currentLevel++;
            this.currentXP -= xpNeeded;
            leveledUp = true;
        }
        
        this.saveProgression();
        
        if (leveledUp) {
            this.handleLevelUp();
        }
        
        return leveledUp;
    }
    
    handleLevelUp() {
        // Emit event for level up
        this.scene.events.emit('level-up', {
            level: this.currentLevel,
            stats: this.getCurrentStats()
        });
    }
    
    getCurrentLevel() {
        return this.currentLevel;
    }
    
    getCurrentXP() {
        return this.currentXP;
    }
    
    getTotalXP() {
        return this.totalXP;
    }
    
    getXPForNextLevel() {
        // Each level costs (level * 100) XP to reach from previous level
        return this.currentLevel * 100;
    }
    
    getXPForLevel(level) {
        // Calculate total cumulative XP needed to reach a specific level
        // Level 1 = 0 XP
        // Level 2 = 100 XP
        // Level 3 = 300 XP (100 + 200)
        // Level 4 = 600 XP (100 + 200 + 300)
        let totalXP = 0;
        for (let i = 1; i < level; i++) {
            totalXP += i * 100;
        }
        return totalXP;
    }
    
    getCurrentStats() {
        const levelBonus = this.currentLevel - 1; // Level 1 has 0 bonus
        
        return {
            health: this.baseStats.health + (this.statGrowth.health * levelBonus),
            damage: this.baseStats.damage + (this.statGrowth.damage * levelBonus),
            speed: this.baseStats.speed + (this.statGrowth.speed * levelBonus),
            knockbackForce: this.baseStats.knockbackForce + (this.statGrowth.knockbackForce * levelBonus)
        };
    }
    
    getStatsAtLevel(level) {
        const levelBonus = level - 1;
        
        return {
            health: this.baseStats.health + (this.statGrowth.health * levelBonus),
            damage: this.baseStats.damage + (this.statGrowth.damage * levelBonus),
            speed: this.baseStats.speed + (this.statGrowth.speed * levelBonus),
            knockbackForce: this.baseStats.knockbackForce + (this.statGrowth.knockbackForce * levelBonus)
        };
    }
    
    incrementEnemiesDefeated() {
        this.enemiesDefeated++;
        this.saveProgression();
    }
    
    getEnemiesDefeated() {
        return this.enemiesDefeated;
    }
    
    // Reset progression (for testing or new game)
    reset() {
        this.currentLevel = 1;
        this.currentXP = 0;
        this.totalXP = 0;
        this.enemiesDefeated = 0;
        this.saveProgression();
    }
}
