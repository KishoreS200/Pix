import Phaser from 'phaser';

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, faction) {
        super(scene, x, y, texture);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.faction = faction;
        this.health = 20;
        this.speed = 100;
        this.detectionRadius = 150;
        this.damage = 5;
        this.state = 'idle'; // 'idle', 'patrol', 'alert', 'chase', 'attack', 'dead'
        this.lastDamageTime = 0;
        this.damageCooldown = 500;
        
        // Combat properties
        this.attackRange = 100;
        this.attackCooldown = 1000;
        this.lastAttackTime = 0;
        this.isAttacking = false;
        this.isInvulnerable = false;
        this.invulnerabilityDuration = 500;
        
        // XP reward
        this.xpReward = 10; // Base XP for defeating this enemy

        this.setupAnimations();
    }

    setupAnimations() {
        const anims = this.scene.anims;
        const texture = this.texture.key;

        if (anims.exists(`${texture}-idle`)) return;

        anims.create({
            key: `${texture}-idle`,
            frames: anims.generateFrameNumbers(texture, { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });

        anims.create({
            key: `${texture}-walk`,
            frames: anims.generateFrameNumbers(texture, { start: 4, end: 9 }),
            frameRate: 10,
            repeat: -1
        });

        anims.create({
            key: `${texture}-attack`,
            frames: anims.generateFrameNumbers(texture, { start: 28, end: 31 }),
            frameRate: 12,
            repeat: 0
        });

        anims.create({
            key: `${texture}-hit`,
            frames: anims.generateFrameNumbers(texture, { start: 32, end: 33 }),
            frameRate: 8,
            repeat: 0
        });

        anims.create({
            key: `${texture}-death`,
            frames: anims.generateFrameNumbers(texture, { start: 34, end: 39 }),
            frameRate: 8,
            repeat: 0
        });
    }

    update(player) {
        if (this.state === 'dead') return;

        const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

        // Don't change state if currently attacking
        if (this.state !== 'attack') {
            if (distance <= this.detectionRadius) {
                this.state = 'chase';
            } else if (this.state === 'chase') {
                this.state = 'patrol';
            }
        }

        this.handleAI(player, distance);
    }

    handleAI(player, distance) {
        // Don't move if attacking, being hit, or dead
        if (this.isAttacking || this.state === 'dead') {
            this.setVelocity(0, 0);
            return;
        }

        // Allow knockback during hit animation
        const currentAnim = this.anims.currentAnim;
        if (currentAnim && currentAnim.key === `${this.texture.key}-hit` && this.anims.isPlaying) {
            return;
        }

        // Base AI behavior (can be overridden by subclasses)
        if (this.state === 'chase') {
            // Check if in attack range
            if (distance <= this.attackRange) {
                this.attack(player);
            } else {
                this.scene.physics.moveToObject(this, player, this.speed);
                this.play(`${this.texture.key}-walk`, true);
            }
        } else {
            this.setVelocity(0, 0);
            this.play(`${this.texture.key}-idle`, true);
        }
    }

    attack(player) {
        const currentTime = this.scene.time.now;
        
        if (currentTime - this.lastAttackTime < this.attackCooldown) {
            return false;
        }

        if (this.isAttacking || this.state === 'dead') {
            return false;
        }

        this.isAttacking = true;
        this.lastAttackTime = currentTime;
        this.setVelocity(0, 0);
        this.state = 'attack';
        
        this.play(`${this.texture.key}-attack`, true);

        // Deal damage mid-animation
        this.scene.time.delayedCall(200, () => {
            if (this.state !== 'dead' && player && player.active) {
                const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
                if (distance <= this.attackRange) {
                    if (this.scene.combatManager) {
                        this.scene.combatManager.damageEntity(player, this.damage, this);
                    } else {
                        player.takeDamage(this.damage, this);
                    }
                }
            }
        });

        this.once('animationcomplete', (anim) => {
            if (anim.key === `${this.texture.key}-attack`) {
                this.isAttacking = false;
                this.state = 'chase';
            }
        });

        return true;
    }

    takeDamage(amount, source) {
        if (this.state === 'dead' || this.isInvulnerable) return;

        this.health -= amount;
        console.log(`Enemy hit! Health: ${this.health}`);
        
        // Visual feedback
        this.setTint(0xff0000);
        this.scene.cameras.main.shake(50, 0.005);
        
        // Knockback
        if (source) {
            const angle = Phaser.Math.Angle.Between(source.x, source.y, this.x, this.y);
            const knockbackForce = 200;
            this.setVelocity(Math.cos(angle) * knockbackForce, Math.sin(angle) * knockbackForce);
        }
        
        this.play(`${this.texture.key}-hit`, true);

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
        this.state = 'dead';
        this.setVelocity(0, 0);
        this.body.enable = false;
        this.play(`${this.texture.key}-death`, true);

        if (this.scene.audioManager) {
            this.scene.audioManager.playSound('death');
        }
        
        // Grant XP to player
        this.grantXP();
        
        // Create death particle effect
        if (this.scene.particleManager) {
            this.scene.particleManager.createDeathExplosion(this.x, this.y, this.faction, 20);
        }
        
        // Screen shake on death
        if (this.scene.effectsManager) {
            this.scene.effectsManager.screenShake(3, 150);
        }
        
        this.on('animationcomplete', (anim) => {
            if (anim.key === `${this.texture.key}-death`) {
                // Trigger loot drop before destroying
                this.dropLoot();
                this.destroy();
            }
        });
    }
    
    grantXP() {
        // Emit XP event for the scene to handle
        this.scene.events.emit('enemy-defeated', {
            xpAmount: this.xpReward,
            enemy: this
        });
    }

    dropLoot() {
        // Check if scene has a loot manager
        if (this.scene.lootManager) {
            this.scene.lootManager.spawnLootAtPosition(this.x, this.y);
        }
    }
}
