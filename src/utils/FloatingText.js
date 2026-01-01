import Phaser from 'phaser';

export default class FloatingText {
    constructor(scene, x, y, text, style = {}) {
        // Default style
        const defaultStyle = {
            fontSize: '16px',
            fill: '#00ffff', // Cyan
            fontFamily: 'Arial',
            align: 'center'
        };

        const mergedStyle = { ...defaultStyle, ...style };

        this.text = scene.add.text(x, y, text, mergedStyle);
        this.text.setScrollFactor(0);
        this.text.setDepth(100); // Ensure it's above everything
        this.text.setOrigin(0.5, 0.5);

        // Animation: float up and fade out
        scene.tweens.add({
            targets: this.text,
            y: y - 50,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                this.text.destroy();
            }
        });
    }

    static showDamage(scene, x, y, amount) {
        new FloatingText(scene, x, y, `-${amount}`, {
            fill: '#ffffff', // White for damage
            fontSize: '18px'
        });
    }

    static showHealing(scene, x, y, amount) {
        new FloatingText(scene, x, y, `+${amount} HP`, {
            fill: '#00ff00', // Green for healing
            fontSize: '18px'
        });
    }

    static showCoins(scene, x, y, amount) {
        new FloatingText(scene, x, y, `+${amount} coins`, {
            fill: '#FFD700', // Gold for coins
            fontSize: '18px'
        });
    }

    static showPowerUp(scene, x, y) {
        new FloatingText(scene, x, y, 'POWER UP!', {
            fill: '#00ffff', // Cyan for power-ups
            fontSize: '20px',
            fontWeight: 'bold'
        });
    }

    static showItemPickup(scene, x, y, itemName) {
        new FloatingText(scene, x, y, `+${itemName}`, {
            fill: '#00ffff', // Cyan for items
            fontSize: '18px'
        });
    }

    static showXP(scene, x, y, amount) {
        new FloatingText(scene, x, y, `+${amount} XP`, {
            fill: '#FFD700', // Gold for XP
            fontSize: '18px'
        });
    }

    static showLevelUp(scene, x, y, level) {
        const text = scene.add.text(x, y, 'LEVEL UP!', {
            fontSize: '32px',
            fill: '#FFD700', // Gold
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        });

        text.setScrollFactor(0);
        text.setDepth(200);
        text.setOrigin(0.5, 0.5);

        // Scale up animation
        scene.tweens.add({
            targets: text,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 1,
            duration: 200,
            ease: 'Back.easeOut',
            onComplete: () => {
                // Scale down and fade out
                scene.tweens.add({
                    targets: text,
                    scaleX: 1,
                    scaleY: 1,
                    alpha: 0,
                    duration: 800,
                    delay: 500,
                    ease: 'Power2',
                    onComplete: () => {
                        text.destroy();
                    }
                });
            }
        });
    }

    static showBossDamage(scene, x, y, amount) {
        new FloatingText(scene, x, y, `-${amount}`, {
            fill: '#ff4444', // Red for boss damage
            fontSize: '24px',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        });
    }

    static showBossXP(scene, x, y, amount) {
        new FloatingText(scene, x, y, `+${amount} XP`, {
            fill: '#ff00ff', // Magenta for boss XP
            fontSize: '22px',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        });
    }

    static showBossPhase(scene, x, y, phaseName) {
        const text = scene.add.text(x, y, phaseName, {
            fontSize: '28px',
            fill: '#ff0000',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        });

        text.setScrollFactor(0);
        text.setDepth(200);
        text.setOrigin(0.5, 0.5);

        // Glitch and fade animation
        scene.tweens.add({
            targets: text,
            y: y - 30,
            alpha: 0,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => {
                text.destroy();
            }
        });
    }
}