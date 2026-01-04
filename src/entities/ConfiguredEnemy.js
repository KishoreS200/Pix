import Phaser from 'phaser';
import Enemy from './Enemy';
import { EnemyTypeConfig } from '../utils/EnemyConfig';

export default class ConfiguredEnemy extends Enemy {
    constructor(scene, x, y, enemyKey) {
        const config = EnemyTypeConfig[enemyKey];
        super(scene, x, y, enemyKey, config?.faction ?? enemyKey);

        this.enemyKey = enemyKey;
        this.config = config;

        if (config) {
            this.health = config.health;
            this.speed = config.speed;
            this.detectionRadius = config.detectionRadius;
            this.damage = config.damage;
            this.attackRange = config.attackRange;
            this.attackCooldown = config.attackCooldown;
            this.xpReward = config.xpReward;
            this.behavior = config.behavior;
        } else {
            this.behavior = 'chase';
        }

        this._ai = {
            lastDirectionChange: 0,
            directionChangeInterval: Phaser.Math.Between(400, 900),
            moveAngle: Math.random() * Math.PI * 2,
            pounceCooldown: 0,
            warpCooldown: 0,
            isTurret: this.behavior === 'turret_or_patrol' && this.speed === 0
        };
    }

    handleAI(player, distance) {
        const now = this.scene.time.now;

        if (this.isAttacking || this.state === 'dead') {
            this.setVelocity(0, 0);
            return;
        }

        switch (this.behavior) {
            case 'jitter':
            case 'scurry': {
                this.state = (distance <= this.detectionRadius) ? 'chase' : 'patrol';

                const interval = this.behavior === 'scurry' ? this._ai.directionChangeInterval * 0.6 : this._ai.directionChangeInterval;

                if (now - this._ai.lastDirectionChange > interval) {
                    this._ai.lastDirectionChange = now;
                    const angleToPlayer = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
                    const wobble = this.behavior === 'scurry' ? 1.2 : 0.9;
                    this._ai.moveAngle = (this.state === 'chase')
                        ? angleToPlayer + (Math.random() - 0.5) * wobble
                        : Math.random() * Math.PI * 2;
                }

                const vx = Math.cos(this._ai.moveAngle) * this.speed;
                const vy = Math.sin(this._ai.moveAngle) * this.speed;
                this.setVelocity(vx, vy);
                this.play(`${this.texture.key}-walk`, true);
                this.setFlipX(vx < 0);

                if (this.state === 'chase' && distance <= this.attackRange) {
                    this.attack(player);
                }
                break;
            }

            case 'pounce': {
                this.state = (distance <= this.detectionRadius) ? 'chase' : 'patrol';

                if (this._ai.pounceCooldown > 0) {
                    this._ai.pounceCooldown -= this.scene.game.loop.delta;
                }

                if (this.state === 'chase' && distance <= this.attackRange && this._ai.pounceCooldown <= 0) {
                    this._ai.pounceCooldown = 1600;
                    const angleToPlayer = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
                    this.setVelocity(Math.cos(angleToPlayer) * (this.speed * 2.2), Math.sin(angleToPlayer) * (this.speed * 2.2));
                    this.play(`${this.texture.key}-attack`, true);
                    this.scene.time.delayedCall(220, () => {
                        if (!this.active || this.state === 'dead') return;
                        this.attack(player);
                    });
                } else if (this.state === 'chase') {
                    this.scene.physics.moveToObject(this, player, this.speed);
                    this.play(`${this.texture.key}-walk`, true);
                    this.setFlipX(player.x < this.x);
                } else {
                    this.setVelocity(0, 0);
                    this.play(`${this.texture.key}-idle`, true);
                }
                break;
            }

            case 'phase': {
                this.state = (distance <= this.detectionRadius) ? 'chase' : 'idle';

                if (this.state === 'chase') {
                    const angleToPlayer = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
                    const offset = Math.sin(now / 250) * 0.8;
                    this.setVelocity(Math.cos(angleToPlayer + offset) * this.speed, Math.sin(angleToPlayer + offset) * this.speed);
                    this.play(`${this.texture.key}-walk`, true);
                    this.setFlipX(player.x < this.x);

                    if (distance <= this.attackRange) {
                        this.attack(player);
                    }
                } else {
                    this.setVelocity(0, 0);
                    this.play(`${this.texture.key}-idle`, true);
                }
                break;
            }

            case 'slow_chase': {
                if (distance <= this.detectionRadius) {
                    this.state = 'chase';
                    this.scene.physics.moveToObject(this, player, this.speed);
                    this.play(`${this.texture.key}-walk`, true);
                    this.setFlipX(player.x < this.x);

                    if (distance <= this.attackRange) {
                        this.attack(player);
                    }
                } else {
                    this.state = 'idle';
                    this.setVelocity(0, 0);
                    this.play(`${this.texture.key}-idle`, true);
                }
                break;
            }

            case 'turret_or_patrol': {
                if (this.speed === 0) {
                    this.setVelocity(0, 0);
                    if (distance <= this.detectionRadius) {
                        this.state = 'attack';
                        this.play(`${this.texture.key}-attack`, true);
                        this.attack(player);
                    } else {
                        this.state = 'idle';
                        this.play(`${this.texture.key}-idle`, true);
                    }
                    return;
                }

                if (distance <= this.detectionRadius) {
                    this.state = 'chase';
                    this.scene.physics.moveToObject(this, player, this.speed);
                    this.play(`${this.texture.key}-walk`, true);
                } else {
                    this.state = 'patrol';
                    if (now - this._ai.lastDirectionChange > this._ai.directionChangeInterval) {
                        this._ai.lastDirectionChange = now;
                        this._ai.moveAngle = Math.random() * Math.PI * 2;
                    }
                    this.setVelocity(Math.cos(this._ai.moveAngle) * this.speed, Math.sin(this._ai.moveAngle) * this.speed);
                    this.play(`${this.texture.key}-walk`, true);
                }
                break;
            }

            case 'aggressive':
            case 'elite': {
                if (distance <= this.detectionRadius) {
                    this.state = 'chase';
                    const speedBoost = this.behavior === 'elite' ? 1.15 : 1.0;
                    this.scene.physics.moveToObject(this, player, this.speed * speedBoost);
                    this.play(`${this.texture.key}-walk`, true);
                    this.setFlipX(player.x < this.x);

                    if (distance <= this.attackRange) {
                        this.attack(player);
                    }
                } else {
                    this.state = 'idle';
                    this.setVelocity(0, 0);
                    this.play(`${this.texture.key}-idle`, true);
                }
                break;
            }

            case 'warp': {
                if (this._ai.warpCooldown > 0) {
                    this._ai.warpCooldown -= this.scene.game.loop.delta;
                }

                if (distance <= this.detectionRadius) {
                    this.state = 'chase';

                    if (distance <= 120 && this._ai.warpCooldown <= 0) {
                        this._ai.warpCooldown = 2500;
                        const angle = Math.random() * Math.PI * 2;
                        const warpDistance = 120;
                        this.setPosition(this.x + Math.cos(angle) * warpDistance, this.y + Math.sin(angle) * warpDistance);
                        this.scene.cameras.main.shake(60, 0.003);
                    }

                    this.scene.physics.moveToObject(this, player, this.speed);
                    this.play(`${this.texture.key}-walk`, true);
                    this.setFlipX(player.x < this.x);

                    if (distance <= this.attackRange) {
                        this.attack(player);
                    }
                } else {
                    this.state = 'idle';
                    this.setVelocity(0, 0);
                    this.play(`${this.texture.key}-idle`, true);
                }
                break;
            }

            default: {
                super.handleAI(player, distance);
            }
        }
    }
}
