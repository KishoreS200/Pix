import Enemy from './Enemy';
import Phaser from 'phaser';

export default class CorruptedHuman extends Enemy {
    constructor(scene, x, y, type = 'corrupted_human') {
        super(scene, x, y, 'corrupted_human', 'corrupted_human');
        
        this.health = 40;
        this.speed = 100;
        this.detectionRadius = 200;
        this.damage = 10;
        this.type = type;
        this.xpReward = 15; // Stronger than basic enemies

        this.startPos = { x, y };
        this.patrolRadius = 100;
        this.patrolTarget = { x: x + this.patrolRadius, y: y };
        this.targetIndex = 0;
        this.waypoints = [
            { x: x + this.patrolRadius, y: y },
            { x: x, y: y }
        ];
    }

    handleAI(player, distance) {
        if (this.state === 'chase' || distance <= this.detectionRadius) {
            this.state = 'chase';
            this.scene.physics.moveToObject(this, player, this.speed);
            this.play(`${this.texture.key}-walk`, true);
            this.setFlipX(player.x < this.x);
        } else {
            this.state = 'patrol';
            const target = this.waypoints[this.targetIndex];
            const distToTarget = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);

            if (distToTarget < 5) {
                this.targetIndex = (this.targetIndex + 1) % this.waypoints.length;
            }

            this.scene.physics.moveTo(this, target.x, target.y, this.speed);
            this.play(`${this.texture.key}-walk`, true);
            this.setFlipX(target.x < this.x);
        }
    }
}
