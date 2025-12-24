import Phaser from 'phaser';

export default class Preload extends Phaser.Scene {
    constructor() {
        super('Preload');
    }

    preload() {
        this.createPlaceholderSpritesheet();
    }

    createPlaceholderSpritesheet() {
        const width = 32;
        const height = 32;
        const frames = 40;
        const canvas = document.createElement('canvas');
        canvas.width = width * frames;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        for (let i = 0; i < frames; i++) {
            // Draw dark cloak
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(i * width, 0, width, height);

            // Draw cyan core
            ctx.fillStyle = '#00ffff';
            ctx.fillRect(i * width + 12, 12, 8, 8);

            // Draw eyes
            ctx.fillStyle = '#ffffff'; // Normal eye
            ctx.fillRect(i * width + 8, 6, 4, 4);
            ctx.fillStyle = '#00ffff'; // Glowing eye
            ctx.fillRect(i * width + 20, 6, 4, 4);
            
            // Add a simple border to distinguish frames
            ctx.strokeStyle = '#333333';
            ctx.strokeRect(i * width, 0, width, height);

            // Add simple "animation" variation based on frame index
            ctx.fillStyle = 'rgba(0, 255, 255, 0.2)';
            if (i % 2 === 0) {
                ctx.fillRect(i * width + 10, 10, 12, 12);
            }
        }

        this.textures.addSpriteSheet('player', canvas, { frameWidth: 32, frameHeight: 32 });
    }

    create() {
        this.scene.start('MainGame');
    }
}
