import Phaser from 'phaser';
import Player from '../entities/Player';
import InputManager from '../systems/InputManager';

export default class MainGame extends Phaser.Scene {
    constructor() {
        super('MainGame');
    }

    create() {
        // Add a simple background grid to see movement
        this.add.grid(0, 0, 2000, 2000, 32, 32, 0x050505, 1, 0x111111, 1).setOrigin(0);

        this.physics.world.setBounds(0, 0, 2000, 2000);

        this.inputManager = new InputManager(this);
        this.player = new Player(this, 400, 300);

        this.cameras.main.setBounds(0, 0, 2000, 2000);
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setZoom(1);

        this.add.text(10, 10, 'WASD/Arrows to Move | SPACE to Attack', {
            fontSize: '16px',
            fill: '#00ffff'
        }).setScrollFactor(0);
    }

    update() {
        const movementVector = this.inputManager.getMovementVector();
        this.player.update(movementVector);

        if (this.inputManager.isAttackJustPressed()) {
            // Stub for Phase 6
            console.log('Attack pressed!');
            this.player.play('attack', true);
        }
    }
}
