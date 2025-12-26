import Phaser from 'phaser';
import FloatingText from '../utils/FloatingText';

export default class CombatManager {
    constructor(scene) {
        this.scene = scene;
        this.activeHitboxes = [];
        this.colliders = [];
    }

    createAttackHitbox(attacker, range, width, direction) {
        let offsetX = 0;
        let offsetY = 0;

        switch (direction) {
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

        const hitboxX = attacker.x + offsetX;
        const hitboxY = attacker.y + offsetY;

        const hitboxWidth = (direction === 'left' || direction === 'right') ? range : width;
        const hitboxHeight = (direction === 'up' || direction === 'down') ? range : width;

        const hitbox = this.scene.add.rectangle(hitboxX, hitboxY, hitboxWidth, hitboxHeight, 0xff0000, 0);
        this.scene.physics.add.existing(hitbox);
        hitbox.body.setAllowGravity(false);

        hitbox.attackerRef = attacker;
        hitbox.damage = attacker.attackDamage || 15;

        this.activeHitboxes.push(hitbox);

        this.scene.time.delayedCall(100, () => {
            this.destroyHitbox(hitbox);
        });

        return hitbox;
    }

    destroyHitbox(hitbox) {
        const index = this.activeHitboxes.indexOf(hitbox);
        if (index > -1) {
            this.activeHitboxes.splice(index, 1);
        }
        if (hitbox && hitbox.active) {
            hitbox.destroy();
        }
    }

    damageEntity(target, amount, attacker) {
        if (!target || !target.active || target.state === 'dead') return;

        if (target.takeDamage) {
            target.takeDamage(amount, attacker);
        }

        // Use attacker's current knockback force if available, otherwise use defaults
        const knockbackForce = attacker && attacker.currentKnockbackForce 
            ? attacker.currentKnockbackForce 
            : (target.constructor.name === 'Player' ? 250 : 200);
        
        const knockback = this.calculateKnockback(attacker, target, knockbackForce);
        target.setVelocity(knockback.x, knockback.y);

        // Show floating damage text
        if (target.constructor.name === 'Enemy') {
            FloatingText.showDamage(this.scene, target.x, target.y - 20, amount);
        }
    }

    calculateKnockback(attacker, target, force) {
        const angle = Phaser.Math.Angle.Between(attacker.x, attacker.y, target.x, target.y);
        return {
            x: Math.cos(angle) * force,
            y: Math.sin(angle) * force
        };
    }

    setupAttackCollisions(player, enemies) {
        this.scene.physics.add.overlap(null, null, (hitbox, target) => {
            if (!hitbox.attackerRef || !target) return;

            const isPlayerAttack = hitbox.attackerRef === player;
            const isEnemyTarget = enemies.contains(target);

            if (isPlayerAttack && isEnemyTarget) {
                if (target.state !== 'dead' && !target.isInvulnerable) {
                    this.damageEntity(target, hitbox.damage, hitbox.attackerRef);
                    this.destroyHitbox(hitbox);
                }
            }
        }, null, this);
    }

    checkHitboxCollisions(hitbox, targets) {
        if (!hitbox || !hitbox.active) return;

        targets.getChildren().forEach((target) => {
            if (!target || !target.active || target.state === 'dead' || target.isInvulnerable) return;

            const bounds1 = hitbox.getBounds();
            const bounds2 = target.getBounds();

            if (Phaser.Geom.Intersects.RectangleToRectangle(bounds1, bounds2)) {
                this.damageEntity(target, hitbox.damage, hitbox.attackerRef);
                this.destroyHitbox(hitbox);
            }
        });
    }

    cleanup() {
        this.activeHitboxes.forEach((hitbox) => {
            if (hitbox && hitbox.active) {
                hitbox.destroy();
            }
        });
        this.activeHitboxes = [];

        this.colliders.forEach((collider) => {
            if (collider && collider.destroy) {
                collider.destroy();
            }
        });
        this.colliders = [];
    }

    destroy() {
        this.cleanup();
    }
}
