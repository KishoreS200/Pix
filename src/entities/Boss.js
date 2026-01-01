import Phaser from 'phaser';
import {
    BossConfig,
    calculateBossStats,
    PhaseThresholds,
    AttackTypes
} from '../utils/BossConfig';
import { MusicKeys } from '../utils/MusicConfig';

export default class Boss extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, bossKey, playerLevel = 1) {
        // Get boss configuration
        const config = BossConfig[bossKey];
        if (!config) {
            console.error(`Boss config not found for key: ${bossKey}`);
            super(scene, x, y, 'boss');
            return;
        }
        
        // Create texture for boss if it doesn't exist
        const textureKey = `boss_${bossKey}`;
        if (!scene.textures.exists(textureKey)) {
            createBossTexture(scene, textureKey, config.size.width, config.size.height, config.tint);
        }
        
        super(scene, x, y, textureKey);
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Store config reference
        this.bossKey = bossKey;
        this.config = config;
        
        // Calculate stats based on player level
        const stats = calculateBossStats(bossKey, playerLevel);
        
        // Core properties
        this.name = config.name;
        this.description = config.description;
        this.element = config.element;
        this.maxHealth = stats.maxHealth;
        this.currentHealth = stats.maxHealth;
        this.damage = stats.damage;
        this.speed = stats.speed;
        this.attackRange = config.attackRange;
        this.attackSpeed = config.attackSpeed;
        this.knockbackPower = config.knockbackPower;
        
        // XP reward
        this.xpReward = stats.xpReward;
        
        // Phase system
        this.currentPhase = 0;
        this.phaseThresholds = config.phaseThresholds;
        this.maxPhases = config.maxPhases || 3;
        
        // Combat state
        this.state = 'idle'; // 'idle', 'chase', 'attack', 'hit', 'dead', 'teleport'
        this.isAlive = true;
        this.isInvulnerable = false;
        this.invulnerabilityDuration = 500;
        
        // Attack tracking
        this.lastAttackTime = 0;
        this.isAttacking = false;
        this.currentAttackCooldown = 0;
        
        // Attack patterns
        this.attackPatterns = config.phases;
        
        // Teleport state
        this.isTeleporting = false;
        this.teleportCooldown = 0;
        
        // Visual feedback
        this.baseTint = config.tint;
        
        // Loot on death
        this.lootTable = config.lootTable;
        
        // Audio
        this.audioManager = scene.audioManager;
        
        // Initialize
        this.setupAnimations();
        this.enterPhase(0);
        
        // Set physics body size
        this.body.setSize(config.size.width * 0.8, config.size.height * 0.8);
        this.body.setOffset(config.size.width * 0.1, config.size.height * 0.1);
    }
    
    setupAnimations() {
        const texture = this.texture.key;
        const anims = this.scene.anims;
        
        // Skip if animations already exist
        if (anims.exists(`${texture}-idle`)) return;
        
        // Idle animation
        anims.create({
            key: `${texture}-idle`,
            frames: anims.generateFrameNumbers(texture, { start: 0, end: 3 }),
            frameRate: 6,
            repeat: -1
        });
        
        // Walk/move animation
        anims.create({
            key: `${texture}-walk`,
            frames: anims.generateFrameNumbers(texture, { start: 4, end: 7 }),
            frameRate: 8,
            repeat: -1
        });
        
        // Attack animation
        anims.create({
            key: `${texture}-attack`,
            frames: anims.generateFrameNumbers(texture, { start: 8, end: 11 }),
            frameRate: 12,
            repeat: 0
        });
        
        // Hit/damage animation
        anims.create({
            key: `${texture}-hit`,
            frames: anims.generateFrameNumbers(texture, { start: 12, end: 13 }),
            frameRate: 10,
            repeat: 0
        });
        
        // Death animation
        anims.create({
            key: `${texture}-death`,
            frames: anims.generateFrameNumbers(texture, { start: 14, end: 19 }),
            frameRate: 8,
            repeat: 0
        });
        
        // Special animations for different attacks
        anims.create({
            key: `${texture}-special`,
            frames: anims.generateFrameNumbers(texture, { start: 20, end: 23 }),
            frameRate: 10,
            repeat: 0
        });
    }
    
    enterPhase(phaseIndex) {
        if (phaseIndex >= this.maxPhases) {
            phaseIndex = this.maxPhases - 1;
        }
        
        this.currentPhase = phaseIndex;
        const phaseConfig = this.config.phases[phaseIndex + 1];
        
        if (!phaseConfig) return;
        
        // Apply phase multipliers
        this.phaseConfig = phaseConfig;
        
        // Visual feedback for phase change
        this.setTint(phaseConfig.color);
        
        // Play phase change effects
        if (this.scene.particleManager) {
            this.scene.particleManager.createBossPhaseEffect(this.x, this.y);
        }
        
        if (this.scene.effectsManager) {
            this.scene.effectsManager.majorEvent('boss');
        }
        
        // Play audio
        if (this.audioManager) {
            this.audioManager.playSound('boss-phase');
            
            // Transition to appropriate music
            if (phaseIndex >= 1) {
                this.audioManager.playMusic(MusicKeys.BOSS_ENRAGED, true, 500);
            } else {
                this.audioManager.playMusic(MusicKeys.BOSS_NORMAL, true, 500);
            }
        }
        
        // Emit event for UI updates
        this.scene.events.emit('boss-phase-change', {
            boss: this,
            phase: phaseIndex + 1,
            phaseName: phaseConfig.name,
            color: phaseConfig.color
        });
        
        console.log(`${this.name} entered Phase ${phaseIndex + 1}: ${phaseConfig.name}`);
    }
    
    transitionPhase() {
        const healthPercent = (this.currentHealth / this.maxHealth) * 100;
        const nextPhase = this.currentPhase + 1;
        
        if (nextPhase < this.maxPhases && healthPercent <= this.phaseThresholds[nextPhase]) {
            this.enterPhase(nextPhase);
            return true;
        }
        return false;
    }
    
    takeDamage(amount, source) {
        if (!this.isAlive || this.isInvulnerable) return;
        
        // Reduce damage based on phase (enraged phases have slight damage resistance)
        const phaseResistance = 1 - (this.currentPhase * 0.1);
        const actualDamage = Math.floor(amount * phaseResistance);
        
        this.currentHealth = Math.max(0, this.currentHealth - actualDamage);
        
        console.log(`${this.name} took ${actualDamage} damage! Health: ${this.currentHealth}/${this.maxHealth}`);
        
        // Visual feedback
        this.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => {
            if (this.phaseConfig) {
                this.setTint(this.phaseConfig.color);
            } else {
                this.clearTint();
            }
        });
        
        // Screen shake for significant hits
        if (actualDamage > 30 && this.scene.effectsManager) {
            this.scene.effectsManager.screenShake(5, 100);
        }
        
        // Hit particles
        if (this.scene.particleManager) {
            this.scene.particleManager.createHitEffect(this.x, this.y, 'boss', 10);
        }
        
        // Knockback
        if (source) {
            const angle = Phaser.Math.Angle.Between(source.x, source.y, this.x, this.y);
            const knockbackForce = this.knockbackPower * 0.5;
            this.setVelocity(Math.cos(angle) * knockbackForce, Math.sin(angle) * knockbackForce);
        }
        
        // Play hit animation
        this.play(`${this.texture.key}-hit`, true);
        
        this.isInvulnerable = true;
        this.scene.time.delayedCall(this.invulnerabilityDuration, () => {
            this.isInvulnerable = false;
        });
        
        // Check for phase transition
        this.transitionPhase();
        
        // Check for death
        if (this.currentHealth <= 0) {
            this.die();
        }
        
        // Emit damage event for UI
        this.scene.events.emit('boss-damage', {
            boss: this,
            damage: actualDamage,
            currentHealth: this.currentHealth,
            maxHealth: this.maxHealth
        });
    }
    
    die() {
        if (!this.isAlive) return;
        
        this.isAlive = false;
        this.state = 'dead';
        this.body.enable = false;
        
        console.log(`${this.name} has been defeated!`);
        
        // Play death effects
        if (this.scene.particleManager) {
            this.scene.particleManager.createBossDeathEffect(this.x, this.y);
        }
        
        if (this.scene.effectsManager) {
            this.scene.effectsManager.majorEvent('boss-death');
        }
        
        // Play audio
        if (this.audioManager) {
            this.audioManager.playSound('death');
            this.audioManager.playSound('boss-defeated');
            this.audioManager.playMusic(MusicKeys.BOSS_DEFEATED, false, 500);
        }
        
        // Play death animation
        this.play(`${this.texture.key}-death`, true);
        
        // Emit defeat event
        this.scene.events.emit('boss-defeated', {
            boss: this,
            name: this.name,
            xpReward: this.xpReward,
            lootTable: this.lootTable
        });
        
        // Grant XP
        this.grantXP();
        
        // Drop loot
        this.dropLoot();
        
        // Cleanup after death animation
        this.once('animationcomplete', (anim) => {
            if (anim.key === `${this.texture.key}-death`) {
                // Keep boss on screen for a moment, then destroy
                this.scene.time.delayedCall(2000, () => {
                    this.destroy();
                });
            }
        });
    }
    
    grantXP() {
        if (this.scene.progressionManager) {
            this.scene.progressionManager.incrementEnemiesDefeated();
            const leveledUp = this.scene.progressionManager.addXP(this.xpReward);
            
            // Show floating XP text
            if (this.scene.floatingText) {
                this.scene.floatingText.showXP(this.scene, this.x, this.y - 80, this.xpReward);
            }
            
            console.log(`Granted ${this.xpReward} XP for defeating ${this.name}`);
        }
    }
    
    dropLoot() {
        if (!this.scene.lootManager || !this.lootTable) return;
        
        // Drop coins
        const { min: coinMin, max: coinMax } = this.lootTable.coins;
        const coinCount = Phaser.Math.Between(coinMin, coinMax);
        
        // Drop multiple coin piles
        const piles = Math.ceil(coinCount / 50);
        for (let i = 0; i < piles; i++) {
            const offsetX = Phaser.Math.Between(-30, 30);
            const offsetY = Phaser.Math.Between(-30, 30);
            this.scene.lootManager.spawnLootAtPosition(this.x + offsetX, this.y + offsetY, 'coin', Math.min(50, coinCount));
        }
        
        // Drop items based on rarity weights
        this.lootTable.items.forEach(item => {
            if (Math.random() * 100 < item.weight) {
                const offsetX = Phaser.Math.Between(-40, 40);
                const offsetY = Phaser.Math.Between(-40, 40);
                this.scene.lootManager.spawnLootAtPosition(this.x + offsetX, this.y + offsetY, item.type, item.value);
            }
        });
        
        // Play loot sound
        if (this.audioManager) {
            this.audioManager.playSound('boss-loot');
        }
    }
    
    update(player, delta) {
        if (!this.isAlive || this.state === 'dead') return;
        
        // Don't update during certain states
        if (this.isAttacking || this.isInvulnerable || this.isTeleporting) {
            return;
        }
        
        const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        
        // State machine for boss AI
        switch (this.state) {
            case 'idle':
                this.handleIdleState(player, distance);
                break;
            case 'chase':
                this.handleChaseState(player, distance);
                break;
            case 'attack':
                this.handleAttackState(player, distance);
                break;
            default:
                this.state = 'idle';
        }
        
        // Check for phase transition
        this.transitionPhase();
        
        // Update cooldowns
        if (this.currentAttackCooldown > 0) {
            this.currentAttackCooldown -= delta;
        }
        
        if (this.teleportCooldown > 0) {
            this.teleportCooldown -= delta;
        }
    }
    
    handleIdleState(player, distance) {
        // Transition to chase if player is within detection range
        const detectionRange = 400;
        
        if (distance <= detectionRange) {
            this.state = 'chase';
        }
        
        this.setVelocity(0, 0);
        this.play(`${this.texture.key}-idle`, true);
    }
    
    handleChaseState(player, distance) {
        const attackRange = this.attackRange * (this.currentPhase >= 2 ? 1.3 : 1);
        
        // Check if should attack
        if (distance <= attackRange) {
            this.state = 'attack';
            this.attack(player);
            return;
        }
        
        // Move towards player
        const speed = this.speed * (this.phaseConfig?.speedMultiplier || 1);
        this.scene.physics.moveToObject(this, player, speed);
        
        // Play walk animation
        this.play(`${this.texture.key}-walk`, true);
        
        // Face the player
        const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        this.setFlipX(angle > Math.PI / 2 || angle < -Math.PI / 2);
    }
    
    handleAttackState(player, distance) {
        // Stay in attack state until animation completes
        if (this.isAttacking) return;
        
        // After attack, decide next action
        const detectionRange = 400;
        if (distance <= detectionRange) {
            this.state = 'chase';
        } else {
            this.state = 'idle';
        }
    }
    
    attack(player) {
        if (this.isAttacking || !this.isAlive) return;
        
        const now = this.scene.time.now;
        if (now - this.lastAttackTime < this.currentAttackCooldown) return;
        
        this.isAttacking = true;
        this.lastAttackTime = now;
        this.setVelocity(0, 0);
        this.state = 'attack';
        
        // Get available attacks for current phase
        const phaseAttacks = this.phaseConfig?.attacks || [];
        if (phaseAttacks.length === 0) {
            this.isAttacking = false;
            return;
        }
        
        // Select attack based on weights
        const selectedAttack = this.selectAttack(phaseAttacks);
        this.currentAttackCooldown = selectedAttack.cooldown * (this.phaseConfig?.attackSpeedMultiplier || 1);
        
        // Execute the attack
        this.executeAttack(player, selectedAttack.type);
        
        // Play attack animation
        this.play(`${this.texture.key}-attack`, true);
        
        // Reset state after animation
        this.once('animationcomplete', (anim) => {
            if (anim.key === `${this.texture.key}-attack`) {
                this.isAttacking = false;
                
                // Return to chase or idle
                const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
                this.state = distance <= 400 ? 'chase' : 'idle';
            }
        });
    }
    
    selectAttack(attacks) {
        const totalWeight = attacks.reduce((sum, a) => sum + a.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const attack of attacks) {
            random -= attack.weight;
            if (random <= 0) {
                return attack;
            }
        }
        
        return attacks[0];
    }
    
    executeAttack(player, attackType) {
        switch (attackType) {
            case AttackTypes.MELEE_SWING:
                this.meleeSwingAttack(player);
                break;
            case AttackTypes.MELEE_LUNGE:
                this.meleeLungeAttack(player);
                break;
            case AttackTypes.RANGED_PROJECTILE:
                this.rangedProjectileAttack(player);
                break;
            case AttackTypes.RANGED_BLAST:
                this.rangedBlastAttack(player);
                break;
            case AttackTypes.AREA_SLAM:
                this.areaSlamAttack(player);
                break;
            case AttackTypes.AREA_SHOCKWAVE:
                this.areaShockwaveAttack(player);
                break;
            case AttackTypes.SPECIAL_TELEPORT:
                this.specialTeleportAttack(player);
                break;
            case AttackTypes.SPECIAL_CHARGE:
                this.specialChargeAttack(player);
                break;
            case AttackTypes.SPECIAL_SUMMON:
                this.specialSummonAttack(player);
                break;
            default:
                this.meleeSwingAttack(player);
        }
    }
    
    meleeSwingAttack(player) {
        const damageMultiplier = this.phaseConfig?.damageMultiplier || 1;
        const damage = Math.floor(this.damage * damageMultiplier);
        
        // Create attack hitbox
        if (this.scene.combatManager) {
            const direction = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
            let facingDir = 'down';
            if (Math.abs(direction) < Math.PI / 4) facingDir = 'right';
            else if (Math.abs(direction) > 3 * Math.PI / 4) facingDir = 'left';
            else if (direction > 0) facingDir = 'down';
            else facingDir = 'up';
            
            const hitbox = this.scene.combatManager.createAttackHitbox(this, 100, 80, facingDir);
            hitbox.damage = damage;
            
            // Check for player collision
            if (this.scene.player && this.scene.player.active) {
                const playerDist = Phaser.Math.Distance.Between(this.x, this.y, this.scene.player.x, this.scene.player.y);
                if (playerDist <= this.attackRange) {
                    this.scene.combatManager.damageEntity(this.scene.player, damage, this);
                }
            }
        }
        
        // Play attack sound
        if (this.audioManager) {
            this.audioManager.playSound('attack-swing');
        }
    }
    
    meleeLungeAttack(player) {
        const damageMultiplier = (this.phaseConfig?.damageMultiplier || 1) * 1.5;
        const damage = Math.floor(this.damage * damageMultiplier);
        
        // Calculate lunge direction
        const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        
        // Lunge animation and movement
        const lungeDistance = 150;
        const lungeDuration = 200;
        
        const targetX = this.x + Math.cos(angle) * lungeDistance;
        const targetY = this.y + Math.sin(angle) * lungeDistance;
        
        this.scene.tweens.add({
            targets: this,
            x: targetX,
            y: targetY,
            duration: lungeDuration,
            ease: 'Power2',
            onComplete: () => {
                // Check for hit after lunge
                if (this.scene.player && this.scene.player.active) {
                    const playerDist = Phaser.Math.Distance.Between(this.x, this.y, this.scene.player.x, this.scene.player.y);
                    if (playerDist <= 100) {
                        this.scene.combatManager.damageEntity(this.scene.player, damage, this);
                    }
                }
                
                // Return to original position
                this.scene.tweens.add({
                    targets: this,
                    x: this.x,
                    y: this.y,
                    duration: 300,
                    delay: 100,
                    ease: 'Power2'
                });
            }
        });
        
        // Screen shake for impact
        if (this.scene.effectsManager) {
            this.scene.time.delayedCall(lungeDuration, () => {
                this.scene.effectsManager.screenShake(8, 150);
            });
        }
    }
    
    rangedProjectileAttack(player) {
        const damageMultiplier = (this.phaseConfig?.damageMultiplier || 1) * 0.8;
        const damage = Math.floor(this.damage * damageMultiplier);
        
        // Create projectile
        const projectile = this.scene.add.circle(this.x, this.y, 10, this.phaseConfig?.color || 0xff00ff);
        this.scene.physics.add.existing(projectile);
        projectile.body.setAllowGravity(false);
        projectile.setDepth(30);
        
        // Calculate direction
        const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        const speed = 400;
        
        projectile.body.setVelocity(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        );
        
        // Projectile collision
        this.scene.physics.add.overlap(projectile, this.scene.player, () => {
            if (this.scene.combatManager) {
                this.scene.combatManager.damageEntity(this.scene.player, damage, this);
            }
            projectile.destroy();
        });
        
        // Destroy projectile after delay or out of bounds
        this.scene.time.delayedCall(3000, () => {
            if (projectile && projectile.active) {
                projectile.destroy();
            }
        });
        
        // Play sound
        if (this.audioManager) {
            this.audioManager.playSound('attack-swing');
        }
    }
    
    rangedBlastAttack(player) {
        const damageMultiplier = (this.phaseConfig?.damageMultiplier || 1) * 1.2;
        const damage = Math.floor(this.damage * damageMultiplier);
        
        // Create blast effect at player position
        const blastRadius = 120;
        const blastColor = this.phaseConfig?.color || 0x00ff00;
        
        // Visual indicator
        const indicator = this.scene.add.circle(player.x, player.y, blastRadius, blastColor, 0.3);
        indicator.setDepth(29);
        
        this.scene.tweens.add({
            targets: indicator,
            scale: 1.5,
            alpha: 0,
            duration: 500,
            onComplete: () => {
                indicator.destroy();
            }
        });
        
        // Apply damage after delay
        this.scene.time.delayedCall(400, () => {
            if (this.scene.player && this.scene.player.active) {
                const playerDist = Phaser.Math.Distance.Between(this.x, this.y, this.scene.player.x, this.scene.player.y);
                if (playerDist <= blastRadius * 1.5) {
                    this.scene.combatManager.damageEntity(this.scene.player, damage, this);
                }
            }
            
            // Screen flash
            if (this.scene.effectsManager) {
                this.scene.effectsManager.screenFlash(blastColor, 100, 0.3);
            }
        });
        
        // Play sound
        if (this.audioManager) {
            this.audioManager.playSound('attack-hit');
        }
    }
    
    areaSlamAttack(player) {
        const damageMultiplier = (this.phaseConfig?.damageMultiplier || 1) * 1.5;
        const damage = Math.floor(this.damage * damageMultiplier);
        
        const slamRadius = 180;
        const slamColor = this.phaseConfig?.color || 0xff4400;
        
        // Visual effect - slam ring
        const ring = this.scene.add.circle(this.x, this.y, 20, slamColor, 0.8);
        ring.setDepth(29);
        
        this.scene.tweens.add({
            targets: ring,
            scale: slamRadius / 20,
            alpha: 0,
            duration: 600,
            ease: 'Power2',
            onComplete: () => {
                ring.destroy();
            }
        });
        
        // Apply damage
        this.scene.time.delayedCall(300, () => {
            if (this.scene.player && this.scene.player.active) {
                const playerDist = Phaser.Math.Distance.Between(this.x, this.y, this.scene.player.x, this.scene.player.y);
                if (playerDist <= slamRadius) {
                    this.scene.combatManager.damageEntity(this.scene.player, damage, this);
                }
            }
            
            // Strong screen shake
            if (this.scene.effectsManager) {
                this.scene.effectsManager.screenShake(15, 200);
                this.scene.effectsManager.screenFlash(slamColor, 150, 0.4);
            }
        });
        
        // Play sound
        if (this.audioManager) {
            this.audioManager.playSound('attack-hit');
        }
    }
    
    areaShockwaveAttack(player) {
        const damageMultiplier = (this.phaseConfig?.damageMultiplier || 1) * 1.3;
        const damage = Math.floor(this.damage * damageMultiplier);
        
        const waveRadius = 300;
        const waveColor = this.phaseConfig?.color || 0x00ffff;
        
        // Create expanding ring
        const wave = this.scene.add.circle(this.x, this.y, 10, waveColor, 0.6);
        wave.setDepth(29);
        
        this.scene.tweens.add({
            targets: wave,
            scale: waveRadius / 10,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => {
                wave.destroy();
            }
        });
        
        // Apply damage in waves
        this.scene.time.delayedCall(200, () => {
            if (this.scene.player && this.scene.player.active) {
                const playerDist = Phaser.Math.Distance.Between(this.x, this.y, this.scene.player.x, this.scene.player.y);
                if (playerDist <= waveRadius) {
                    this.scene.combatManager.damageEntity(this.scene.player, damage, this);
                }
            }
        });
        
        // Play sound
        if (this.audioManager) {
            this.audioManager.playSound('knockback');
        }
    }
    
    specialTeleportAttack(player) {
        if (this.teleportCooldown > 0) {
            // Fall back to basic attack
            this.meleeSwingAttack(player);
            return;
        }
        
        this.isTeleporting = true;
        this.teleportCooldown = 8000;
        
        // Create teleport effect at current position
        if (this.scene.particleManager) {
            this.scene.particleManager.createBossPhaseEffect(this.x, this.y);
        }
        
        // Fade out
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: 200,
            onComplete: () => {
                // Teleport behind player
                const angle = Phaser.Math.Angle.Between(player.x, player.y, this.x, this.y);
                const teleportDistance = 200;
                
                this.x = player.x + Math.cos(angle) * teleportDistance;
                this.y = player.y + Math.sin(angle) * teleportDistance;
                
                // Fade in
                this.scene.tweens.add({
                    targets: this,
                    alpha: 1,
                    duration: 200,
                    onComplete: () => {
                        this.isTeleporting = false;
                        
                        // Immediately attack after teleport
                        this.meleeSwingAttack(player);
                    }
                });
            }
        });
    }
    
    specialChargeAttack(player) {
        const damageMultiplier = (this.phaseConfig?.damageMultiplier || 1) * 2;
        const damage = Math.floor(this.damage * damageMultiplier);
        
        const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        const chargeDistance = 400;
        
        // Telegraph the charge
        const telegraph = this.scene.add.arrow(this.x, this.y, Math.cos(angle) * 50, Math.sin(angle) * 50, 0xff0000, 0.5);
        telegraph.setDepth(29);
        
        this.scene.tweens.add({
            targets: telegraph,
            scaleX: chargeDistance / 50,
            alpha: 0,
            duration: 500,
            onComplete: () => {
                telegraph.destroy();
                
                // Charge
                const targetX = this.x + Math.cos(angle) * chargeDistance;
                const targetY = this.y + Math.sin(angle) * chargeDistance;
                
                this.scene.tweens.add({
                    targets: this,
                    x: targetX,
                    y: targetY,
                    duration: 300,
                    ease: 'Power1',
                    onUpdate: () => {
                        // Check collision during charge
                        if (this.scene.player && this.scene.player.active) {
                            const playerDist = Phaser.Math.Distance.Between(this.x, this.y, this.scene.player.x, this.scene.player.y);
                            if (playerDist <= 60) {
                                this.scene.combatManager.damageEntity(this.scene.player, damage, this);
                            }
                        }
                    },
                    onComplete: () => {
                        // Screen shake on impact
                        if (this.scene.effectsManager) {
                            this.scene.effectsManager.screenShake(10, 200);
                        }
                    }
                });
            }
        });
    }
    
    specialSummonAttack(player) {
        // Spawn additional enemies (limited in number)
        if (!this.scene.enemySpawner) return;
        
        const summonCount = 2 + this.currentPhase;
        const summonedTypes = ['glitch_fauna', 'corrupted_human'];
        
        for (let i = 0; i < summonCount; i++) {
            const offsetX = Phaser.Math.Between(-100, 100);
            const offsetY = Phaser.Math.Between(-100, 100);
            const spawnX = Phaser.Math.Clamp(this.x + offsetX, 100, this.scene.collisionManager?.tilemap?.widthInPixels - 100 || 2000);
            const spawnY = Phaser.Math.Clamp(this.y + offsetY, 100, this.scene.collisionManager?.tilemap?.heightInPixels - 100 || 2000);
            
            const type = summonedTypes[Math.floor(Math.random() * summonedTypes.length)];
            this.scene.enemySpawner.spawnEnemy(type, spawnX, spawnY);
        }
        
        // Visual effect
        if (this.scene.particleManager) {
            this.scene.particleManager.createDeathExplosion(this.x, this.y, 'boss', 15);
        }
        
        // Play sound
        if (this.audioManager) {
            this.audioManager.playSound('powerup-pickup');
        }
    }
    
    getAttackPattern() {
        const phaseConfig = this.phaseConfig;
        if (!phaseConfig) return null;
        
        return {
            phase: this.currentPhase + 1,
            phaseName: phaseConfig.name,
            attacks: phaseConfig.attacks,
            damageMultiplier: phaseConfig.damageMultiplier,
            speedMultiplier: phaseConfig.speedMultiplier
        };
    }
    
    getHealthPercent() {
        return (this.currentHealth / this.maxHealth) * 100;
    }
    
    destroy() {
        if (this.scene.events) {
            this.scene.events.off('boss-phase-change');
            this.scene.events.off('boss-defeated');
            this.scene.events.off('boss-damage');
        }
        super.destroy();
    }
}

// Helper function to create boss textures procedurally
function createBossTexture(scene, key, width, height, tint) {
    const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
    
    // Main body
    graphics.fillStyle(tint, 1);
    graphics.fillRect(0, 0, width, height);
    
    // Core/glow effect
    const centerX = width / 2;
    const centerY = height / 2;
    graphics.fillStyle(0xffffff, 0.3);
    graphics.fillCircle(centerX, centerY, Math.min(width, height) * 0.3);
    
    // Eyes/features
    graphics.fillStyle(0x000000, 1);
    graphics.fillRect(centerX - width * 0.2, centerY - height * 0.15, width * 0.15, height * 0.15);
    graphics.fillRect(centerX + width * 0.05, centerY - height * 0.15, width * 0.15, height * 0.15);
    
    // Generate texture
    graphics.generateTexture(key, width, height);
    graphics.destroy();
}
