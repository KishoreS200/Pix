import Phaser from 'phaser';
import { Regions } from '../utils/RegionConfig';

export default class ParticleManager {
    constructor(scene) {
        this.scene = scene;

        this.maxParticles = 200;
        this._activeObjects = [];

        this.colors = {
            // Legacy faction keys (kept for compatibility)
            glitch_fauna: 0xff00ff,
            corrupted_human: 0x808080,
            sentinel_machine: 0x00ffff,

            // New character design system factions
            faction_glitch: 0x00ffff,
            faction_beast: 0x00aa00,
            faction_crystal: 0x40e0d0,
            faction_industrial: 0x808080,
            faction_void: 0x8b00ff,
            faction_corruption: 0xff0000,

            // New enemy texture keys (so effects can opt into per-enemy color)
            enemy_glitch_sprite: 0x00ffff,
            enemy_corrupted_rat: 0xff0000,
            enemy_thorned_beast: 0x00aa00,
            enemy_forest_wraith: 0x8a2be2,
            enemy_crystal_golem: 0x40e0d0,
            enemy_mining_glitch: 0xff8c00,
            enemy_corrupted_sentinel: 0xff00ff,
            enemy_urban_ghoul: 0x6b7a2a,
            enemy_void_entity: 0x8b00ff,
            enemy_corrupted_guardian: 0xff0000,

            player_hit: 0xff0000,
            damage: 0xffffff,
            healing: 0x00ff00,
            coin: 0xFFD700,
            potion: 0xff1493,
            powerup: 0x00ffff,
            levelup: 0xFFD700,
            xp: 0xFFD700,
            death: 0xff0000,
            boss: 0x8b00ff,

            [Regions.SILENT_VILLAGE]: 0x00ffff,
            [Regions.FORGOTTEN_FOREST]: 0x00ff00,
            [Regions.CRYSTAL_MINES]: 0xffffff,
            [Regions.BROKEN_CITY]: 0xff4500,
            [Regions.THE_CORE]: 0x8b00ff
        };
    }

    _resolveColor(color) {
        if (typeof color === 'number') return color;
        return this.colors[color] ?? 0xffffff;
    }

    _isOnScreen(x, y, margin = 200) {
        const cam = this.scene.cameras.main;
        return (
            x >= cam.scrollX - margin &&
            x <= cam.scrollX + cam.width + margin &&
            y >= cam.scrollY - margin &&
            y <= cam.scrollY + cam.height + margin
        );
    }

    _register(obj) {
        if (!obj) return obj;

        this._activeObjects.push(obj);

        if (obj.once) {
            obj.once(Phaser.GameObjects.Events.DESTROY, () => {
                const index = this._activeObjects.indexOf(obj);
                if (index > -1) this._activeObjects.splice(index, 1);
            });
        }

        while (this._activeObjects.length > this.maxParticles) {
            const oldest = this._activeObjects.shift();
            if (oldest && oldest.active && oldest.destroy) {
                oldest.destroy();
            }
        }

        return obj;
    }

    createHitEffect(x, y, color, particleCount = 8, options = {}) {
        if (!this._isOnScreen(x, y)) return;

        const colorValue = this._resolveColor(color);

        let resolvedOptions = options;
        if (resolvedOptions && resolvedOptions.x !== undefined && resolvedOptions.y !== undefined && !resolvedOptions.attacker) {
            resolvedOptions = { attacker: resolvedOptions };
        }

        const attacker = resolvedOptions?.attacker ?? null;
        const duration = resolvedOptions?.duration ?? 300;

        const hasDirection = Boolean(attacker && attacker.x !== undefined && attacker.y !== undefined);
        const baseAngle = hasDirection ? Phaser.Math.Angle.Between(attacker.x, attacker.y, x, y) : 0;

        const spread = hasDirection ? Phaser.Math.DegToRad(160) : Math.PI * 2;

        for (let i = 0; i < particleCount; i++) {
            const angle = hasDirection
                ? Phaser.Math.FloatBetween(baseAngle - spread / 2, baseAngle + spread / 2)
                : Phaser.Math.FloatBetween(0, Math.PI * 2);

            const distance = Phaser.Math.Between(20, 60);
            const size = Phaser.Math.Between(2, 4);

            const particle = this._register(this.scene.add.rectangle(x, y, size, size, colorValue));
            particle.setDepth(50);

            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                scale: 0.5,
                duration,
                ease: 'Power2',
                onComplete: () => {
                    if (particle && particle.active) particle.destroy();
                }
            });
        }

        this.scene.events.emit('effect-hit', { x, y, color: colorValue });
    }

    createLootSparkles(x, y, type) {
        if (!this._isOnScreen(x, y)) return;

        const colorValue = this._resolveColor(type);
        const particleCount = type === 'powerup' ? 15 : 10;

        for (let i = 0; i < particleCount; i++) {
            const offsetX = Phaser.Math.Between(-20, 20);
            const offsetY = Phaser.Math.Between(-30, -10);
            const delay = i * 30;

            const particle = this._register(this.scene.add.rectangle(x, y, 2, 2, colorValue));
            particle.setDepth(40);
            particle.setAlpha(0);

            this.scene.tweens.add({
                targets: particle,
                x: x + offsetX,
                y: y + offsetY,
                alpha: 1,
                duration: 200,
                delay,
                ease: 'Power2',
                onComplete: () => {
                    this.scene.tweens.add({
                        targets: particle,
                        alpha: 0,
                        y: particle.y - 20,
                        duration: 400,
                        ease: 'Power2',
                        onComplete: () => {
                            if (particle && particle.active) particle.destroy();
                        }
                    });
                }
            });
        }

        const glow = this._register(this.scene.add.circle(x, y, 20, colorValue, 0.3));
        glow.setDepth(35);

        this.scene.tweens.add({
            targets: glow,
            scale: 1.5,
            alpha: 0,
            duration: 400,
            ease: 'Power2',
            onComplete: () => {
                if (glow && glow.active) glow.destroy();
            }
        });

        this.scene.events.emit('effect-loot', { x, y, type });
    }

    createAttackEffect(x, y, direction) {
        if (!this._isOnScreen(x, y)) return;

        const particleCount = 6;
        const colorValue = 0x00ffff;

        let baseAngle = 0;
        switch (direction) {
            case 'up':
                baseAngle = -Math.PI / 2;
                break;
            case 'down':
                baseAngle = Math.PI / 2;
                break;
            case 'left':
                baseAngle = Math.PI;
                break;
            case 'right':
            default:
                baseAngle = 0;
                break;
        }

        for (let i = 0; i < particleCount; i++) {
            const spread = Math.PI / 3;
            const angle = baseAngle + (spread * (i / (particleCount - 1)) - spread / 2);
            const distance = Phaser.Math.Between(30, 50);

            const particle = this._register(this.scene.add.rectangle(x, y, 4, 4, colorValue, 0.8));
            particle.setDepth(45);

            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                scale: 0.3,
                duration: 250,
                ease: 'Power2',
                onComplete: () => {
                    if (particle && particle.active) particle.destroy();
                }
            });
        }

        this.scene.events.emit('effect-attack', { x, y, direction });
    }

    createDeathExplosion(x, y, color, particleCount = 20) {
        if (!this._isOnScreen(x, y)) return;

        const colorValue = this._resolveColor(color);

        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const size = Phaser.Math.Between(4, 8);
            const distance = Phaser.Math.Between(60, 100);

            const particle = this._register(this.scene.add.rectangle(x, y, size, size, colorValue));
            particle.setDepth(50);

            const targetX = x + Math.cos(angle) * distance;
            const targetY = y + Math.sin(angle) * distance;

            this.scene.tweens.add({
                targets: particle,
                x: targetX,
                y: targetY,
                alpha: 0,
                scale: 0.2,
                duration: Phaser.Math.Between(400, 600),
                ease: 'Power2',
                onComplete: () => {
                    if (particle && particle.active) particle.destroy();
                }
            });
        }

        const flash = this._register(this.scene.add.circle(x, y, 30, colorValue, 0.8));
        flash.setDepth(49);

        this.scene.tweens.add({
            targets: flash,
            scale: 2,
            alpha: 0,
            duration: 400,
            ease: 'Power2',
            onComplete: () => {
                if (flash && flash.active) flash.destroy();
            }
        });

        this.scene.events.emit('effect-death', { x, y, color: colorValue });
    }

    createLevelUpBurst(x, y) {
        if (!this._isOnScreen(x, y)) return;

        const particleCount = 30;
        const colorValue = this.colors.levelup;

        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const distance = Phaser.Math.Between(80, 120);
            const size = Phaser.Math.Between(5, 10);
            const delay = Math.random() * 100;

            const particle = this._register(this.scene.add.star(x, y, 5, size / 2, size, colorValue));
            particle.setDepth(100);

            const targetX = x + Math.cos(angle) * distance;
            const targetY = y + Math.sin(angle) * distance;

            this.scene.tweens.add({
                targets: particle,
                x: targetX,
                y: targetY,
                alpha: 0,
                angle: 360,
                scale: 0.5,
                duration: 800,
                delay,
                ease: 'Power2',
                onComplete: () => {
                    if (particle && particle.active) particle.destroy();
                }
            });
        }

        for (let ring = 0; ring < 3; ring++) {
            const delay = ring * 150;
            const glow = this._register(this.scene.add.circle(x, y, 40, colorValue, 0.4));
            glow.setDepth(99);

            this.scene.tweens.add({
                targets: glow,
                scale: 3,
                alpha: 0,
                duration: 600,
                delay,
                ease: 'Power2',
                onComplete: () => {
                    if (glow && glow.active) glow.destroy();
                }
            });
        }

        this.scene.events.emit('effect-levelup', { x, y });
    }

    createBossPhaseEffect(x, y) {
        if (!this._isOnScreen(x, y)) return;

        const particleCount = 20;
        const colorValue = this.colors.boss;

        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const spiralOffset = i * 5;
            const delay = i * 30;

            const particle = this._register(this.scene.add.rectangle(x, y, 6, 6, colorValue));
            particle.setDepth(60);

            const distance = 100;
            const targetX = x + Math.cos(angle) * distance + spiralOffset;
            const targetY = y + Math.sin(angle) * distance;

            this.scene.tweens.add({
                targets: particle,
                x: targetX,
                y: targetY,
                alpha: 0,
                rotation: Math.PI * 2,
                duration: 800,
                delay,
                ease: 'Power2',
                onComplete: () => {
                    if (particle && particle.active) particle.destroy();
                }
            });
        }

        const glitchColors = [0xff00ff, 0x00ffff, 0x8b00ff];
        glitchColors.forEach((glitchColor, index) => {
            const delay = index * 100;
            const ring = this._register(this.scene.add.circle(x, y, 50, glitchColor, 0.3));
            ring.setDepth(59);

            this.scene.tweens.add({
                targets: ring,
                scale: 2.5,
                alpha: 0,
                duration: 600,
                delay,
                ease: 'Power2',
                onComplete: () => {
                    if (ring && ring.active) ring.destroy();
                }
            });
        });

        this.scene.events.emit('effect-boss-phase', { x, y });
    }

    createBossDeathEffect(x, y) {
        if (!this._isOnScreen(x, y)) return;

        const particleCount = 40;

        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const color = i % 2 === 0 ? this.colors.levelup : this.colors.boss;
            const size = Phaser.Math.Between(6, 12);
            const distance = Phaser.Math.Between(120, 180);
            const delay = Math.random() * 200;

            const particle = this._register(this.scene.add.star(x, y, 5, size / 2, size, color));
            particle.setDepth(100);

            const targetX = x + Math.cos(angle) * distance;
            const targetY = y + Math.sin(angle) * distance;

            this.scene.tweens.add({
                targets: particle,
                x: targetX,
                y: targetY,
                alpha: 0,
                angle: 720,
                scale: 0.3,
                duration: 1200,
                delay,
                ease: 'Power2',
                onComplete: () => {
                    if (particle && particle.active) particle.destroy();
                }
            });
        }

        for (let ring = 0; ring < 5; ring++) {
            const delay = ring * 200;
            const color = ring % 2 === 0 ? this.colors.levelup : this.colors.boss;
            const glow = this._register(this.scene.add.circle(x, y, 60, color, 0.5));
            glow.setDepth(99);

            this.scene.tweens.add({
                targets: glow,
                scale: 4,
                alpha: 0,
                duration: 800,
                delay,
                ease: 'Power2',
                onComplete: () => {
                    if (glow && glow.active) glow.destroy();
                }
            });
        }

        this.scene.events.emit('effect-boss-death', { x, y });
    }

    getFactionColor(faction) {
        return this.colors[faction] || 0xffffff;
    }

    getRegionColor() {
        const currentRegion = this.scene.currentRegion || Regions.SILENT_VILLAGE;
        return this.colors[currentRegion] || 0x00ffff;
    }

    cleanup() {
        const objects = [...this._activeObjects];
        this._activeObjects = [];

        objects.forEach((obj) => {
            if (obj && obj.active && obj.destroy) {
                obj.destroy();
            }
        });
    }

    destroy() {
        this.cleanup();
    }
}
