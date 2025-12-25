import Phaser from 'phaser';

export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);

        // Properties
        this.health = 100;
        this.speed = 200;
        this.facingDirection = 'down';
        this.isInvulnerable = false;
        this.invulnerabilityDuration = 500;

        this.setupAnimations();
    }

    takeDamage(amount, source) {
        if (this.isInvulnerable || this.health <= 0) return;

        this.health = Math.max(0, this.health - amount);
        console.log(`Player hit! Health: ${this.health}`);

        // Visual feedback
        this.setTint(0xff0000);
        this.scene.cameras.main.shake(100, 0.01);

        // Knockback
        if (source) {
            const angle = Phaser.Math.Angle.Between(source.x, source.y, this.x, this.y);
            const knockbackForce = 150;
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
