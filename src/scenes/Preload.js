import Phaser from 'phaser';
import silentVillage from '../assets/tilemaps/silent-village.json';
import forgottenForest from '../assets/tilemaps/forgotten-forest.json';
import crystalMines from '../assets/tilemaps/crystal-mines.json';
import brokenCity from '../assets/tilemaps/broken-city.json';
import theCore from '../assets/tilemaps/the-core.json';

export default class Preload extends Phaser.Scene {
    constructor() {
        super('Preload');
    }

    preload() {
        this.createPlaceholderSpritesheet();
        this.createTilesetSpritesheet();
        this.loadTilemaps();
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

    createTilesetSpritesheet() {
        const tileWidth = 32;
        const tileHeight = 32;
        const tilesPerRow = 8;
        const totalTiles = 16;
        const canvas = document.createElement('canvas');
        canvas.width = tileWidth * tilesPerRow;
        canvas.height = tileHeight * Math.ceil(totalTiles / tilesPerRow);
        const ctx = canvas.getContext('2d');

        // Tile 0: Transparent
        ctx.fillStyle = 'rgba(0, 0, 0, 0)';
        ctx.fillRect(0, 0, tileWidth, tileHeight);

        // Tile 1: Grass/Solid Wall (green)
        ctx.fillStyle = '#2d5016';
        ctx.fillRect(tileWidth, 0, tileWidth, tileHeight);
        ctx.fillStyle = '#3a6b1c';
        ctx.fillRect(tileWidth + 8, 8, 16, 16);

        // Tile 2: Path/Dirt (brown)
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(tileWidth * 2, 0, tileWidth, tileHeight);
        ctx.fillStyle = '#a0522d';
        ctx.fillRect(tileWidth * 2 + 6, 6, 20, 20);

        // Tile 3: Hazard (cracked red)
        ctx.fillStyle = '#8b0000';
        ctx.fillRect(tileWidth * 3, 0, tileWidth, tileHeight);
        ctx.strokeStyle = '#ff0000';
        ctx.beginPath();
        ctx.moveTo(tileWidth * 3 + 5, 5);
        ctx.lineTo(tileWidth * 3 + 27, 27);
        ctx.moveTo(tileWidth * 3 + 27, 5);
        ctx.lineTo(tileWidth * 3 + 5, 27);
        ctx.stroke();

        // Tile 4: Slow (bushes/water - blue)
        ctx.fillStyle = '#4682b4';
        ctx.fillRect(tileWidth * 4, 0, tileWidth, tileHeight);
        ctx.fillStyle = '#5f9ea0';
        for (let i = 0; i < 8; i++) {
            ctx.fillRect(tileWidth * 4 + (i * 4), (i % 2) * 16, 4, 16);
        }

        // Tile 5: Forest ground (dark green)
        ctx.fillStyle = '#1a3d0a';
        ctx.fillRect(tileWidth * 5, 0, tileWidth, tileHeight);
        ctx.fillStyle = '#2d4a1a';
        ctx.fillRect(tileWidth * 5 + 4, 4, 24, 24);

        // Tile 6: Tree (solid dark green)
        ctx.fillStyle = '#0f2d0f';
        ctx.fillRect(tileWidth * 6, 0, tileWidth, tileHeight);
        ctx.fillStyle = '#1a4a1a';
        ctx.fillRect(tileWidth * 6 + 8, 8, 16, 16);

        // Tile 7: Forest path (brown)
        ctx.fillStyle = '#654321';
        ctx.fillRect(tileWidth * 7, 0, tileWidth, tileHeight);
        ctx.fillStyle = '#7a5a3a';
        ctx.fillRect(tileWidth * 7 + 5, 5, 22, 22);

        // Tile 8: Mine floor (gray)
        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(0, tileHeight, tileWidth, tileHeight);
        ctx.fillStyle = '#5a5a5a';
        ctx.fillRect(0 + 8, tileHeight + 8, 16, 16);

        // Tile 9: Crystal (cyan)
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(tileWidth, tileHeight, tileWidth, tileHeight);
        ctx.fillStyle = '#40e0d0';
        ctx.beginPath();
        ctx.moveTo(tileWidth + 16, tileHeight + 8);
        ctx.lineTo(tileWidth + 24, tileHeight + 16);
        ctx.lineTo(tileWidth + 16, tileHeight + 24);
        ctx.lineTo(tileWidth + 8, tileHeight + 16);
        ctx.closePath();
        ctx.fill();

        // Tile 10: Mine wall (dark gray)
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(tileWidth * 2, tileHeight, tileWidth, tileHeight);
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(tileWidth * 2 + 6, tileHeight + 6, 20, 20);

        // Tile 11: City street (dark gray)
        ctx.fillStyle = '#333333';
        ctx.fillRect(tileWidth * 3, tileHeight, tileWidth, tileHeight);
        ctx.fillStyle = '#444444';
        ctx.fillRect(tileWidth * 3 + 10, tileHeight + 10, 12, 12);

        // Tile 12: Building (brown-gray)
        ctx.fillStyle = '#555555';
        ctx.fillRect(tileWidth * 4, tileHeight, tileWidth, tileHeight);
        ctx.fillStyle = '#666666';
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if ((i + j) % 2 === 0) {
                    ctx.fillRect(tileWidth * 4 + i * 8, tileHeight + j * 8, 8, 8);
                }
            }
        }

        // Tile 13: Core void (purple-black)
        ctx.fillStyle = '#1a001a';
        ctx.fillRect(tileWidth * 5, tileHeight, tileWidth, tileHeight);
        ctx.fillStyle = '#2d002d';
        ctx.fillRect(tileWidth * 5 + 12, tileHeight + 12, 8, 8);

        // Tile 14: Core anomaly (bright purple)
        ctx.fillStyle = '#8a2be2';
        ctx.fillRect(tileWidth * 6, tileHeight, tileWidth, tileHeight);
        ctx.fillStyle = '#9370db';
        ctx.fillRect(tileWidth * 6 + 8, tileHeight + 8, 16, 16);

        this.textures.addSpriteSheet('tileset', canvas, { 
            frameWidth: tileWidth, 
            frameHeight: tileHeight 
        });
    }

    loadTilemaps() {
        // Register tilemap data as JSON files
        this.cache.tilemap.add('silent-village', { data: silentVillage });
        this.cache.tilemap.add('forgotten-forest', { data: forgottenForest });
        this.cache.tilemap.add('crystal-mines', { data: crystalMines });
        this.cache.tilemap.add('broken-city', { data: brokenCity });
        this.cache.tilemap.add('the-core', { data: theCore });
        
        // Also load them with the loader for texture references
        this.load.image('tiles', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAABCAYAAAAk7j7bAAAACXBIWXMAAA7EAAAOxAGVKw4bAAABcklEQVR4nO3SsU0CURBA4a8G0AAaQANoAA2gATQAGkADaAANoAE0gAbQANrAq+x2b5K7i5vNR/7kUjK5nXZvZmdnZ2cKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZgG9ZBbIk8E7hAAAAAElFTkSuQmCC');
    }

    create() {
        this.scene.start('MainGame');
    }
}
