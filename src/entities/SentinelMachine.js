import Enemy from './Enemy';
import Phaser from 'phaser';

export default class SentinelMachine extends Enemy {
    constructor(scene, x, y, type = 'sentinel_machine') {
        super(scene, x, y, 'sentinel_machine', 'sentinel_machine');
        
        this.health = 35;
        this.speed = (type === 'turret') ? 0 : 180;
        this.detectionRadius = 250;
        this.damage = 15;
        this.type = type;

        if (type === 'turret') {
            this.waypoints = [{ x, y }];
        } else {
            this.waypoints = [
                { x: x + 150, y: y },
                { x: x + 150, y: y + 150 },
                { x: x, y: y + 150 },
                { x: x, y: y }
            ];
        }
        this.targetIndex = 0;
        this.scanPauseTime = 0;
        this.isScanning = false;
    }

    handleAI(player, distance) {
        if (this.type === 'turret') {
            this.setVelocity(0, 0);
            if (distance <= this.detectionRadius) {
                this.state = 'alert';
                this.play(`${this.texture.key}-attack`, true);
            } else {
                this.state = 'idle';
                this.play(`${this.texture.key}-idle`, true);
            }
            return;
        }

        if (this.state === 'chase' || distance <= this.detectionRadius) {
            this.state = 'chase';
            // Predictable movement: move toward player but maybe in bursts or with delays
            // For now, direct chase is what most "predictable" enemies do if not specified otherwise
            this.scene.physics.moveToObject(this, player, this.speed);
            this.play(`${this.texture.key}-walk`, true);
        } else {
            this.state = 'patrol';
            
            if (this.isScanning) {
                if (this.scene.time.now > this.scanPauseTime) {
                    this.isScanning = false;
                }
                this.setVelocity(0, 0);
                this.play(`${this.texture.key}-idle`, true);
                return;
            }

            const target = this.waypoints[this.targetIndex];
            const distToTarget = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);

            if (distToTarget < 5) {
                this.targetIndex = (this.targetIndex + 1) % this.waypoints.length;
                this.isScanning = true;
                this.scanPauseTime = this.scene.time.now + 1000;
                this.setVelocity(0, 0);
                this.play(`${this.texture.key}-idle`, true);
            } else {
                this.scene.physics.moveTo(this, target.x, target.y, this.speed);
                this.play(`${this.texture.key}-walk`, true);
            }
        }
    }
}
