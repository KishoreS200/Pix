import Phaser from 'phaser';

export default class CombatIntensityManager {
    constructor(scene, audioManager) {
        this.scene = scene;
        this.audioManager = audioManager;
        
        // Intensity tracking
        this.currentIntensity = 0;
        this.targetIntensity = 0;
        this.lastIntensityChange = 0;
        this.debounceDelay = 500; // 500ms debounce
        
        // Combat state tracking
        this.playerLastHitTime = 0;
        this.nearbyEnemies = [];
        this.combatEngaged = false;
        
        // Intensity thresholds
        this.thresholds = {
            PEACEFUL: 0,      // 0-20: No enemies nearby
            ALERT: 20,        // 20-40: Enemies nearby but not engaged
            LIGHT_COMBAT: 40, // 40-60: Light combat
            HEAVY_COMBAT: 60, // 60-80: Heavy combat
            BOSS_COMBAT: 80   // 80-100: Boss-level combat
        };
        
        // Settings
        this.dynamicMusicEnabled = true;
        this.intensitySensitivity = 75; // 0-100, higher = more responsive
        
        // Cache for performance
        this.lastCalculation = 0;
        this.calculationInterval = 100; // Calculate every 100ms
        
        this._loadSettings();
    }
    
    _loadSettings() {
        if (typeof localStorage === 'undefined') return;
        
        try {
            const enabled = localStorage.getItem('dynamic_music_enabled');
            const sensitivity = localStorage.getItem('music_intensity_sensitivity');
            
            if (enabled !== null) this.dynamicMusicEnabled = enabled === 'true';
            if (sensitivity !== null) this.intensitySensitivity = parseInt(sensitivity, 10);
        } catch (error) {
            console.warn('[CombatIntensityManager] Failed to load settings:', error);
        }
    }
    
    saveSettings() {
        if (typeof localStorage === 'undefined') return;
        
        try {
            localStorage.setItem('dynamic_music_enabled', String(this.dynamicMusicEnabled));
            localStorage.setItem('music_intensity_sensitivity', String(this.intensitySensitivity));
        } catch (error) {
            console.warn('[CombatIntensityManager] Failed to save settings:', error);
        }
    }
    
    setDynamicMusicEnabled(enabled) {
        this.dynamicMusicEnabled = enabled;
        this.saveSettings();
        
        if (!enabled) {
            this.setTargetIntensity(0);
        }
    }
    
    setIntensitySensitivity(sensitivity) {
        this.intensitySensitivity = Phaser.Math.Clamp(sensitivity, 0, 100);
        this.saveSettings();
    }
    
    setBossActive(isActive) {
        // When boss is active, maintain high intensity
        if (isActive) {
            this._setTargetIntensity(95);
        } else {
            // When boss is defeated, gradually return to normal
            this._setTargetIntensity(30);
        }
    }
    
    update(time, delta) {
        if (!this.dynamicMusicEnabled || !this.audioManager) return;
        
        // Throttle calculations for performance
        if (time - this.lastCalculation < this.calculationInterval) return;
        this.lastCalculation = time;
        
        this._calculateCombatIntensity();
        this._applyIntensityTransition(time);
    }
    
    _calculateCombatIntensity() {
        const player = this.scene.player;
        if (!player) return;
        
        let intensity = 0;
        
        // Get nearby enemies
        this.nearbyEnemies = this._getNearbyEnemies(player, 300); // 300px radius
        
        // Factor 1: Number of nearby enemies (0-40 points)
        const enemyCount = this.nearbyEnemies.length;
        if (enemyCount === 0) {
            intensity = 0;
        } else if (enemyCount === 1) {
            intensity = 15;
        } else if (enemyCount <= 2) {
            intensity = 25;
        } else if (enemyCount <= 3) {
            intensity = 35;
        } else {
            intensity = 40;
        }
        
        // Factor 2: Player health status (0-20 points)
        const playerHealthPercent = (player.health / player.maxHealth) * 100;
        if (playerHealthPercent < 25) {
            intensity += 20;
        } else if (playerHealthPercent < 50) {
            intensity += 10;
        }
        
        // Factor 3: Recent damage taken (0-15 points)
        const timeSinceHit = Date.now() - this.playerLastHitTime;
        if (timeSinceHit < 2000) { // Within last 2 seconds
            const hitIntensity = Math.max(0, 15 - (timeSinceHit / 2000) * 15);
            intensity += hitIntensity;
        }
        
        // Factor 4: Enemy threat levels (0-15 points)
        this.nearbyEnemies.forEach(enemy => {
            if (enemy.state !== 'dead' && enemy.active) {
                // Boss enemies = max threat
                if (enemy.isBoss) {
                    intensity += 15;
                }
                // Elite enemies = high threat
                else if (enemy.isElite) {
                    intensity += 10;
                }
                // Normal enemies = base threat
                else {
                    intensity += 5;
                }
            }
        });
        
        // Factor 5: Combat engagement (0-10 points)
        if (this._isPlayerInCombat()) {
            intensity += 10;
        }
        
        // Apply sensitivity modifier
        const sensitivityMultiplier = this.intensitySensitivity / 100;
        intensity *= sensitivityMultiplier;
        
        // Clamp final intensity
        intensity = Phaser.Math.Clamp(intensity, 0, 100);
        
        this._setTargetIntensity(intensity);
    }
    
    _getNearbyEnemies(player, radius) {
        const enemies = [];
        const enemySpawner = this.scene.enemySpawner;
        
        if (!enemySpawner) return enemies;
        
        enemySpawner.getEnemies().forEach(enemy => {
            if (!enemy || !enemy.active || enemy.state === 'dead') return;
            
            const distance = Phaser.Math.Distance.Between(
                player.x, player.y, enemy.x, enemy.y
            );
            
            if (distance <= radius) {
                enemies.push(enemy);
            }
        });
        
        return enemies;
    }
    
    _isPlayerInCombat() {
        // Check if player is actively engaged in combat
        const player = this.scene.player;
        if (!player || !player.active) return false;
        
        // Check if player is attacking
        if (player.isAttacking) return true;
        
        // Check if player is recently damaged
        const timeSinceHit = Date.now() - this.playerLastHitTime;
        if (timeSinceHit < 3000) return true;
        
        // Check if enemies are actively chasing/attacking
        for (const enemy of this.nearbyEnemies) {
            if (enemy.state === 'attacking' || enemy.state === 'chasing') {
                return true;
            }
        }
        
        return false;
    }
    
    _setTargetIntensity(intensity) {
        // Debounce intensity changes to avoid rapid flickering
        const now = Date.now();
        const intensityChange = Math.abs(intensity - this.targetIntensity);
        
        if (intensityChange > 5 || now - this.lastIntensityChange > this.debounceDelay) {
            this.targetIntensity = intensity;
            this.lastIntensityChange = now;
        }
    }
    
    _applyIntensityTransition(time) {
        const transitionSpeed = 0.05; // Smooth transition speed
        
        if (Math.abs(this.currentIntensity - this.targetIntensity) > 1) {
            this.currentIntensity = Phaser.Math.Linear(
                this.currentIntensity, 
                this.targetIntensity, 
                transitionSpeed
            );
            
            // Update audio intensity
            if (this.audioManager && this.audioManager.setCombatIntensity) {
                this.audioManager.setCombatIntensity(this.currentIntensity);
            }
        }
    }
    
    // Public methods for external events
    onPlayerHit() {
        this.playerLastHitTime = Date.now();
        
        // Immediate intensity boost when player is hit
        if (this.dynamicMusicEnabled) {
            this._setTargetIntensity(Math.max(this.targetIntensity, 60));
        }
    }
    
    onEnemySpawned(enemy) {
        // Recalculate intensity when new enemies spawn
        this._calculateCombatIntensity();
    }
    
    onEnemyDefeated(enemy) {
        // Slight delay to allow for outro music
        this.scene.time.delayedCall(1000, () => {
            this._calculateCombatIntensity();
        });
    }
    
    onBossEncounter(boss) {
        if (this.dynamicMusicEnabled) {
            this._setTargetIntensity(90); // High intensity for bosses
        }
    }
    
    onCombatStart() {
        this.combatEngaged = true;
        if (this.dynamicMusicEnabled) {
            this._setTargetIntensity(Math.max(this.targetIntensity, 50));
        }
    }
    
    onCombatEnd() {
        this.combatEngaged = false;
        if (this.dynamicMusicEnabled) {
            this._setTargetIntensity(20); // Stay slightly alert after combat
        }
    }
    
    // Get current state information
    getCurrentIntensity() {
        return this.currentIntensity;
    }
    
    getTargetIntensity() {
        return this.targetIntensity;
    }
    
    getIntensityLevel() {
        if (this.currentIntensity >= this.thresholds.BOSS_COMBAT) return 'BOSS_COMBAT';
        if (this.currentIntensity >= this.thresholds.HEAVY_COMBAT) return 'HEAVY_COMBAT';
        if (this.currentIntensity >= this.thresholds.LIGHT_COMBAT) return 'LIGHT_COMBAT';
        if (this.currentIntensity >= this.thresholds.ALERT) return 'ALERT';
        return 'PEACEFUL';
    }
    
    getNearbyEnemyCount() {
        return this.nearbyEnemies.length;
    }
    
    isInCombat() {
        return this.currentIntensity >= this.thresholds.LIGHT_COMBAT;
    }
    
    getSettings() {
        return {
            enabled: this.dynamicMusicEnabled,
            sensitivity: this.intensitySensitivity,
            currentIntensity: this.currentIntensity,
            targetIntensity: this.targetIntensity,
            intensityLevel: this.getIntensityLevel(),
            nearbyEnemyCount: this.getNearbyEnemyCount()
        };
    }
    
    destroy() {
        this.nearbyEnemies = [];
    }
}