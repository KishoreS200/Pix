import Phaser from 'phaser';
import AudioManager from '../systems/AudioManager';
import SettingsMenu from '../systems/SettingsMenu';
import ButtonFactory from '../utils/ButtonFactory';
import { MusicKeys } from '../utils/MusicConfig';

export default class Menu extends Phaser.Scene {
    constructor() {
        super('Menu');
        
        this.audioManager = null;
        this.settingsMenu = null;
        
        // Animation containers
        this.titleContainer = null;
        this.backgroundContainer = null;
        this.particles = null;
        this.grid = null;
        
        // Menu state
        this.currentSubmenu = 'main'; // 'main', 'settings', 'credits'
        
        // Button containers
        this.mainMenuButtons = [];
        this.subMenuButtons = [];
        
        // Background animation
        this.gridOffset = 0;
        this.glitchTimer = 0;
        
        // Audio state
        this.menuMusicPlaying = false;
    }
    
    create() {
        console.log('Menu scene started');
        
        // Initialize audio manager (singleton)
        this.audioManager = AudioManager.getInstance(this);
        
        // Create background
        this.createBackground();
        
        // Create particles
        this.createParticles();
        
        // Create title
        this.createTitle();
        
        // Create main menu
        this.createMainMenu();
        
        // Setup input handlers
        this.setupInput();
        
        // Start menu music
        this.playMenuMusic();
        
        // Animate entrance
        this.animateEntrance();
    }
    
    createBackground() {
        const { width, height } = this.cameras.main;
        
        // Background container
        this.backgroundContainer = this.add.container(width / 2, height / 2);
        
        // Dark background
        const bg = this.add.graphics();
        bg.fillStyle(0x0a0a0a, 1);
        bg.fillRect(-width / 2, -height / 2, width, height);
        this.backgroundContainer.add(bg);
        
        // Animated grid
        this.grid = this.add.graphics();
        this.updateGrid();
        this.backgroundContainer.add(this.grid);
    }
    
    updateGrid() {
        if (!this.grid) return;
        
        const { width, height } = this.cameras.main;
        const gridSize = 40;
        
        this.grid.clear();
        
        // Grid lines
        this.grid.lineStyle(1, 0x003333, 0.5);
        
        // Vertical lines
        for (let x = -width / 2; x <= width / 2; x += gridSize) {
            this.grid.beginPath();
            this.grid.moveTo(x + (this.gridOffset % gridSize), -height / 2);
            this.grid.lineTo(x + (this.gridOffset % gridSize), height / 2);
            this.grid.strokePath();
        }
        
        // Horizontal lines
        for (let y = -height / 2; y <= height / 2; y += gridSize) {
            this.grid.beginPath();
            this.grid.moveTo(-width / 2, y + (this.gridOffset % gridSize));
            this.grid.lineTo(width / 2, y + (this.gridOffset % gridSize));
            this.grid.strokePath();
        }
    }
    
    createParticles() {
        const { width, height } = this.cameras.main;
        
        // Create particle texture
        const particleTexture = this.textures.createCanvas('menuParticle', 4, 4);
        const ctx = particleTexture.getContext();
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(0, 0, 4, 4);
        particleTexture.refresh();
        
        // Particle emitter
        this.particles = this.add.particles('menuParticle', {
            x: width / 2,
            y: height / 2,
            lifespan: 3000,
            speedX: { min: -50, max: 50 },
            speedY: { min: -50, max: 50 },
            scale: { start: 1, end: 0 },
            alpha: { start: 0.6, end: 0 },
            frequency: 100,
            blendMode: 'ADD',
            quantity: 2
        });
    }
    
    createTitle() {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2 - 150;
        
        this.titleContainer = this.add.container(centerX, centerY);
        
        // Main title text
        const title = this.add.text(0, 0, 'PIX', {
            fontSize: '72px',
            fill: '#00ffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Subtitle
        const subtitle = this.add.text(0, 50, 'Pixel Realm: Echoes of the Glitch', {
            fontSize: '18px',
            fill: '#008888',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Add glow effects
        title.setShadow(4, 4, '#00ffff', 0, true, true);
        subtitle.setShadow(2, 2, '#004444', 0, true, true);
        
        this.titleContainer.add([title, subtitle]);
        
        // Store references for glitch effect
        this.titleText = title;
        this.subtitleText = subtitle;
    }
    
    createMainMenu() {
        const centerX = this.cameras.main.width / 2;
        const startY = this.cameras.main.height / 2 - 50;
        const spacing = 70;
        
        // Start Game button
        const startButton = ButtonFactory.createLargeButton(
            this,
            centerX,
            startY,
            'START GAME',
            () => this.startGame()
        );
        this.mainMenuButtons.push(startButton);
        
        // Settings button
        const settingsButton = ButtonFactory.createButton(
            this,
            centerX,
            startY + spacing,
            'SETTINGS',
            () => this.openSettings()
        );
        this.mainMenuButtons.push(settingsButton);
        
        // Credits button
        const creditsButton = ButtonFactory.createButton(
            this,
            centerX,
            startY + spacing * 2,
            'CREDITS',
            () => this.openCredits()
        );
        this.mainMenuButtons.push(creditsButton);
        
        // Quit button
        const quitButton = ButtonFactory.createButton(
            this,
            centerX,
            startY + spacing * 3,
            'QUIT',
            () => this.quitGame()
        );
        this.mainMenuButtons.push(quitButton);
    }
    
    setupInput() {
        // ESC key to return to main menu or close settings
        this.input.keyboard.on('keydown-ESC', () => {
            if (this.currentSubmenu === 'settings') {
                this.closeSettings();
            } else if (this.currentSubmenu === 'credits') {
                this.closeCredits();
            }
        });
    }
    
    playMenuMusic() {
        if (!this.menuMusicPlaying && this.audioManager) {
            // Play menu music using the music key
            this.audioManager.playMusic(MusicKeys.MENU);
            this.menuMusicPlaying = true;
        }
    }
    
    stopMenuMusic() {
        if (this.audioManager) {
            this.audioManager.stopMusic();
            this.menuMusicPlaying = false;
        }
    }
    
    animateEntrance() {
        // Animate title coming from above
        this.titleContainer.setY(-100);
        this.tweens.add({
            targets: this.titleContainer,
            y: this.cameras.main.height / 2 - 150,
            duration: 800,
            ease: 'Back.easeOut',
            delay: 200
        });
        
        // Animate buttons appearing
        this.mainMenuButtons.forEach((button, index) => {
            button.setAlpha(0);
            button.setScale(0.8);
            this.tweens.add({
                targets: button,
                alpha: 1,
                scaleX: 1,
                scaleY: 1,
                duration: 400,
                ease: 'Back.easeOut',
                delay: 400 + index * 100
            });
        });
    }
    
    startGame() {
        console.log('Starting game...');
        
        // Fade to black
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0);
        overlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
        
        this.tweens.add({
            targets: overlay,
            alpha: 1,
            duration: 500,
            onComplete: () => {
                // Stop menu music
                this.stopMenuMusic();
                
                // Start main game
                this.scene.start('MainGame');
            }
        });
    }
    
    openSettings() {
        if (this.currentSubmenu === 'settings') return;
        
        this.currentSubmenu = 'settings';
        
        // Hide main menu
        this.mainMenuButtons.forEach(button => {
            this.tweens.add({
                targets: button,
                alpha: 0,
                scaleX: 0.8,
                scaleY: 0.8,
                duration: 200
            });
        });
        
        // Create settings menu using existing SettingsMenu class
        this.settingsMenu = new SettingsMenu(this);
        this.settingsMenu.open();
    }
    
    closeSettings() {
        if (this.currentSubmenu !== 'settings') return;
        
        this.currentSubmenu = 'main';
        
        // Close settings menu
        if (this.settingsMenu) {
            this.settingsMenu.close();
            this.settingsMenu.destroy();
            this.settingsMenu = null;
        }
        
        // Show main menu
        this.mainMenuButtons.forEach((button, index) => {
            this.tweens.add({
                targets: button,
                alpha: 1,
                scaleX: 1,
                scaleY: 1,
                duration: 200,
                delay: index * 50
            });
        });
    }
    
    openCredits() {
        if (this.currentSubmenu === 'credits') return;
        
        this.currentSubmenu = 'credits';
        
        // Hide main menu
        this.mainMenuButtons.forEach(button => {
            this.tweens.add({
                targets: button,
                alpha: 0,
                scaleX: 0.8,
                scaleY: 0.8,
                duration: 200
            });
        });
        
        // Create credits screen
        this.createCreditsScreen();
    }
    
    createCreditsScreen() {
        const { width, height } = this.cameras.main;
        
        // Credits container
        const creditsContainer = this.add.container(width / 2, height / 2);
        
        // Background
        const bg = this.add.graphics();
        bg.fillStyle(0x0a0a0a, 0.95);
        bg.fillRoundedRect(-width / 2 + 50, -height / 2 + 50, width - 100, height - 100, 10);
        bg.lineStyle(2, 0x00ffff, 1);
        bg.strokeRoundedRect(-width / 2 + 50, -height / 2 + 50, width - 100, height - 100, 10);
        
        // Title
        const title = this.add.text(0, -height / 2 + 100, 'CREDITS', {
            fontSize: '32px',
            fill: '#00ffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        title.setShadow(2, 2, '#00ffff', 0, true, true);
        
        // Credits content
        const creditsContent = [
            { text: 'GAME DESIGN & DEVELOPMENT', size: '20px', style: 'bold', color: '#008888' },
            { text: 'Pix Development Team', size: '18px', color: '#ffffff' },
            { text: '', size: '16px' },
            { text: 'AUDIO SYSTEM', size: '20px', style: 'bold', color: '#008888' },
            { text: 'Procedural Audio Generation', size: '18px', color: '#ffffff' },
            { text: 'Web Audio API Integration', size: '18px', color: '#ffffff' },
            { text: '', size: '16px' },
            { text: 'INSPIRATION', size: '20px', style: 'bold', color: '#008888' },
            { text: 'Retro Pixel Art Games', size: '18px', color: '#ffffff' },
            { text: 'Glitch Art Aesthetics', size: '18px', color: '#ffffff' },
            { text: 'Cyberpunk Themes', size: '18px', color: '#ffffff' },
            { text: '', size: '16px' },
            { text: 'TECHNOLOGIES', size: '20px', style: 'bold', color: '#008888' },
            { text: 'Phaser 3 Game Framework', size: '18px', color: '#ffffff' },
            { text: 'Webpack + Babel', size: '18px', color: '#ffffff' },
            { text: 'Web Audio API', size: '18px', color: '#ffffff' },
            { text: '', size: '16px' },
            { text: 'SPECIAL THANKS', size: '20px', style: 'bold', color: '#008888' },
            { text: 'Open Source Community', size: '18px', color: '#ffffff' },
            { text: 'Game Development Tutorials', size: '18px', color: '#ffffff' },
            { text: '', size: '16px' },
            { text: '© 2024 Pix Game', size: '14px', color: '#666666' }
        ];
        
        let yOffset = -height / 2 + 160;
        const lineHeight = 30;
        
        creditsContent.forEach(item => {
            const text = this.add.text(0, yOffset, item.text, {
                fontSize: item.size,
                fill: item.color || '#ffffff',
                fontFamily: 'Arial',
                fontStyle: item.style || 'normal'
            }).setOrigin(0.5);
            
            if (item.style === 'bold') {
                text.setShadow(2, 2, '#00ffff', 0, true, true);
            }
            
            creditsContainer.add(text);
            yOffset += lineHeight;
        });
        
        // Back button
        const backButton = ButtonFactory.createButton(
            this,
            0,
            height / 2 - 80,
            'BACK',
            () => this.closeCredits()
        );
        
        creditsContainer.add([bg, title, backButton]);
        
        // Animate credits entrance
        creditsContainer.setAlpha(0);
        creditsContainer.setScale(0.9);
        this.tweens.add({
            targets: creditsContainer,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: 300,
            ease: 'Back.easeOut'
        });
        
        this.creditsContainer = creditsContainer;
    }
    
    closeCredits() {
        if (this.currentSubmenu !== 'credits') return;
        
        this.currentSubmenu = 'main';
        
        // Animate credits exit
        if (this.creditsContainer) {
            this.tweens.add({
                targets: this.creditsContainer,
                alpha: 0,
                scaleX: 0.9,
                scaleY: 0.9,
                duration: 200,
                onComplete: () => {
                    if (this.creditsContainer) {
                        this.creditsContainer.destroy();
                        this.creditsContainer = null;
                    }
                }
            });
        }
        
        // Show main menu
        this.mainMenuButtons.forEach((button, index) => {
            this.tweens.add({
                targets: button,
                alpha: 1,
                scaleX: 1,
                scaleY: 1,
                duration: 200,
                delay: index * 50
            });
        });
    }
    
    quitGame() {
        console.log('Quitting game...');
        
        // In web context, we can't really quit, so we'll reload the page
        // or show a "thank you for playing" message
        
        // Fade to black
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0);
        overlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
        
        this.tweens.add({
            targets: overlay,
            alpha: 1,
            duration: 500,
            onComplete: () => {
                // Show goodbye message
                const goodbye = this.add.text(
                    this.cameras.main.width / 2,
                    this.cameras.main.height / 2,
                    'THANK YOU FOR PLAYING!\n\nRefresh to play again',
                    {
                        fontSize: '24px',
                        fill: '#00ffff',
                        fontFamily: 'Arial',
                        fontStyle: 'bold',
                        align: 'center'
                    }
                ).setOrigin(0.5);
                
                goodbye.setShadow(2, 2, '#00ffff', 0, true, true);
            }
        });
    }
    
    applyGlitchEffect() {
        if (!this.titleText || !this.subtitleText) return;
        
        const glitchIntensity = 2;
        const originalX = this.titleText.x;
        const originalY = this.titleText.y;
        
        // Random position offset
        this.titleText.setPosition(
            originalX + (Math.random() - 0.5) * glitchIntensity,
            originalY + (Math.random() - 0.5) * glitchIntensity
        );
        
        // Color glitch
        if (Math.random() > 0.7) {
            const colors = ['#00ffff', '#ff00ff', '#ffff00', '#00ff00'];
            this.titleText.setColor(colors[Math.floor(Math.random() * colors.length)]);
        }
        
        // Reset after short delay
        this.time.delayedCall(50, () => {
            if (this.titleText) {
                this.titleText.setPosition(originalX, originalY);
                this.titleText.setColor('#00ffff');
            }
        });
    }
    
    update(time, delta) {
        // Animate grid
        this.gridOffset += 0.5;
        this.updateGrid();
        
        // Glitch effect on title (occasional)
        this.glitchTimer += delta;
        if (this.glitchTimer > 2000) {
            this.glitchTimer = 0;
            if (Math.random() > 0.5) {
                this.applyGlitchEffect();
            }
        }
        
        // Update settings menu if open
        if (this.settingsMenu) {
            this.settingsMenu.update();
        }
    }
    
    shutdown() {
        console.log('Menu scene shutting down');
        
        // Cleanup
        if (this.settingsMenu) {
            this.settingsMenu.destroy();
            this.settingsMenu = null;
        }
        
        if (this.particles) {
            this.particles.destroy();
            this.particles = null;
        }
        
        if (this.creditsContainer) {
            this.creditsContainer.destroy();
            this.creditsContainer = null;
        }
        
        // Stop menu music
        this.stopMenuMusic();
    }
}
