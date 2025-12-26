import Phaser from 'phaser';

export default class EffectsManager {
    constructor(scene) {
        this.scene = scene;
        this.flashOverlay = null;
        this.chromaticEnabled = false;
        
        this.initFlashOverlay();
    }
    
    /**
     * Initialize the flash overlay
     */
    initFlashOverlay() {
        // Create invisible overlay for flash effects
        this.flashOverlay = this.scene.add.rectangle(
            0, 0,
            this.scene.cameras.main.width,
            this.scene.cameras.main.height,
            0xffffff,
            0
        );
        this.flashOverlay.setOrigin(0, 0);
        this.flashOverlay.setScrollFactor(0);
        this.flashOverlay.setDepth(1000);
    }
    
    /**
     * Create a screen flash effect
     * @param {number} color - Hex color value
     * @param {number} duration - Duration in ms (default: 100)
     * @param {number} intensity - Alpha intensity 0-1 (default: 0.6)
     */
    screenFlash(color = 0xffffff, duration = 100, intensity = 0.6) {
        if (!this.flashOverlay || !this.flashOverlay.active) {
            this.initFlashOverlay();
        }
        
        this.flashOverlay.setFillStyle(color, intensity);
        this.flashOverlay.setAlpha(intensity);
        
        // Fade out quickly
        this.scene.tweens.add({
            targets: this.flashOverlay,
            alpha: 0,
            duration: duration,
            ease: 'Power2',
            onComplete: () => {
                this.flashOverlay.setAlpha(0);
            }
        });
        
        // Emit audio event
        this.scene.events.emit('effect-flash', { color, duration, intensity });
    }
    
    /**
     * Screen shake effect (delegates to camera manager)
     * @param {number} intensity - Shake intensity (default: 5)
     * @param {number} duration - Duration in ms (default: 200)
     */
    screenShake(intensity = 5, duration = 200) {
        if (this.scene.cameraManager) {
            this.scene.cameraManager.shake(intensity, duration);
        } else {
            // Fallback to built-in camera shake
            this.scene.cameras.main.shake(duration, intensity * 0.001);
        }
    }
    
    /**
     * Chromatic aberration effect (glitch effect)
     * @param {number} duration - Duration in ms (default: 200)
     * @param {number} intensity - Intensity of the effect (default: 5)
     */
    chromaticAberration(duration = 200, intensity = 5) {
        // Create red and cyan offset layers for chromatic aberration
        const camera = this.scene.cameras.main;
        
        // Get current camera position
        const scrollX = camera.scrollX;
        const scrollY = camera.scrollY;
        const width = camera.width;
        const height = camera.height;
        
        // Create colored overlays with offset
        const redOverlay = this.scene.add.rectangle(
            scrollX, scrollY,
            width, height,
            0xff0000, 0.15
        );
        redOverlay.setOrigin(0, 0);
        redOverlay.setScrollFactor(0);
        redOverlay.setDepth(999);
        redOverlay.setBlendMode(Phaser.BlendModes.ADD);
        
        const cyanOverlay = this.scene.add.rectangle(
            scrollX, scrollY,
            width, height,
            0x00ffff, 0.15
        );
        cyanOverlay.setOrigin(0, 0);
        cyanOverlay.setScrollFactor(0);
        cyanOverlay.setDepth(999);
        cyanOverlay.setBlendMode(Phaser.BlendModes.ADD);
        
        // Animate offset and fade
        const offsetAmount = intensity;
        
        this.scene.tweens.add({
            targets: redOverlay,
            x: scrollX - offsetAmount,
            alpha: 0,
            duration: duration,
            ease: 'Power2',
            onComplete: () => {
                redOverlay.destroy();
            }
        });
        
        this.scene.tweens.add({
            targets: cyanOverlay,
            x: scrollX + offsetAmount,
            alpha: 0,
            duration: duration,
            ease: 'Power2',
            onComplete: () => {
                cyanOverlay.destroy();
            }
        });
        
        // Emit audio event
        this.scene.events.emit('effect-chromatic', { duration, intensity });
    }
    
    /**
     * Combined effect: flash + shake + chromatic (for major events)
     * @param {string} type - Effect type: 'damage', 'levelup', 'boss'
     */
    majorEvent(type = 'damage') {
        switch (type) {
            case 'damage':
                this.screenFlash(0xff0000, 100, 0.4);
                this.screenShake(8, 150);
                break;
                
            case 'levelup':
                this.screenFlash(0xFFD700, 150, 0.5);
                this.screenShake(10, 200);
                this.chromaticAberration(200, 6);
                break;
                
            case 'boss':
                this.screenFlash(0x8b00ff, 200, 0.6);
                this.screenShake(15, 300);
                this.chromaticAberration(300, 8);
                break;
                
            case 'boss-death':
                this.screenFlash(0xFFD700, 300, 0.7);
                this.screenShake(20, 500);
                
                // Multiple chromatic pulses
                this.chromaticAberration(250, 10);
                this.scene.time.delayedCall(200, () => this.chromaticAberration(250, 8));
                this.scene.time.delayedCall(400, () => this.chromaticAberration(250, 6));
                break;
                
            default:
                this.screenFlash(0xffffff, 100, 0.3);
                this.screenShake(5, 150);
        }
    }
    
    /**
     * Damage-based flash intensity
     * @param {number} damage - Damage amount
     * @param {number} maxHealth - Max health for scaling
     */
    damageFlash(damage, maxHealth) {
        // Scale intensity based on damage percentage
        const damagePercent = damage / maxHealth;
        const intensity = Phaser.Math.Clamp(0.3 + damagePercent * 0.5, 0.3, 0.8);
        const shakePower = Phaser.Math.Clamp(5 + damagePercent * 15, 5, 20);
        
        this.screenFlash(0xff0000, 100, intensity);
        this.screenShake(shakePower, 150);
    }
    
    /**
     * Glitch text effect (for boss names, etc.)
     * @param {Phaser.GameObjects.Text} textObject - Text to glitch
     * @param {number} duration - Duration in ms
     */
    glitchText(textObject, duration = 200) {
        if (!textObject || !textObject.active) return;
        
        const originalX = textObject.x;
        const originalText = textObject.text;
        
        // Random character replacement
        const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?~';
        let glitchCount = 0;
        const maxGlitches = 5;
        const interval = duration / maxGlitches;
        
        const doGlitch = () => {
            if (glitchCount >= maxGlitches || !textObject.active) {
                textObject.setText(originalText);
                textObject.setX(originalX);
                return;
            }
            
            // Replace random characters
            let glitched = originalText.split('');
            for (let i = 0; i < 2; i++) {
                const index = Phaser.Math.Between(0, glitched.length - 1);
                glitched[index] = glitchChars[Phaser.Math.Between(0, glitchChars.length - 1)];
            }
            textObject.setText(glitched.join(''));
            
            // Random offset
            textObject.setX(originalX + Phaser.Math.Between(-3, 3));
            
            glitchCount++;
            
            if (glitchCount < maxGlitches) {
                this.scene.time.delayedCall(interval, doGlitch);
            } else {
                this.scene.time.delayedCall(interval, () => {
                    if (textObject.active) {
                        textObject.setText(originalText);
                        textObject.setX(originalX);
                    }
                });
            }
        };
        
        doGlitch();
    }
    
    /**
     * Scanline effect (optional retro CRT effect)
     */
    createScanlines() {
        const camera = this.scene.cameras.main;
        const graphics = this.scene.add.graphics();
        graphics.setScrollFactor(0);
        graphics.setDepth(998);
        
        // Draw horizontal lines
        for (let y = 0; y < camera.height; y += 4) {
            graphics.fillStyle(0x000000, 0.1);
            graphics.fillRect(0, y, camera.width, 2);
        }
        
        return graphics;
    }
    
    /**
     * Vignette effect (darken edges)
     */
    createVignette() {
        const camera = this.scene.cameras.main;
        const centerX = camera.width / 2;
        const centerY = camera.height / 2;
        const radius = Math.max(camera.width, camera.height) / 2;
        
        const vignette = this.scene.add.graphics();
        vignette.setScrollFactor(0);
        vignette.setDepth(997);
        
        // Radial gradient effect (approximated with circles)
        for (let i = 0; i < 10; i++) {
            const alpha = i * 0.02;
            const r = radius * (1 + i * 0.1);
            vignette.fillStyle(0x000000, alpha);
            vignette.fillCircle(centerX, centerY, r);
        }
        
        return vignette;
    }
    
    /**
     * Cleanup effects
     */
    cleanup() {
        if (this.flashOverlay && this.flashOverlay.active) {
            this.flashOverlay.destroy();
        }
        this.flashOverlay = null;
    }
    
    destroy() {
        this.cleanup();
    }
}
