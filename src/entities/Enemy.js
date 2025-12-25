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
        this.state = 'idle'; // 'idle', 'patrol', 'alert', 'chase', 'dead'
        this.lastDamageTime = 0;
        this.damageCooldown = 500;

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

        if (distance <= this.detectionRadius) {
            this.state = 'chase';
        } else if (this.state === 'chase') {
            this.state = 'patrol';
        }

        this.handleAI(player, distance);
    }

    handleAI(player, distance) {
        // Base AI behavior (can be overridden by subclasses)
        if (this.state === 'chase') {
            this.scene.physics.moveToObject(this, player, this.speed);
            this.play(`${this.texture.key}-walk`, true);
        } else {
            this.setVelocity(0, 0);
            this.play(`${this.texture.key}-idle`, true);
        }
    }

    takeDamage(amount) {
        if (this.state === 'dead') return;

        this.health -= amount;
        this.play(`${this.texture.key}-hit`, true);

        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        this.state = 'dead';
        this.setVelocity(0, 0);
        this.body.enable = false;
        this.play(`${this.texture.key}-death`, true);
        this.on('animationcomplete', (anim) => {
            if (anim.key === `${this.texture.key}-death`) {
                this.destroy();
            }
        });
    }
}
