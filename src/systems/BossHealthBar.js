import Phaser from 'phaser';

export default class BossHealthBar {
    constructor(scene) {
        this.scene = scene;
        this.container = null;
        this.barBg = null;
        this.barFill = null;
        this.nameText = null;
        this.phaseText = null;
        this.healthPercent = 100;
        this.isVisible = false;
        
        this._init();
    }
    
    _init() {
        const { width } = this.scene.cameras.main;
        
        // Create container for all health bar elements
        this.container = this.scene.add.container(width / 2, 60);
        this.container.setScrollFactor(0);
        this.container.setDepth(200); // High depth to appear above everything
        this.container.setVisible(false);
        
        // Background bar
        this.barBg = this.scene.add.graphics();
        this.barBg.setDepth(200);
        
        // Health fill bar
        this.barFill = this.scene.add.graphics();
        this.barFill.setDepth(201);
        
        // Boss name text
        this.nameText = this.scene.add.text(0, -35, '', {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        this.nameText.setOrigin(0.5, 1);
        this.nameText.setScrollFactor(0);
        this.nameText.setDepth(202);
        this.nameText.setShadow(2, 2, '#000000', 4);
        
        // Phase text
        this.phaseText = this.scene.add.text(0, -18, '', {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#00ffff'
        });
        this.phaseText.setOrigin(0.5, 1);
        this.phaseText.setScrollFactor(0);
        this.phaseText.setDepth(202);
        
        // Add graphics to container
        this.container.add([this.barBg, this.barFill, this.nameText, this.phaseText]);
    }
    
    show(boss) {
        if (!boss || !boss.config) return;
        
        this.currentBoss = boss;
        this.isVisible = true;
        this.container.setVisible(true);
        
        // Set boss name
        this.nameText.setText(boss.name);
        
        // Update phase
        this.updatePhase(boss.currentPhase + 1, boss.config.phases[boss.currentPhase + 1]?.color || 0x00ff00);
        
        // Update health bar
        this.healthPercent = 100;
        this.updateHealth(boss.currentHealth, boss.maxHealth);
        
        // Add entrance animation
        this.scene.tweens.add({
            targets: this.container,
            y: 60,
            duration: 300,
            ease: 'Back.easeOut'
        });
        
        // Listen for boss events
        this.scene.events.on('boss-damage', this.onBossDamage, this);
        this.scene.events.on('boss-phase-change', this.onPhaseChange, this);
        this.scene.events.on('boss-defeated', this.onBossDefeated, this);
    }
    
    hide() {
        if (!this.isVisible) return;
        
        this.isVisible = false;
        
        // Exit animation
        this.scene.tweens.add({
            targets: this.container,
            y: -50,
            alpha: 0,
            duration: 300,
            ease: 'Back.easeIn',
            onComplete: () => {
                this.container.setVisible(false);
                this.container.setAlpha(1);
            }
        });
        
        // Remove event listeners
        this.scene.events.off('boss-damage', this.onBossDamage, this);
        this.scene.events.off('boss-phase-change', this.onPhaseChange, this);
        this.scene.events.off('boss-defeated', this.onBossDefeated, this);
    }
    
    updateHealth(currentHealth, maxHealth) {
        if (!this.isVisible || maxHealth <= 0) return;
        
        const targetPercent = Math.max(0, (currentHealth / maxHealth) * 100);
        
        // Animate health change
        this.scene.tweens.add({
            targets: { health: this.healthPercent },
            health: targetPercent,
            duration: 200,
            ease: 'Power2',
            onUpdate: (tween) => {
                this.healthPercent = tween.targets.health;
                this.drawHealthBar();
            }
        });
    }
    
    updatePhase(phase, color) {
        if (!this.isVisible) return;
        
        this.phaseText.setText(`PHASE ${phase}`);
        this.phaseText.setColor(`#${color.toString(16).padStart(6, '0')}`);
        
        // Pulse effect on phase change
        this.scene.tweens.add({
            targets: [this.nameText, this.phaseText],
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 150,
            yoyo: true,
            ease: 'Back.easeOut'
        });
    }
    
    drawHealthBar() {
        const barWidth = 400;
        const barHeight = 20;
        const x = -barWidth / 2;
        const y = 0;
        
        // Clear previous graphics
        this.barBg.clear();
        this.barFill.clear();
        
        // Background (dark)
        this.barBg.fillStyle(0x000000, 0.8);
        this.barBg.fillRoundedRect(x, y, barWidth, barHeight, 4);
        
        // Border
        this.barBg.lineStyle(2, 0x00ffff, 0.8);
        this.barBg.strokeRoundedRect(x, y, barWidth, barHeight, 4);
        
        // Determine bar color based on health and phase
        let barColor = 0x00ff00; // Green
        if (this.healthPercent <= 33) {
            barColor = 0xff0000; // Red (critical)
        } else if (this.healthPercent <= 66) {
            barColor = 0xffff00; // Yellow (medium)
        }
        
        // Phase tint - blend phase color with health color
        if (this.currentBoss && this.currentBoss.phaseConfig) {
            const phaseColor = this.currentBoss.phaseConfig.color;
            if (phaseColor && this.currentBoss.currentPhase >= 1) {
                // Blend colors for phase 2+
                barColor = this.blendColors(barColor, phaseColor, 0.3);
            }
        }
        
        // Fill amount
        const fillWidth = (this.healthPercent / 100) * barWidth;
        
        // Draw fill with gradient effect
        this.barFill.fillStyle(barColor, 0.9);
        this.barFill.fillRoundedRect(x + 2, y + 2, Math.max(0, fillWidth - 4), barHeight - 4, 3);
        
        // Add glow effect for low health
        if (this.healthPercent <= 33) {
            this.barFill.lineStyle(1, 0xff0000, 0.5);
            this.barFill.strokeRoundedRect(x + 2, y + 2, Math.max(0, fillWidth - 4), barHeight - 4, 3);
        }
        
        // Percentage text
        const percentText = `${Math.round(this.healthPercent)}%`;
        const percentDisplay = this.scene.add.text(x + barWidth - 5, y + barHeight / 2, percentText, {
            fontSize: '11px',
            fontFamily: 'monospace',
            color: '#ffffff'
        });
        percentDisplay.setOrigin(1, 0.5);
        percentDisplay.setScrollFactor(0);
        percentDisplay.setDepth(203);
        
        // Remove old percent text
        if (this.percentTextDisplay && this.percentTextDisplay.active) {
            this.percentTextDisplay.destroy();
        }
        this.percentTextDisplay = percentDisplay;
        
        // Add to container
        this.container.add(percentDisplay);
    }
    
    blendColors(color1, color2, ratio) {
        const r1 = (color1 >> 16) & 0xff;
        const g1 = (color1 >> 8) & 0xff;
        const b1 = color1 & 0xff;
        
        const r2 = (color2 >> 16) & 0xff;
        const g2 = (color2 >> 8) & 0xff;
        const b2 = color2 & 0xff;
        
        const r = Math.round(r1 + (r2 - r1) * ratio);
        const g = Math.round(g1 + (g2 - g1) * ratio);
        const b = Math.round(b1 + (b2 - b1) * ratio);
        
        return (r << 16) | (g << 8) | b;
    }
    
    onBossDamage(event) {
        if (!this.currentBoss || event.boss !== this.currentBoss) return;
        
        this.updateHealth(event.currentHealth, event.maxHealth);
    }
    
    onPhaseChange(event) {
        if (!this.currentBoss || event.boss !== this.currentBoss) return;
        
        this.updatePhase(event.phase, event.color);
    }
    
    onBossDefeated(event) {
        if (!this.currentBoss || event.boss !== this.currentBoss) return;
        
        // Hide health bar after defeat
        this.scene.time.delayedCall(500, () => {
            this.hide();
        });
    }
    
    update() {
        // Update position if camera has moved
        if (this.container) {
            const { width } = this.scene.cameras.main;
            this.container.setX(width / 2);
        }
    }
    
    cleanup() {
        this.hide();
        
        if (this.barBg) {
            this.barBg.destroy();
            this.barBg = null;
        }
        
        if (this.barFill) {
            this.barFill.destroy();
            this.barFill = null;
        }
        
        if (this.container) {
            this.container.destroy();
            this.container = null;
        }
        
        this.scene.events.off('boss-damage', this.onBossDamage, this);
        this.scene.events.off('boss-phase-change', this.onPhaseChange, this);
        this.scene.events.off('boss-defeated', this.onBossDefeated, this);
    }
    
    destroy() {
        this.cleanup();
    }
}
