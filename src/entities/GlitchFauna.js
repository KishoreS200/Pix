import Enemy from './Enemy';
import Phaser from 'phaser';

export default class GlitchFauna extends Enemy {
    constructor(scene, x, y, type = 'glitch_fauna') {
        super(scene, x, y, 'glitch_fauna', 'glitch_fauna');
        
        this.health = 20;
        this.speed = 220;
        this.detectionRadius = 150;
        this.damage = 5;
        this.type = type;
        
        // Set XP based on subtype
        if (type === 'corrupted_wolf') {
            this.xpReward = 20; // Stronger variant
        } else {
            this.xpReward = 10; // Basic glitch bug
        }

        this.lastDirectionChange = 0;
        this.directionChangeInterval = Phaser.Math.Between(500, 1000);
        this.moveAngle = Math.random() * Math.PI * 2;
    }

    handleAI(player, distance) {
        const time = this.scene.time.now;

        if (this.state === 'chase' || distance <= this.detectionRadius) {
            this.state = 'chase';
            
            // Move toward player erratically
            if (time - this.lastDirectionChange > this.directionChangeInterval / 2) {
                this.lastDirectionChange = time;
                // Add some randomness to the angle toward player
                const angleToPlayer = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
                this.moveAngle = angleToPlayer + (Math.random() - 0.5) * 1; 
            }
        } else {
            this.state = 'patrol';
            // Random direction changes
            if (time - this.lastDirectionChange > this.directionChangeInterval) {
                this.lastDirectionChange = time;
                this.moveAngle = Math.random() * Math.PI * 2;
                this.directionChangeInterval = Phaser.Math.Between(500, 1000);
            }
        }

        const vx = Math.cos(this.moveAngle) * this.speed;
        const vy = Math.sin(this.moveAngle) * this.speed;
        this.setVelocity(vx, vy);
        this.play(`${this.texture.key}-walk`, true);
        
        // Flip sprite based on direction
        this.setFlipX(vx < 0);
    }
}
