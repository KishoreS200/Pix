import Phaser from 'phaser';

export default class SettingsMenu {
    constructor(scene) {
        this.scene = scene;
        this.audioManager = scene.audioManager;
        
        this.isOpen = false;
        this.isPaused = false;
        
        this.container = null;
        this.overlay = null;
        this.sliders = {};
        this.volumeTexts = {};
        this.previewTimeouts = {};
        this.settingsIndicator = null;
        
        // UI styling constants
        this.styles = {
            width: 500,
            height: 530, // Increased height to accommodate dynamic music controls
            backgroundColor: 0x0a0a0a,
            borderColor: 0x00ffff,
            borderWidth: 3,
            textColor: '#00ffff',
            sliderBgColor: 0x222222,
            sliderFillColor: 0x00ffff,
            buttonColor: 0x006666,
            buttonHoverColor: 0x00aaaa
        };
        
        this.setupKeyboardListener();
        this.createSettingsIndicator();
    }
    
    createSettingsIndicator() {
        const { width } = this.scene.cameras.main;
        const iconSize = 30;
        const padding = 10;
        const x = width - iconSize / 2 - padding;
        const y = iconSize / 2 + padding;
        
        this.settingsIndicator = this.scene.add.container(x, y).setDepth(999).setScrollFactor(0);
        
        // Background circle
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x006666, 0.8);
        bg.fillCircle(0, 0, iconSize / 2);
        bg.lineStyle(2, 0x00ffff, 1);
        bg.strokeCircle(0, 0, iconSize / 2);
        
        // Gear icon (simplified)
        const gear = this.scene.add.graphics();
        gear.fillStyle(0x00ffff, 1);
        
        // Draw gear shape
        const innerRadius = 5;
        const outerRadius = 10;
        const teeth = 8;
        
        for (let i = 0; i < teeth; i++) {
            const angle = (i / teeth) * Math.PI * 2;
            const nextAngle = ((i + 0.5) / teeth) * Math.PI * 2;
            
            gear.beginPath();
            gear.moveTo(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius);
            gear.lineTo(Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius);
            gear.lineTo(Math.cos(nextAngle) * outerRadius, Math.sin(nextAngle) * outerRadius);
            gear.lineTo(Math.cos(nextAngle) * innerRadius, Math.sin(nextAngle) * innerRadius);
            gear.fillPath();
        }
        
        // Inner circle
        gear.fillStyle(0x000000, 1);
        gear.fillCircle(0, 0, innerRadius);
        
        // Make it interactive
        const hitArea = new Phaser.Geom.Circle(0, 0, iconSize / 2);
        bg.setInteractive(hitArea, Phaser.Geom.Circle.Contains);
        
        bg.on('pointerdown', () => {
            this.toggle();
        });
        
        bg.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0x00aaaa, 0.9);
            bg.fillCircle(0, 0, iconSize / 2);
            bg.lineStyle(2, 0xffffff, 1);
            bg.strokeCircle(0, 0, iconSize / 2);
            
            this.scene.tweens.add({
                targets: this.settingsIndicator,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 100
            });
        });
        
        bg.on('pointerout', () => {
            this.updateIndicatorState();
            
            this.scene.tweens.add({
                targets: this.settingsIndicator,
                scaleX: 1,
                scaleY: 1,
                duration: 100
            });
        });
        
        this.settingsIndicator.add([bg, gear]);
    }
    
    updateIndicatorState() {
        if (!this.settingsIndicator) return;
        
        const bg = this.settingsIndicator.getAt(0);
        const iconSize = 30;
        
        if (this.isOpen) {
            // Active state - brighter
            bg.clear();
            bg.fillStyle(0x00ffff, 0.9);
            bg.fillCircle(0, 0, iconSize / 2);
            bg.lineStyle(2, 0xffffff, 1);
            bg.strokeCircle(0, 0, iconSize / 2);
            
            // Pulse animation
            this.scene.tweens.add({
                targets: bg,
                alpha: 0.6,
                duration: 500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        } else {
            // Inactive state
            bg.clear();
            this.scene.tweens.killTweensOf(bg);
            bg.setAlpha(1);
            bg.fillStyle(0x006666, 0.8);
            bg.fillCircle(0, 0, iconSize / 2);
            bg.lineStyle(2, 0x00ffff, 1);
            bg.strokeCircle(0, 0, iconSize / 2);
        }
    }
    
    setupKeyboardListener() {
        this.scene.input.keyboard.on('keydown-ESC', () => {
            this.toggle();
        });
    }
    
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
    
    open() {
        if (this.isOpen) return;
        
        this.isOpen = true;
        this.isPaused = this.scene.physics.world.isPaused;
        this.scene.physics.pause();
        
        this.updateIndicatorState();
        this.createMenu();
    }
    
    close() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
        
        if (!this.isPaused) {
            this.scene.physics.resume();
        }
        
        this.updateIndicatorState();
        this.destroyMenu();
    }
    
    createMenu() {
        const { width, height } = this.scene.cameras.main;
        const menuX = width / 2;
        const menuY = height / 2;
        
        // Create semi-transparent overlay
        this.overlay = this.scene.add.graphics()
            .setDepth(1000)
            .setInteractive()
            .on('pointerdown', () => {
                this.close();
            });
        
        this.overlay.fillStyle(0x000000, 0.7);
        this.overlay.fillRect(0, 0, width, height);
        
        // Create menu container
        this.container = this.scene.add.container(menuX, menuY).setDepth(1001);
        
        // Menu background
        const bg = this.scene.add.graphics();
        bg.fillStyle(this.styles.backgroundColor, 0.95);
        bg.fillRoundedRect(-this.styles.width / 2, -this.styles.height / 2, this.styles.width, this.styles.height, 10);
        bg.lineStyle(this.styles.borderWidth, this.styles.borderColor, 1);
        bg.strokeRoundedRect(-this.styles.width / 2, -this.styles.height / 2, this.styles.width, this.styles.height, 10);
        
        // Add glitch effect border
        const glitchBorder = this.createGlitchBorder(bg);
        
        // Title
        const title = this.scene.add.text(0, -this.styles.height / 2 + 40, 'SETTINGS', {
            fontSize: '28px',
            fill: this.styles.textColor,
            fontStyle: 'bold',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Add title glow
        title.setShadow(2, 2, '#00ffff', 0, true, true);
        
        this.container.add([bg, title]);
        
        // Create sliders
        const startY = -this.styles.height / 2 + 100;
        const spacing = 70;
        
        this.createSlider('Master', 'master', startY);
        this.createSlider('SFX', 'sfx', startY + spacing);
        this.createSlider('Music', 'music', startY + spacing * 2);
        
        // Dynamic music settings
        this.createDynamicMusicToggle(startY + spacing * 3);
        this.createIntensitySensitivitySlider(startY + spacing * 4);
        
        // Mute toggle
        this.createMuteToggle(startY + spacing * 5);
        
        // Reset to defaults button
        this.createResetButton(startY + spacing * 6);
        
        // Return to menu button (only if scene has a menu scene available)
        this.createReturnToMenuButton(startY + spacing * 6 + 50);
        
        // Close instruction
        const closeText = this.scene.add.text(0, this.styles.height / 2 - 30, 'Press ESC to close', {
            fontSize: '14px',
            fill: '#666666',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        this.container.add(closeText);
        
        // Animate menu appearance
        this.container.setScale(0);
        this.container.setAlpha(0);
        
        this.scene.tweens.add({
            targets: this.container,
            scaleX: 1,
            scaleY: 1,
            alpha: 1,
            duration: 300,
            ease: 'Back.easeOut'
        });
    }
    
    createGlitchBorder(graphics) {
        const width = this.styles.width;
        const height = this.styles.height;
        const halfWidth = width / 2;
        const halfHeight = height / 2;
        
        // Add glowing corners
        const cornerSize = 15;
        graphics.lineStyle(2, 0x00ffff, 0.8);
        
        // Top-left
        graphics.beginPath();
        graphics.moveTo(-halfWidth, -halfHeight + cornerSize);
        graphics.lineTo(-halfWidth, -halfHeight);
        graphics.lineTo(-halfWidth + cornerSize, -halfHeight);
        graphics.strokePath();
        
        // Top-right
        graphics.beginPath();
        graphics.moveTo(halfWidth - cornerSize, -halfHeight);
        graphics.lineTo(halfWidth, -halfHeight);
        graphics.lineTo(halfWidth, -halfHeight + cornerSize);
        graphics.strokePath();
        
        // Bottom-left
        graphics.beginPath();
        graphics.moveTo(-halfWidth, halfHeight - cornerSize);
        graphics.lineTo(-halfWidth, halfHeight);
        graphics.lineTo(-halfWidth + cornerSize, halfHeight);
        graphics.strokePath();
        
        // Bottom-right
        graphics.beginPath();
        graphics.moveTo(halfWidth - cornerSize, halfHeight);
        graphics.lineTo(halfWidth, halfHeight);
        graphics.lineTo(halfWidth, height / 2 - cornerSize);
        graphics.strokePath();
    }
    
    createSlider(label, type, y) {
        const sliderWidth = 300;
        const sliderHeight = 20;
        const handleSize = 24;
        
        // Label
        const labelText = this.scene.add.text(-sliderWidth / 2 - 20, y, label + ':', {
            fontSize: '18px',
            fill: this.styles.textColor,
            fontFamily: 'Arial'
        }).setOrigin(1, 0.5);
        
        // Volume percentage text
        const volumeText = this.scene.add.text(sliderWidth / 2 + 20, y, '50%', {
            fontSize: '18px',
            fill: this.styles.textColor,
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);
        
        // Slider background track
        const track = this.scene.add.graphics()
            .setInteractive(
                new Phaser.Geom.Rectangle(-sliderWidth / 2, y - sliderHeight / 2, sliderWidth, sliderHeight),
                Phaser.Geom.Rectangle.Contains
            );
        
        track.fillStyle(this.styles.sliderBgColor, 1);
        track.fillRect(-sliderWidth / 2, y - sliderHeight / 2, sliderWidth, sliderHeight);
        
        // Slider fill (will be updated)
        const fill = this.scene.add.graphics();
        
        // Slider handle
        const handle = this.scene.add.graphics();
        
        // Get current volume from AudioManager
        const volume = this.audioManager[type + 'Volume'] || this.audioManager.masterVolume;
        
        this.updateSliderVisuals(fill, handle, volume, sliderWidth, sliderHeight, handleSize, y);
        volumeText.setText(Math.round(volume) + '%');
        
        // Slider interaction
        let isDragging = false;
        
        track.on('pointerdown', (pointer) => {
            isDragging = true;
            this.updateVolumeFromPointer(pointer, type, fill, handle, volumeText, sliderWidth, sliderHeight, handleSize, y);
            track.setInteractive();
        });
        
        track.on('pointermove', (pointer) => {
            if (isDragging) {
                this.updateVolumeFromPointer(pointer, type, fill, handle, volumeText, sliderWidth, sliderHeight, handleSize, y);
            }
        });
        
        track.on('pointerup', () => {
            isDragging = false;
        });
        
        track.on('pointerout', () => {
            isDragging = false;
        });
        
        // Store slider components
        this.sliders[type] = { track, fill, handle };
        this.volumeTexts[type] = volumeText;
        
        this.container.add([labelText, track, fill, handle, volumeText]);
        
        // Hover effect
        track.on('pointerover', () => {
            track.clear();
            track.fillStyle(0x333333, 1);
            track.fillRect(-sliderWidth / 2, y - sliderHeight / 2, sliderWidth, sliderHeight);
        });
        
        track.on('pointerout', () => {
            track.clear();
            track.fillStyle(this.styles.sliderBgColor, 1);
            track.fillRect(-sliderWidth / 2, y - sliderHeight / 2, sliderWidth, sliderHeight);
        });
    }
    
    updateSliderVisuals(fill, handle, volume, sliderWidth, sliderHeight, handleSize, y) {
        const fillWidth = (volume / 100) * sliderWidth;
        const handleX = -sliderWidth / 2 + fillWidth;
        
        fill.clear();
        fill.fillStyle(this.styles.sliderFillColor, 0.8);
        fill.fillRect(-sliderWidth / 2, y - sliderHeight / 2, fillWidth, sliderHeight);
        
        // Handle glow effect
        handle.clear();
        
        // Outer glow
        handle.fillStyle(0x00ffff, 0.3);
        handle.fillRect(
            handleX - handleSize / 2 - 4,
            y - handleSize / 2 - 4,
            handleSize + 8,
            handleSize + 8
        );
        
        // Handle body
        handle.fillStyle(0x00ffff, 1);
        handle.fillRect(
            handleX - handleSize / 2,
            y - handleSize / 2,
            handleSize,
            handleSize
        );
        
        // Handle inner
        handle.fillStyle(0x000000, 1);
        handle.fillRect(
            handleX - handleSize / 4,
            y - handleSize / 4,
            handleSize / 2,
            handleSize / 2
        );
    }
    
    updateVolumeFromPointer(pointer, type, fill, handle, volumeText, sliderWidth, sliderHeight, handleSize, y) {
        const localX = pointer.x - this.container.x;
        const sliderStart = -sliderWidth / 2;
        const sliderEnd = sliderWidth / 2;
        
        // Clamp to slider bounds
        const clampedX = Math.max(sliderStart, Math.min(sliderEnd, localX));
        
        // Calculate volume (0-100)
        const volume = Math.round(((clampedX - sliderStart) / sliderWidth) * 100);
        
        // Update audio manager
        this.audioManager.setVolume(type, volume);
        
        // Update visuals
        this.updateSliderVisuals(fill, handle, volume, sliderWidth, sliderHeight, handleSize, y);
        volumeText.setText(volume + '%');
        
        // Play preview sound with debounce
        this.playPreviewSound(type);
    }
    
    playPreviewSound(type) {
        // Clear existing timeout for this type
        if (this.previewTimeouts[type]) {
            clearTimeout(this.previewTimeouts[type]);
        }
        
        // Debounce preview sound
        this.previewTimeouts[type] = setTimeout(() => {
            if (!this.audioManager.muted) {
                switch (type) {
                    case 'master':
                    case 'sfx':
                        this.audioManager.playSound('menu-select', 0.5);
                        break;
                    case 'music':
                        // Music preview - play a brief tone
                        this.audioManager.playSound('menu-confirm', 0.5);
                        break;
                }
            }
        }, 100);
    }
    
    createDynamicMusicToggle(y) {
        const toggleWidth = 60;
        const toggleHeight = 30;
        
        // Label
        const labelText = this.scene.add.text(-this.styles.width / 2 + 30, y, 'Dynamic Music:', {
            fontSize: '18px',
            fill: this.styles.textColor,
            fontFamily: 'Arial'
        }).setOrigin(0, 0.5);
        
        // Toggle background
        const toggleBg = this.scene.add.graphics()
            .setInteractive(
                new Phaser.Geom.Rectangle(this.styles.width / 2 - 90, y - toggleHeight / 2, toggleWidth, toggleHeight),
                Phaser.Geom.Rectangle.Contains
            );
        
        // Toggle handle
        const toggleHandle = this.scene.add.graphics();
        
        // Status text
        const dynamicMusicStatusText = this.scene.add.text(this.styles.width / 2 - 100, y, 'ON', {
            fontSize: '16px',
            fill: '#66ff66',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(1, 0.5);
        
        const updateToggle = () => {
            const isEnabled = this.audioManager.dynamicMusicEnabled;
            
            toggleBg.clear();
            
            // Background color based on state
            if (isEnabled) {
                toggleBg.fillStyle(0x006600, 0.8);
            } else {
                toggleBg.fillStyle(0x666666, 0.8);
            }
            
            toggleBg.fillRoundedRect(this.styles.width / 2 - 90, y - toggleHeight / 2, toggleWidth, toggleHeight, 15);
            toggleBg.lineStyle(2, 0xffffff, 0.5);
            toggleBg.strokeRoundedRect(this.styles.width / 2 - 90, y - toggleHeight / 2, toggleWidth, toggleHeight, 15);
            
            // Handle position
            const handleX = isEnabled 
                ? this.styles.width / 2 - 90 + toggleWidth - 15
                : this.styles.width / 2 - 90 + 15;
            
            toggleHandle.clear();
            toggleHandle.fillStyle(0xffffff, 1);
            toggleHandle.fillCircle(handleX, y, 10);
            
            // Status text
            dynamicMusicStatusText.setText(isEnabled ? 'ON' : 'OFF');
            dynamicMusicStatusText.setStyle({
                fill: isEnabled ? '#66ff66' : '#ff6666'
            });
        };
        
        toggleBg.on('pointerdown', () => {
            this.audioManager.setDynamicMusicEnabled(!this.audioManager.dynamicMusicEnabled);
            updateToggle();
            
            // Play feedback sound
            if (!this.audioManager.muted) {
                this.audioManager.playSound('menu-confirm', 0.6);
            }
        });
        
        this.container.add([labelText, toggleBg, toggleHandle, dynamicMusicStatusText]);
        updateToggle();
    }
    
    createIntensitySensitivitySlider(y) {
        const sliderWidth = 300;
        const sliderHeight = 8;
        const handleSize = 20;
        
        // Label
        const labelText = this.scene.add.text(-this.styles.width / 2 + 30, y - 20, 'Intensity Sensitivity:', {
            fontSize: '18px',
            fill: this.styles.textColor,
            fontFamily: 'Arial'
        }).setOrigin(0, 0.5);
        
        // Percentage text
        const percentageText = this.scene.add.text(this.styles.width / 2 - 50, y - 20, '75%', {
            fontSize: '18px',
            fill: this.styles.textColor,
            fontFamily: 'Arial'
        }).setOrigin(1, 0.5);
        
        // Slider background
        const sliderBg = this.scene.add.graphics();
        
        // Slider fill
        const sliderFill = this.scene.add.graphics();
        
        // Handle
        const sliderHandle = this.scene.add.graphics()
            .setInteractive(
                new Phaser.Geom.Rectangle(-sliderWidth / 2, y - handleSize / 2, sliderWidth, handleSize),
                Phaser.Geom.Rectangle.Contains
            );
        
        const updateSlider = (value) => {
            // Update audio manager
            this.audioManager.setIntensitySensitivity(value);
            
            // Calculate handle position
            const fillWidth = (value / 100) * sliderWidth;
            const handleX = -sliderWidth / 2 + fillWidth;
            
            // Update visuals
            this.updateIntensitySliderVisuals(sliderBg, sliderFill, sliderHandle, value, sliderWidth, sliderHeight, handleSize, y);
            percentageText.setText(value + '%');
        };
        
        // Initial update
        updateSlider(this.audioManager.intensitySensitivity);
        
        // Handle interaction
        sliderHandle.on('pointerdown', (pointer) => {
            this.updateIntensityFromPointer(pointer, sliderBg, sliderFill, sliderHandle, percentageText, sliderWidth, sliderHeight, handleSize, y);
        });
        
        sliderBg.on('pointerdown', (pointer) => {
            this.updateIntensityFromPointer(pointer, sliderBg, sliderFill, sliderHandle, percentageText, sliderWidth, sliderHeight, handleSize, y);
        });
        
        this.container.add([labelText, percentageText, sliderBg, sliderFill, sliderHandle]);
    }
    
    updateIntensityFromPointer(pointer, sliderBg, sliderFill, sliderHandle, percentageText, sliderWidth, sliderHeight, handleSize, y) {
        const localX = pointer.x - this.container.x;
        const sliderStart = -sliderWidth / 2;
        const sliderEnd = sliderWidth / 2;
        
        // Clamp to slider bounds
        const clampedX = Math.max(sliderStart, Math.min(sliderEnd, localX));
        
        // Calculate sensitivity (0-100)
        const sensitivity = Math.round(((clampedX - sliderStart) / sliderWidth) * 100);
        
        // Update audio manager
        this.audioManager.setIntensitySensitivity(sensitivity);
        
        // Update visuals
        this.updateIntensitySliderVisuals(sliderBg, sliderFill, sliderHandle, sensitivity, sliderWidth, sliderHeight, handleSize, y);
        percentageText.setText(sensitivity + '%');
        
        // Play preview sound
        if (!this.audioManager.muted) {
            this.audioManager.playSound('menu-select', 0.3);
        }
    }
    
    updateIntensitySliderVisuals(sliderBg, sliderFill, sliderHandle, sensitivity, sliderWidth, sliderHeight, handleSize, y) {
        const fillWidth = (sensitivity / 100) * sliderWidth;
        const handleX = -sliderWidth / 2 + fillWidth;
        
        // Background
        sliderBg.clear();
        sliderBg.fillStyle(0x333333, 1);
        sliderBg.fillRect(-sliderWidth / 2, y - sliderHeight / 2, sliderWidth, sliderHeight);
        sliderBg.lineStyle(2, 0x666666, 0.8);
        sliderBg.strokeRect(-sliderWidth / 2, y - sliderHeight / 2, sliderWidth, sliderHeight);
        
        // Fill
        sliderFill.clear();
        sliderFill.fillStyle(0x00ffff, 0.8);
        sliderFill.fillRect(-sliderWidth / 2, y - sliderHeight / 2, fillWidth, sliderHeight);
        
        // Handle glow effect
        sliderHandle.clear();
        
        // Outer glow
        sliderHandle.fillStyle(0x00ffff, 0.3);
        sliderHandle.fillRect(
            handleX - handleSize / 2 - 4,
            y - handleSize / 2 - 4,
            handleSize + 8,
            handleSize + 8
        );
        
        // Handle body
        sliderHandle.fillStyle(0x00ffff, 1);
        sliderHandle.fillRect(
            handleX - handleSize / 2,
            y - handleSize / 2,
            handleSize,
            handleSize
        );
        
        // Handle inner
        sliderHandle.fillStyle(0x000000, 1);
        sliderHandle.fillRect(
            handleX - handleSize / 4,
            y - handleSize / 4,
            handleSize / 2,
            handleSize / 2
        );
    }
    
    createMuteToggle(y) {
        const toggleWidth = 60;
        const toggleHeight = 30;
        
        // Label
        const labelText = this.scene.add.text(-this.styles.width / 2 + 30, y, 'Mute:', {
            fontSize: '18px',
            fill: this.styles.textColor,
            fontFamily: 'Arial'
        }).setOrigin(0, 0.5);
        
        // Toggle background
        const toggleBg = this.scene.add.graphics()
            .setInteractive(
                new Phaser.Geom.Rectangle(this.styles.width / 2 - 90, y - toggleHeight / 2, toggleWidth, toggleHeight),
                Phaser.Geom.Rectangle.Contains
            );
        
        // Toggle handle
        const toggleHandle = this.scene.add.graphics();
        
        const updateToggle = () => {
            const isMuted = this.audioManager.muted;
            
            toggleBg.clear();
            
            // Background color based on state
            if (isMuted) {
                toggleBg.fillStyle(0xff0000, 0.8);
            } else {
                toggleBg.fillStyle(0x006600, 0.8);
            }
            
            toggleBg.fillRoundedRect(this.styles.width / 2 - 90, y - toggleHeight / 2, toggleWidth, toggleHeight, 15);
            toggleBg.lineStyle(2, 0xffffff, 0.5);
            toggleBg.strokeRoundedRect(this.styles.width / 2 - 90, y - toggleHeight / 2, toggleWidth, toggleHeight, 15);
            
            // Handle position
            const handleX = isMuted 
                ? this.styles.width / 2 - 90 + toggleWidth - 15
                : this.styles.width / 2 - 90 + 15;
            
            toggleHandle.clear();
            toggleHandle.fillStyle(0xffffff, 1);
            toggleHandle.fillCircle(handleX, y, 10);
            
            // Status text
            muteStatusText.setText(isMuted ? 'ON' : 'OFF');
            muteStatusText.setStyle({
                fill: isMuted ? '#ff6666' : '#66ff66'
            });
        };
        
        // Status text
        const muteStatusText = this.scene.add.text(this.styles.width / 2 - 100, y, 'OFF', {
            fontSize: '16px',
            fill: '#66ff66',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(1, 0.5);
        
        toggleBg.on('pointerdown', () => {
            this.audioManager.toggleMute();
            updateToggle();
            
            // Play feedback sound
            if (!this.audioManager.muted) {
                this.audioManager.playSound('menu-confirm', 0.6);
            }
        });
        
        // Hover effect
        toggleBg.on('pointerover', () => {
            this.scene.tweens.add({
                targets: toggleBg,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 100
            });
        });
        
        toggleBg.on('pointerout', () => {
            this.scene.tweens.add({
                targets: toggleBg,
                scaleX: 1,
                scaleY: 1,
                duration: 100
            });
        });
        
        // Initial state
        updateToggle();
        
        this.container.add([labelText, toggleBg, toggleHandle, muteStatusText]);
    }
    
    createResetButton(y) {
        const buttonWidth = 140;
        const buttonHeight = 40;
        
        const button = this.scene.add.container(0, y);
        
        // Button background
        const bg = this.scene.add.graphics()
            .setInteractive(
                new Phaser.Geom.Rectangle(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight),
                Phaser.Geom.Rectangle.Contains
            );
        
        bg.fillStyle(this.styles.buttonColor, 0.9);
        bg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 8);
        bg.lineStyle(2, this.styles.borderColor, 1);
        bg.strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 8);
        
        // Button text
        const text = this.scene.add.text(0, 0, 'Reset Defaults', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        button.add([bg, text]);
        
        // Hover effect
        bg.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(this.styles.buttonHoverColor, 0.9);
            bg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 8);
            bg.lineStyle(2, 0xffffff, 1);
            bg.strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 8);
            
            this.scene.tweens.add({
                targets: button,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 100
            });
        });
        
        bg.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(this.styles.buttonColor, 0.9);
            bg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 8);
            bg.lineStyle(2, this.styles.borderColor, 1);
            bg.strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 8);
            
            this.scene.tweens.add({
                targets: button,
                scaleX: 1,
                scaleY: 1,
                duration: 100
            });
        });
        
        // Click handler
        bg.on('pointerdown', () => {
            this.resetToDefaults();
            
            // Play confirmation sound
            if (!this.audioManager.muted) {
                this.audioManager.playSound('menu-confirm', 0.7);
            }
            
            // Visual feedback
            this.scene.tweens.add({
                targets: button,
                scaleX: 0.95,
                scaleY: 0.95,
                duration: 50,
                yoyo: true
            });
        });
        
        this.container.add(button);
    }
    
    createReturnToMenuButton(y) {
        const buttonWidth = 140;
        const buttonHeight = 40;
        
        const button = this.scene.add.container(0, y);
        
        // Button background
        const bg = this.scene.add.graphics()
            .setInteractive(
                new Phaser.Geom.Rectangle(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight),
                Phaser.Geom.Rectangle.Contains
            );
        
        // Different color for return button to distinguish it
        bg.fillStyle(0x664400, 0.9);
        bg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 8);
        bg.lineStyle(2, 0xffaa00, 1);
        bg.strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 8);
        
        // Button text
        const text = this.scene.add.text(0, 0, 'Main Menu', {
            fontSize: '16px',
            fill: '#ffaa00',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        button.add([bg, text]);
        
        // Hover effect
        bg.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0x885500, 0.9);
            bg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 8);
            bg.lineStyle(2, 0xffcc00, 1);
            bg.strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 8);
            
            this.scene.tweens.add({
                targets: button,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 100
            });
        });
        
        bg.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x664400, 0.9);
            bg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 8);
            bg.lineStyle(2, 0xffaa00, 1);
            bg.strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 8);
            
            this.scene.tweens.add({
                targets: button,
                scaleX: 1,
                scaleY: 1,
                duration: 100
            });
        });
        
        // Click handler
        bg.on('pointerdown', () => {
            // Play confirmation sound
            if (!this.audioManager.muted) {
                this.audioManager.playSound('menu-confirm', 0.7);
            }
            
            // Visual feedback
            this.scene.tweens.add({
                targets: button,
                scaleX: 0.95,
                scaleY: 0.95,
                duration: 50,
                yoyo: true
            });
            
            // Return to main menu
            this.returnToMenu();
        });
        
        this.container.add(button);
    }
    
    returnToMenu() {
        // Close settings menu
        this.close();
        
        // Stop current music
        if (this.audioManager) {
            this.audioManager.stopMusic();
        }
        
        // Transition to menu scene
        this.scene.scene.stop('MainGame');
        this.scene.scene.start('Menu');
    }
    
    resetToDefaults() {
        // Reset volumes to defaults
        this.audioManager.setVolume('master', 100);
        this.audioManager.setVolume('sfx', 80);
        this.audioManager.setVolume('music', 60);
        
        // Unmute if muted
        if (this.audioManager.muted) {
            this.audioManager.toggleMute();
        }
        
        // Update UI
        this.updateSliderFromValue('master', 100);
        this.updateSliderFromValue('sfx', 80);
        this.updateSliderFromValue('music', 60);
        
        // Force mute toggle update by recreating the menu
        this.destroyMenu();
        this.createMenu();
    }
    
    updateSliderFromValue(type, value) {
        const slider = this.sliders[type];
        const volumeText = this.volumeTexts[type];
        
        if (slider && volumeText) {
            const sliderWidth = 300;
            const sliderHeight = 20;
            const handleSize = 24;
            const y = slider.track.y;
            
            this.updateSliderVisuals(slider.fill, slider.handle, value, sliderWidth, sliderHeight, handleSize, y);
            volumeText.setText(Math.round(value) + '%');
        }
    }
    
    destroyMenu() {
        // Clear preview timeouts
        Object.values(this.previewTimeouts).forEach(timeout => {
            if (timeout) clearTimeout(timeout);
        });
        this.previewTimeouts = {};
        
        // Animate menu close
        if (this.container) {
            this.scene.tweens.add({
                targets: this.container,
                scaleX: 0,
                scaleY: 0,
                alpha: 0,
                duration: 200,
                ease: 'Back.easeIn',
                onComplete: () => {
                    if (this.container) {
                        this.container.destroy();
                        this.container = null;
                    }
                }
            });
        }
        
        if (this.overlay) {
            this.overlay.destroy();
            this.overlay = null;
        }
        
        this.sliders = {};
        this.volumeTexts = {};
    }
    
    update() {
        // Called from scene's update loop if needed
        // Can be used for continuous animations or effects
    }
    
    destroy() {
        this.close();
        if (this.scene && this.scene.input && this.scene.input.keyboard) {
            this.scene.input.keyboard.off('keydown-ESC');
        }
        
        // Clean up settings indicator
        if (this.settingsIndicator) {
            this.settingsIndicator.destroy();
            this.settingsIndicator = null;
        }
    }
}
