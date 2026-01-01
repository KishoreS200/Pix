import Phaser from 'phaser';

/**
 * Utility class for creating consistent, styled buttons throughout the game
 */
export default class ButtonFactory {
    /**
     * Create a styled button container
     * @param {Phaser.Scene} scene - The scene to add the button to
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} text - Button text
     * @param {Function} callback - Function to call when clicked
     * @param {Object} options - Optional styling overrides
     * @returns {Phaser.GameObjects.Container} Button container
     */
    static createButton(scene, x, y, text, callback, options = {}) {
        const width = options.width || 200;
        const height = options.height || 50;
        const fontSize = options.fontSize || '20px';
        const fontFamily = options.fontFamily || 'Arial';
        const fontStyle = options.fontStyle || 'bold';
        
        const button = scene.add.container(x, y);
        
        // Button background
        const bg = scene.add.graphics()
            .setInteractive(
                new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height),
                Phaser.Geom.Rectangle.Contains
            );
        
        // Default button colors (cyan/glitch theme)
        const bgColor = options.bgColor || 0x004444;
        const borderColor = options.borderColor || 0x00ffff;
        const textColor = options.textColor || '#00ffff';
        const hoverColor = options.hoverColor || 0x006666;
        
        bg.fillStyle(bgColor, 0.9);
        bg.fillRoundedRect(-width / 2, -height / 2, width, height, 8);
        bg.lineStyle(2, borderColor, 1);
        bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 8);
        
        // Button text
        const buttonText = scene.add.text(0, 0, text, {
            fontSize: fontSize,
            fill: textColor,
            fontFamily: fontFamily,
            fontStyle: fontStyle
        }).setOrigin(0.5);
        
        // Add glow effect
        buttonText.setShadow(2, 2, '#00ffff', 0, true, true);
        
        button.add([bg, buttonText]);
        
        // Hover effect
        bg.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(hoverColor, 0.95);
            bg.fillRoundedRect(-width / 2, -height / 2, width, height, 8);
            bg.lineStyle(2, 0xffffff, 1);
            bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 8);
            
            scene.tweens.add({
                targets: button,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 100
            });
        });
        
        bg.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(bgColor, 0.9);
            bg.fillRoundedRect(-width / 2, -height / 2, width, height, 8);
            bg.lineStyle(2, borderColor, 1);
            bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 8);
            
            scene.tweens.add({
                targets: button,
                scaleX: 1,
                scaleY: 1,
                duration: 100
            });
        });
        
        // Click handler
        bg.on('pointerdown', () => {
            // Visual feedback
            scene.tweens.add({
                targets: button,
                scaleX: 0.95,
                scaleY: 0.95,
                duration: 50,
                yoyo: true
            });
            
            // Play click sound if audio manager exists
            if (scene.audioManager && !scene.audioManager.muted) {
                scene.audioManager.playSound('menu-confirm', 0.6);
            }
            
            // Execute callback
            if (callback) {
                callback();
            }
        });
        
        return button;
    }
    
    /**
     * Create a small button (e.g., for close, back, etc.)
     */
    static createSmallButton(scene, x, y, text, callback, options = {}) {
        return this.createButton(scene, x, y, text, callback, {
            width: 120,
            height: 40,
            fontSize: '16px',
            ...options
        });
    }
    
    /**
     * Create a large button (e.g., for main actions)
     */
    static createLargeButton(scene, x, y, text, callback, options = {}) {
        return this.createButton(scene, x, y, text, callback, {
            width: 250,
            height: 60,
            fontSize: '24px',
            ...options
        });
    }
}
