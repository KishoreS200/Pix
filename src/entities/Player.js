import Phaser from 'phaser';
import { LootConfig } from '../utils/LootConfig';

export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);

        // Base properties (will be updated by progression system)
        this.baseHealth = 100;
        this.baseSpeed = 200;
        this.baseAttackDamage = 15;
        this.baseKnockbackForce = 250;

        // Current properties
        this.health = this.baseHealth;
        this.speed = this.baseSpeed;
        this.facingDirection = 'down';
        this.isInvulnerable = false;
        this.invulnerabilityDuration = 500;
        
        // Combat properties
        this.attackDamage = this.baseAttackDamage;
        this.attackCooldown = 600;
        this.lastAttackTime = 0;
        this.isAttacking = false;
        
        // Power-up state
        this.powerUpActive = false;
        this.powerUpEndTime = 0;
        this.powerUpTimer = null;
        this.currentKnockbackForce = this.baseKnockbackForce;
        
        // Level tracking
        this.currentLevel = 1;
        this.maxHealth = this.baseHealth;

        this.setupAnimations();
    }

    takeDamage(amount, source) {
        if (this.isInvulnerable || this.health <= 0) return;

        this.health = Math.max(0, this.health - amount);
        console.log(`Player hit! Health: ${this.health}`);
        
        // Emit damage event for HUD updates
        this.scene.events.emit('player-damage', amount);

        // Play hurt sound
        if (this.scene.audioManager) {
            this.scene.audioManager.playSound('player-hurt');
        }

        // Visual feedback
        this.setTint(0xff0000);
        
        // Screen effects - damage flash and shake
        if (this.scene.effectsManager) {
            this.scene.effectsManager.damageFlash(amount, this.maxHealth);
        } else {
            // Fallback
            this.scene.cameras.main.shake(100, 0.01);
        }
        
        // Hit particles
        if (this.scene.particleManager) {
            this.scene.particleManager.createHitEffect(this.x, this.y, 'player_hit', 12);
        }

        // Knockback
        if (source) {
            const angle = Phaser.Math.Angle.Between(source.x, source.y, this.x, this.y);
            const knockbackForce = 250;
            this.setVelocity(Math.cos(angle) * knockbackForce, Math.sin(angle) * knockbackForce);
        }

        this.play('hit', true);

        this.isInvulnerable = true;
        this.scene.time.delayedCall(this.invulnerabilityDuration, () => {
            this.isInvulnerable = false;
            this.clearTint();
        });

        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        this.play('death', true);
        this.setVelocity(0, 0);
        this.scene.events.emit('player-death');
    }

    collectLoot(lootItem) {
        if (!lootItem || !lootItem.active) return;

        // Play collect animation
        lootItem.playCollectAnimation();

        // Handle different loot types
        switch (lootItem.type) {
            case 'coin':
                this.scene.events.emit('coin-collected', lootItem.value);
                break;
            case 'potion':
                this.scene.events.emit('potion-collected', lootItem.value);
                break;
            case 'powerup':
                this.scene.events.emit('powerup-collected', lootItem.value);
                break;
        }

        // Remove from loot manager
        if (this.scene.lootManager) {
            this.scene.lootManager.despawnLootItem(lootItem);
        }
    }

    activatePowerUp(damageBoostPercentage, durationMs) {
        // If power-up is already active, reset the timer
        if (this.powerUpTimer) {
            this.powerUpTimer.remove();
        }

        this.powerUpActive = true;
        this.powerUpEndTime = this.scene.time.now + durationMs;
        
        // Apply damage boost
        const boostMultiplier = 1 + (damageBoostPercentage / 100);
        this.attackDamage = Math.floor(this.baseAttackDamage * boostMultiplier);

        // Apply knockback boost
        const knockbackBoostMultiplier = 1 + (LootConfig.powerUpSettings.knockbackBoostPercentage / 100);
        this.currentKnockbackForce = Math.floor(this.baseKnockbackForce * knockbackBoostMultiplier);

        // Visual indicator - golden tint
        this.setTint(LootConfig.rarityColors.rare);

        // Set up timer for power-up expiration
        this.powerUpTimer = this.scene.time.delayedCall(durationMs, () => {
            this.deactivatePowerUp();
        });

        this.scene.events.emit('powerup-activated', damageBoostPercentage, durationMs);
    }

    deactivatePowerUp() {
        this.powerUpActive = false;
        this.powerUpEndTime = 0;
        this.attackDamage = this.baseAttackDamage;
        this.currentKnockbackForce = this.baseKnockbackForce;
        this.clearTint();
        
        this.scene.events.emit('powerup-ended');
    }

    updatePowerUp(time) {
        if (this.powerUpActive) {
            const remainingTime = this.powerUpEndTime - time;
            if (remainingTime <= 0) {
                this.deactivatePowerUp();
            } else {
                this.scene.events.emit('powerup-update', remainingTime);
            }
        }
    }
    
    applyStatBases(stats) {
        // Update base stats from progression
        this.baseHealth = stats.health;
        this.baseSpeed = stats.speed;
        this.baseAttackDamage = stats.damage;
        this.baseKnockbackForce = stats.knockbackForce;
        
        // Update current level tracking
        if (this.scene.progressionManager) {
            this.currentLevel = this.scene.progressionManager.getCurrentLevel();
        }
        
        // Apply stats immediately
        this.speed = this.baseSpeed;
        this.maxHealth = this.baseHealth;
        
        // Update damage and knockback (respecting power-up state)
        if (!this.powerUpActive) {
            this.attackDamage = this.baseAttackDamage;
            this.currentKnockbackForce = this.baseKnockbackForce;
        } else {
            // Re-apply power-up with new base values
            const remainingTime = this.powerUpEndTime - this.scene.time.now;
            this.activatePowerUp(
                LootConfig.powerUpSettings.damageBoostPercentage,
                remainingTime
            );
        }
    }
    
    healToFull() {
        this.health = this.maxHealth;
        this.scene.events.emit('player-healed', this.health);
    }

    attack() {
        const currentTime = this.scene.time.now;
        
        if (currentTime - this.lastAttackTime < this.attackCooldown) {
            return false;
        }

        if (this.isAttacking || this.health <= 0) {
            return false;
        }

        this.isAttacking = true;
        this.lastAttackTime = currentTime;
        this.setVelocity(0, 0);
        
        this.play('attack', true);

        if (this.scene.combatManager) {
            const range = 80;
            const width = 60;
            const hitbox = this.scene.combatManager.createAttackHitbox(this, range, width, this.facingDirection);
            
            // Calculate hitbox position for attack effects
            let offsetX = 0;
            let offsetY = 0;
            
            switch (this.facingDirection) {
                case 'up':
                    offsetY = -range / 2;
                    break;
                case 'down':
                    offsetY = range / 2;
                    break;
                case 'left':
                    offsetX = -range / 2;
                    break;
                case 'right':
                    offsetX = range / 2;
                    break;
            }
            
            const hitboxX = this.x + offsetX;
            const hitboxY = this.y + offsetY;
            
            // Create attack visual effect
            if (this.scene.particleManager) {
                this.scene.particleManager.createAttackEffect(hitboxX, hitboxY, this.facingDirection);
            }
            
            if (this.scene.enemySpawner && this.scene.enemySpawner.enemies) {
                this.scene.combatManager.checkHitboxCollisions(hitbox, this.scene.enemySpawner.enemies);
            }
        }

        this.once('animationcomplete', (anim) => {
            if (anim.key === 'attack') {
                this.isAttacking = false;
            }
        });

        return true;
    }

    dealDamage(target, amount) {
        if (!target || !target.takeDamage) return;
        target.takeDamage(amount, this);
    }

    setupAnimations() {
        const anims = this.scene.anims;

        if (anims.exists('idle-down')) return;

        // Idle
        anims.create({
            key: 'idle-down',
            frames: anims.generateFrameNumbers('player', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });
        // We can add other idle directions if needed, but for now let's use down

        // Walk
        anims.create({
            key: 'walk-down',
            frames: anims.generateFrameNumbers('player', { start: 4, end: 9 }),
            frameRate: 10,
            repeat: -1
        });
        anims.create({
            key: 'walk-up',
            frames: anims.generateFrameNumbers('player', { start: 10, end: 15 }),
            frameRate: 10,
            repeat: -1
        });
        anims.create({
            key: 'walk-left',
            frames: anims.generateFrameNumbers('player', { start: 16, end: 21 }),
            frameRate: 10,
            repeat: -1
        });
        anims.create({
            key: 'walk-right',
            frames: anims.generateFrameNumbers('player', { start: 22, end: 27 }),
            frameRate: 10,
            repeat: -1
        });

        // Attack
        anims.create({
            key: 'attack',
            frames: anims.generateFrameNumbers('player', { start: 28, end: 31 }),
            frameRate: 12,
            repeat: 0
        });

        // Hit
        anims.create({
            key: 'hit',
            frames: anims.generateFrameNumbers('player', { start: 32, end: 33 }),
            frameRate: 8,
            repeat: 0
        });

        // Death
        anims.create({
            key: 'death',
            frames: anims.generateFrameNumbers('player', { start: 34, end: 39 }),
            frameRate: 8,
            repeat: 0
        });
    }

    update(inputVector) {
        // Don't interrupt certain animations if they are still playing
        const currentAnim = this.anims.currentAnim;
        if (currentAnim && (currentAnim.key === 'attack' || currentAnim.key === 'death') && this.anims.isPlaying) {
            this.setVelocity(0, 0);
            return;
        }

        // Allow 'hit' animation to play while knockback is active
        if (currentAnim && currentAnim.key === 'hit' && this.anims.isPlaying) {
            return;
        }

        // Don't allow movement while attacking
        if (this.isAttacking) {
            this.setVelocity(0, 0);
            return;
        }

        // Get speed modifier from collision manager if available
        const speedModifier = this.scene.collisionManager ? this.scene.collisionManager.getPlayerSpeedModifier() : 1.0;
        const modifiedSpeed = this.speed * speedModifier;

        this.setVelocity(inputVector.x * modifiedSpeed, inputVector.y * modifiedSpeed);

        if (inputVector.x !== 0 || inputVector.y !== 0) {
            if (Math.abs(inputVector.x) >= Math.abs(inputVector.y)) {
                this.facingDirection = inputVector.x > 0 ? 'right' : 'left';
            } else {
                this.facingDirection = inputVector.y > 0 ? 'down' : 'up';
            }
            this.play(`walk-${this.facingDirection}`, true);
        } else {
            // If stopped, play idle
            this.play('idle-down', true);
        }
    }
}
