import Phaser from 'phaser';
import Boot from './scenes/Boot';
import Preload from './scenes/Preload';
import MainGame from './scenes/MainGame';

const config = {
    type: Phaser.AUTO,
    canvas: document.getElementById('game'),
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: [Boot, Preload, MainGame],
    render: {
        pixelArt: true,
        antialias: false
    }
};

const game = new Phaser.Game(config);
