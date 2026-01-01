import Phaser from 'phaser';
import Boot from './scenes/Boot';
import Preload from './scenes/Preload';
import Menu from './scenes/Menu';
import MainGame from './scenes/MainGame';

// Wait for DOM to be ready before initializing the game
function initializeGame() {
    const canvasElement = document.getElementById('game');
    
    if (!canvasElement) {
        console.error('Canvas element not found!');
        return;
    }
    
    // Ensure canvas has proper dimensions
    canvasElement.width = 800;
    canvasElement.height = 600;
    canvasElement.style.width = '800px';
    canvasElement.style.height = '600px';

    const config = {
        type: Phaser.CANVAS,
        canvas: canvasElement,
        width: 800,
        height: 600,
        physics: {
            default: 'arcade',
            arcade: {
                debug: false
            }
        },
        scene: [Boot, Preload, Menu, MainGame],
        render: {
            pixelArt: true,
            antialias: false
        }
    };

    console.log('Initializing Phaser game...');
    console.log('Canvas element:', canvasElement);

    try {
        window.game = new Phaser.Game(config);
        console.log('Game initialized:', window.game);
        console.log('Game type:', typeof window.game);
        console.log('Game instance check:', window.game instanceof Phaser.Game);
    } catch (error) {
        console.error('Failed to initialize Phaser game:', error);
        throw error;
    }
}

// Check if DOM is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initializeGame();
} else {
    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', initializeGame);
}
