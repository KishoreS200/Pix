import { BossConfig } from './BossConfig';
import { NPCConfig } from './NPCConfig';

export const GamePalette = {
    primary: '#00ffff',
    secondary: '#1a0033',
    accent: '#ff00ff',
    neutral: '#808080',
    health: '#00ff00',
    corruption: '#ff0000',
    outline: '#0a0014'
};

export const PixelArtSpec = {
    baseCharacterSize: 16,
    characterScale: 2,
    frameSizePx: 32
};

function createCanvas(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, width, height);

    return { canvas, ctx };
}

function createPixelPainter(ctx, originX, originY, scale) {
    return {
        px(x, y, color, alpha = 1) {
            if (!color) return;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = color;
            ctx.fillRect(originX + x * scale, originY + y * scale, scale, scale);
            ctx.globalAlpha = 1;
        },
        rect(x, y, w, h, color, alpha = 1) {
            if (!color) return;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = color;
            ctx.fillRect(originX + x * scale, originY + y * scale, w * scale, h * scale);
            ctx.globalAlpha = 1;
        },
        clear(color = null) {
            if (color) {
                ctx.fillStyle = color;
                ctx.fillRect(originX, originY, PixelArtSpec.baseCharacterSize * scale, PixelArtSpec.baseCharacterSize * scale);
            } else {
                ctx.clearRect(originX, originY, PixelArtSpec.baseCharacterSize * scale, PixelArtSpec.baseCharacterSize * scale);
            }
        }
    };
}

function drawHumanoid(p, colors, direction, pose) {
    const outline = colors.outline ?? GamePalette.outline;

    const headX = 6;
    const headY = 1 + (pose?.bob ?? 0);
    const bodyX = 5;
    const bodyY = 6 + (pose?.bob ?? 0);

    // Head outline + fill
    p.rect(headX - 1, headY - 1, 6, 6, outline);
    p.rect(headX, headY, 4, 4, colors.skin);

    // Hair/hood
    if (colors.hair) {
        p.rect(headX, headY, 4, 1, colors.hair);
        p.px(headX, headY + 1, colors.hair);
        p.px(headX + 3, headY + 1, colors.hair);
    }

    // Eyes (down/front only)
    if (direction === 'down') {
        p.px(headX + 1, headY + 2, colors.eye ?? '#000000');
        p.px(headX + 2, headY + 2, colors.eye ?? '#000000');
    }

    // Beard
    if (colors.beard) {
        p.rect(headX + 1, headY + 3, 2, 2, colors.beard);
        p.px(headX, headY + 3, colors.beard);
        p.px(headX + 3, headY + 3, colors.beard);
    }

    // Body outline + fill
    p.rect(bodyX - 1, bodyY - 1, 8, 8, outline);
    p.rect(bodyX, bodyY, 6, 6, colors.outfit);

    // Belt/trim
    if (colors.trim) {
        p.rect(bodyX, bodyY + 3, 6, 1, colors.trim);
    }

    // Legs
    const legA = (pose?.legA ?? 0);
    const legB = (pose?.legB ?? 0);
    p.rect(bodyX, bodyY + 6, 3, 3, colors.pants ?? colors.outfitDark ?? colors.outfit);
    p.rect(bodyX + 3, bodyY + 6, 3, 3, colors.pants ?? colors.outfitDark ?? colors.outfit);

    // leg offsets for walk cycle (swap feet)
    p.rect(bodyX + legA, bodyY + 9, 3, 2, colors.boots ?? outline);
    p.rect(bodyX + 3 + legB, bodyY + 9, 3, 2, colors.boots ?? outline);

    // Backpack (visible on side/back)
    if (colors.backpack && (direction === 'left' || direction === 'right' || direction === 'up')) {
        const packX = direction === 'left' ? bodyX + 6 : bodyX - 1;
        p.rect(packX, bodyY + 1, 2, 4, outline);
        p.rect(packX + 1, bodyY + 2, 1, 2, colors.backpack);
    }

    // Weapon (simple sword)
    if (colors.weapon) {
        if (pose?.attack) {
            if (direction === 'right') {
                p.rect(bodyX + 7, bodyY + 1, 1, 5, colors.weapon);
                p.px(bodyX + 7, bodyY, colors.accent ?? GamePalette.primary);
            } else if (direction === 'left') {
                p.rect(bodyX - 2, bodyY + 1, 1, 5, colors.weapon);
                p.px(bodyX - 2, bodyY, colors.accent ?? GamePalette.primary);
            } else if (direction === 'up') {
                p.rect(bodyX + 2, bodyY - 2, 2, 2, colors.weapon);
                p.px(bodyX + 2, bodyY - 3, colors.accent ?? GamePalette.primary);
            } else {
                p.rect(bodyX + 6, bodyY + 2, 2, 1, colors.weapon);
                p.px(bodyX + 8, bodyY + 2, colors.accent ?? GamePalette.primary);
            }
        } else {
            if (direction === 'right') {
                p.rect(bodyX + 7, bodyY + 2, 1, 4, colors.weapon);
            } else if (direction === 'left') {
                p.rect(bodyX - 2, bodyY + 2, 1, 4, colors.weapon);
            } else {
                p.rect(bodyX + 5, bodyY + 2, 1, 4, colors.weapon);
            }
        }
    }

    // Glitch accents
    if (colors.accent) {
        const a = colors.accent;
        p.px(bodyX + 1, bodyY, a, 0.8);
        p.px(bodyX + 4, bodyY + 5, a, 0.8);
        p.px(headX + 3, headY + 4, a, 0.6);
    }
}

function createSpriteSheet(scene, key, frameWidth, frameHeight, frameCount, drawFrame) {
    if (scene.textures.exists(key)) return;

    const { canvas, ctx } = createCanvas(frameWidth * frameCount, frameHeight);

    for (let i = 0; i < frameCount; i++) {
        const originX = i * frameWidth;
        drawFrame(ctx, i, originX);
    }

    scene.textures.addSpriteSheet(key, canvas, { frameWidth, frameHeight });
}

function drawPlayerFrame(ctx, frameIndex, originX) {
    const scale = PixelArtSpec.characterScale;
    const p = createPixelPainter(ctx, originX, 0, scale);

    const colors = {
        outline: GamePalette.outline,
        skin: '#ffcc99',
        hair: '#4a2a1a',
        outfit: '#1a2a4a',
        outfitDark: '#0c101a',
        pants: '#101a2f',
        boots: '#0a0a0a',
        weapon: '#c0c0ff',
        backpack: '#3a2a1a',
        trim: '#0f223a',
        accent: GamePalette.primary,
        eye: '#000000'
    };

    // Frame map
    const frames = {
        idle: {
            down: [0, 1],
            up: [2, 3],
            left: [4, 5],
            right: [6, 7]
        },
        walk: {
            down: [8, 9, 10, 11],
            up: [12, 13, 14, 15],
            left: [16, 17, 18, 19],
            right: [20, 21, 22, 23]
        },
        attack: {
            down: [24, 25, 26],
            up: [27, 28, 29],
            left: [30, 31, 32],
            right: [33, 34, 35]
        },
        hit: [36],
        death: [37, 38, 39, 40]
    };

    const resolve = () => {
        for (const [direction, list] of Object.entries(frames.idle)) {
            const idx = list.indexOf(frameIndex);
            if (idx !== -1) return { action: 'idle', direction, local: idx };
        }
        for (const [direction, list] of Object.entries(frames.walk)) {
            const idx = list.indexOf(frameIndex);
            if (idx !== -1) return { action: 'walk', direction, local: idx };
        }
        for (const [direction, list] of Object.entries(frames.attack)) {
            const idx = list.indexOf(frameIndex);
            if (idx !== -1) return { action: 'attack', direction, local: idx };
        }
        if (frames.hit.includes(frameIndex)) return { action: 'hit', direction: 'down', local: 0 };
        const deathIdx = frames.death.indexOf(frameIndex);
        if (deathIdx !== -1) return { action: 'death', direction: 'down', local: deathIdx };
        return { action: 'idle', direction: 'down', local: 0 };
    };

    const state = resolve();

    let pose = { bob: 0, legA: 0, legB: 0, attack: false };

    if (state.action === 'idle') {
        pose.bob = state.local === 1 ? 1 : 0;
    } else if (state.action === 'walk') {
        const walkLeg = [0, 1, 0, -1][state.local] ?? 0;
        pose.legA = walkLeg;
        pose.legB = -walkLeg;
    } else if (state.action === 'attack') {
        pose.attack = true;
        pose.bob = state.local === 1 ? -1 : 0;
    } else if (state.action === 'hit') {
        colors.accent = GamePalette.corruption;
        pose.bob = 1;
    } else if (state.action === 'death') {
        pose.bob = state.local;
        colors.accent = null;
    }

    drawHumanoid(p, colors, state.direction, pose);

    // Simple glitch aura (optional, subtle)
    if (state.action !== 'death') {
        p.px(2, 10, GamePalette.primary, 0.25);
        p.px(13, 7, GamePalette.primary, 0.25);
        p.px(12, 14, GamePalette.accent, 0.15);
    }
}

function drawNpcFrame(npcId, ctx, frameIndex, originX) {
    const scale = PixelArtSpec.characterScale;
    const p = createPixelPainter(ctx, originX, 0, scale);

    const presets = {
        elder: {
            skin: '#ffcc99',
            hair: '#d0d0d0',
            beard: '#d0d0d0',
            outfit: '#1a0033',
            trim: GamePalette.primary,
            weapon: null,
            backpack: null,
            accent: GamePalette.primary,
            staff: true
        },
        merchant: {
            skin: '#ffcc99',
            hair: '#6b3f2a',
            outfit: '#7a2a00',
            trim: '#daa520',
            weapon: null,
            backpack: '#3a2a1a',
            accent: GamePalette.accent,
            pouch: true
        },
        healer: {
            skin: '#ffcc99',
            hair: '#b58b5a',
            outfit: '#e6fff0',
            trim: '#00aa55',
            weapon: null,
            backpack: null,
            accent: GamePalette.health,
            potion: true
        },
        guard: {
            skin: '#ffcc99',
            hair: '#2b1b12',
            outfit: '#555555',
            trim: '#888844',
            weapon: '#c0c0ff',
            backpack: null,
            accent: GamePalette.primary,
            armor: true
        },
        villager_farmer: {
            skin: '#ffcc99',
            hair: '#6b3f2a',
            outfit: '#2d5016',
            trim: '#8b4513',
            weapon: null,
            backpack: null,
            accent: null,
            hat: true
        },
        villager_child: {
            skin: '#ffcc99',
            hair: '#ffb6c1',
            outfit: '#4a4a4a',
            trim: '#808080',
            weapon: null,
            backpack: null,
            accent: GamePalette.primary,
            child: true
        },

        // Existing NPCs from NPCConfig (full game coverage)
        shrineKeeper: {
            skin: '#ffcc99',
            hair: '#d0d0d0',
            outfit: '#9370db',
            trim: GamePalette.primary,
            weapon: null,
            backpack: null,
            accent: GamePalette.primary,
            staff: true
        },
        hermit: {
            skin: '#ffcc99',
            hair: '#6b3f2a',
            outfit: '#556b2f',
            trim: '#2d5016',
            weapon: null,
            backpack: '#3a2a1a',
            accent: null
        },
        miner: {
            skin: '#ffcc99',
            hair: '#4a2a1a',
            outfit: '#ff8c00',
            trim: '#2a2a2a',
            weapon: '#aaaaaa',
            backpack: null,
            accent: GamePalette.primary
        },
        crystalMerchant: {
            skin: '#ffcc99',
            hair: '#b58b5a',
            outfit: '#00ced1',
            trim: GamePalette.primary,
            weapon: null,
            backpack: null,
            accent: GamePalette.primary,
            pouch: true
        },
        survivor: {
            skin: '#ffcc99',
            hair: '#2b1b12',
            outfit: '#696969',
            trim: '#404040',
            weapon: null,
            backpack: '#3a2a1a',
            accent: null
        },
        trader: {
            skin: '#ffcc99',
            hair: '#6b3f2a',
            outfit: '#cd853f',
            trim: '#daa520',
            weapon: null,
            backpack: '#3a2a1a',
            accent: GamePalette.accent,
            pouch: true
        },
        cityGuard: {
            skin: '#ffcc99',
            hair: '#2b1b12',
            outfit: '#2f4f4f',
            trim: '#808080',
            weapon: '#c0c0ff',
            backpack: null,
            accent: GamePalette.primary,
            armor: true
        },
        villager1: {
            skin: '#ffcc99',
            hair: '#6b3f2a',
            outfit: '#dcdcdc',
            trim: '#808080',
            weapon: null,
            backpack: '#3a2a1a',
            accent: null
        },
        villager2: {
            skin: '#ffcc99',
            hair: '#b58b5a',
            outfit: '#f5deb3',
            trim: '#8b4513',
            weapon: null,
            backpack: null,
            accent: null,
            hat: true
        },
        villager3: {
            skin: '#ffcc99',
            hair: '#ffb6c1',
            outfit: '#ffb6c1',
            trim: '#808080',
            weapon: null,
            backpack: null,
            accent: GamePalette.primary,
            child: true
        }
    };

    const preset = presets[npcId] ?? presets.villager_farmer;

    const colors = {
        outline: GamePalette.outline,
        skin: preset.skin,
        hair: preset.hair,
        beard: preset.beard,
        outfit: preset.outfit,
        pants: preset.outfit,
        boots: GamePalette.outline,
        trim: preset.trim,
        weapon: preset.weapon,
        backpack: preset.backpack,
        accent: preset.accent,
        eye: '#000000'
    };

    // NPC: 8 frames (2 idle x 4 dirs) + 16 walk (4 x 4) = 24 frames
    const directionMap = ['down', 'up', 'left', 'right'];
    const isIdle = frameIndex < 8;

    let direction;
    let local;

    if (isIdle) {
        direction = directionMap[Math.floor(frameIndex / 2)];
        local = frameIndex % 2;
    } else {
        const idx = frameIndex - 8;
        direction = directionMap[Math.floor(idx / 4)];
        local = idx % 4;
    }

    let pose = { bob: 0, legA: 0, legB: 0, attack: false };
    if (isIdle) {
        pose.bob = local === 1 ? 1 : 0;
    } else {
        const walkLeg = [0, 1, 0, -1][local] ?? 0;
        pose.legA = walkLeg;
        pose.legB = -walkLeg;
    }

    if (preset.child) {
        // Simple scale-down by shifting up / shrinking body
        pose.bob = Math.max(0, pose.bob - 1);
    }

    drawHumanoid(p, colors, direction, pose);

    // Accessories
    const bodyX = 5;
    const bodyY = 6 + (pose.bob ?? 0);

    if (preset.staff) {
        p.rect(bodyX - 3, bodyY - 2, 1, 12, colors.outline);
        p.rect(bodyX - 3, bodyY, 1, 9, '#5a3a1a');
        p.px(bodyX - 3, bodyY - 2, GamePalette.primary);
    }

    if (preset.pouch) {
        p.rect(bodyX + 6, bodyY + 4, 2, 2, colors.outline);
        p.rect(bodyX + 7, bodyY + 5, 1, 1, '#daa520');
    }

    if (preset.potion) {
        p.rect(bodyX + 6, bodyY + 2, 2, 3, colors.outline);
        p.rect(bodyX + 7, bodyY + 3, 1, 1, GamePalette.health);
    }

    if (preset.armor) {
        p.rect(bodyX, bodyY + 1, 6, 1, '#888888');
        p.px(bodyX + 2, bodyY + 2, GamePalette.primary, 0.7);
    }

    if (preset.hat) {
        p.rect(5, 0, 6, 2, colors.outline);
        p.rect(6, 1, 4, 1, '#8b4513');
        p.rect(4, 2, 8, 1, '#8b4513');
    }
}

function drawEnemyFrame(enemyKey, ctx, frameIndex, originX) {
    const scale = PixelArtSpec.characterScale;
    const p = createPixelPainter(ctx, originX, 0, scale);

    const variants = {
        enemy_glitch_sprite: {
            base: '#0b1533',
            accent: GamePalette.primary,
            accent2: GamePalette.accent,
            outline: GamePalette.outline,
            type: 'glitch'
        },
        enemy_corrupted_rat: {
            base: '#808080',
            accent: GamePalette.corruption,
            accent2: GamePalette.primary,
            outline: GamePalette.outline,
            type: 'rat'
        },
        enemy_thorned_beast: {
            base: '#2d5016',
            accent: '#8b4513',
            accent2: GamePalette.corruption,
            outline: GamePalette.outline,
            type: 'beast'
        },
        enemy_forest_wraith: {
            base: '#1a0033',
            accent: '#8a2be2',
            accent2: GamePalette.primary,
            outline: GamePalette.outline,
            type: 'wraith'
        },
        enemy_crystal_golem: {
            base: '#2a2a2a',
            accent: '#40e0d0',
            accent2: GamePalette.primary,
            outline: GamePalette.outline,
            type: 'golem'
        },
        enemy_mining_glitch: {
            base: '#7a5a3a',
            accent: '#ff8c00',
            accent2: GamePalette.primary,
            outline: GamePalette.outline,
            type: 'miner'
        },
        enemy_corrupted_sentinel: {
            base: '#555555',
            accent: GamePalette.accent,
            accent2: GamePalette.primary,
            outline: GamePalette.outline,
            type: 'sentinel'
        },
        enemy_urban_ghoul: {
            base: '#6b7a2a',
            accent: '#c2b280',
            accent2: GamePalette.corruption,
            outline: GamePalette.outline,
            type: 'ghoul'
        },
        enemy_void_entity: {
            base: GamePalette.secondary,
            accent: GamePalette.primary,
            accent2: GamePalette.accent,
            outline: GamePalette.outline,
            type: 'void'
        },
        enemy_corrupted_guardian: {
            base: '#2d002d',
            accent: GamePalette.corruption,
            accent2: GamePalette.primary,
            outline: GamePalette.outline,
            type: 'guardian'
        },

        // Legacy keys
        glitch_fauna: {
            base: '#0b1533',
            accent: '#ff00ff',
            accent2: GamePalette.primary,
            outline: GamePalette.outline,
            type: 'glitch'
        },
        corrupted_human: {
            base: '#666666',
            accent: '#c2b280',
            accent2: GamePalette.corruption,
            outline: GamePalette.outline,
            type: 'ghoul'
        },
        sentinel_machine: {
            base: '#2f4f4f',
            accent: '#00ced1',
            accent2: GamePalette.primary,
            outline: GamePalette.outline,
            type: 'sentinel'
        }
    };

    const variant = variants[enemyKey] ?? variants.enemy_glitch_sprite;

    // Enemy sprite sheet: 14 frames
    // idle: 0-1, walk: 2-5, attack: 6-8, hit: 9, death: 10-13
    let state = 'idle';
    let local = 0;

    if (frameIndex <= 1) {
        state = 'idle';
        local = frameIndex;
    } else if (frameIndex <= 5) {
        state = 'walk';
        local = frameIndex - 2;
    } else if (frameIndex <= 8) {
        state = 'attack';
        local = frameIndex - 6;
    } else if (frameIndex === 9) {
        state = 'hit';
        local = 0;
    } else {
        state = 'death';
        local = frameIndex - 10;
    }

    const o = variant.outline;

    switch (variant.type) {
        case 'glitch': {
            const jitter = state === 'walk' ? [0, 1, 0, -1][local] ?? 0 : 0;
            p.rect(4 + jitter, 4, 8, 8, o);
            p.rect(5 + jitter, 5, 6, 6, variant.base);
            // Pixel clusters
            for (let i = 0; i < 10; i++) {
                const x = 4 + ((i * 3 + frameIndex * 2) % 8);
                const y = 4 + ((i * 5 + frameIndex) % 8);
                p.px(x, y, (i % 3 === 0) ? variant.accent2 : variant.accent, 0.8);
            }
            if (state === 'attack') {
                p.rect(2, 6, 2, 2, variant.accent2);
                p.rect(12, 6, 2, 2, variant.accent2);
            }
            if (state === 'death') {
                p.px(6, 6, variant.accent2, 0.3);
                p.px(9, 9, variant.accent2, 0.3);
            }
            break;
        }
        case 'rat': {
            const scurry = state === 'walk' ? [0, 1, 0, -1][local] ?? 0 : 0;
            // Body
            p.rect(3 + scurry, 8, 10, 5, o);
            p.rect(4 + scurry, 9, 8, 3, variant.base);
            // Head
            p.rect(2 + scurry, 9, 3, 3, o);
            p.rect(3 + scurry, 10, 2, 1, '#aaaaaa');
            // Red corruption streaks
            p.px(8 + scurry, 10, variant.accent);
            p.px(10 + scurry, 11, variant.accent);
            // Tail
            p.rect(13 + scurry, 10, 2, 1, variant.accent2);
            if (state === 'attack') {
                p.px(1 + scurry, 10, variant.accent);
                p.px(2 + scurry, 9, variant.accent);
            }
            break;
        }
        case 'beast': {
            const step = state === 'walk' ? [0, 1, 0, -1][local] ?? 0 : 0;
            p.rect(3, 6 + step, 10, 8, o);
            p.rect(4, 7 + step, 8, 6, variant.base);
            // Horns / thorns
            p.px(5, 6 + step, variant.accent2);
            p.px(10, 6 + step, variant.accent2);
            p.px(7, 5 + step, variant.accent2);
            // Eyes
            p.px(6, 9 + step, variant.accent);
            p.px(9, 9 + step, variant.accent);
            if (state === 'attack') {
                p.rect(1, 10, 3, 2, variant.accent2);
            }
            break;
        }
        case 'wraith': {
            const phase = (state === 'walk' ? local : 0);
            const alpha = state === 'walk' ? 0.55 : 0.75;
            p.rect(4, 3, 8, 10, o, alpha);
            p.rect(5, 4, 6, 8, variant.accent, alpha);
            p.px(6 + phase, 6, variant.accent2, 0.9);
            p.px(9 - phase, 6, variant.accent2, 0.9);
            // Wisps
            p.px(3, 12 - phase, variant.accent2, 0.4);
            p.px(12, 12 - phase, variant.accent2, 0.4);
            if (state === 'attack') {
                p.rect(6, 1, 4, 2, variant.accent2, 0.7);
            }
            break;
        }
        case 'golem': {
            const bob = state === 'walk' ? [0, 1, 0, -1][local] ?? 0 : 0;
            p.rect(3, 4 + bob, 10, 11, o);
            p.rect(4, 5 + bob, 8, 9, variant.base);
            // Crystal core
            p.rect(7, 8 + bob, 2, 2, variant.accent2);
            // Crystal shards
            p.px(5, 6 + bob, variant.accent);
            p.px(10, 7 + bob, variant.accent);
            p.px(6, 12 + bob, variant.accent);
            if (state === 'attack') {
                p.rect(1, 7 + bob, 3, 3, variant.accent2);
            }
            break;
        }
        case 'miner': {
            const step = state === 'walk' ? [0, 1, 0, -1][local] ?? 0 : 0;
            // Humanoid miner
            drawHumanoid(p, {
                outline: o,
                skin: '#ffcc99',
                hair: '#4a2a1a',
                outfit: variant.base,
                pants: variant.base,
                boots: GamePalette.outline,
                trim: variant.accent,
                weapon: '#aaaaaa',
                backpack: null,
                accent: variant.accent2
            }, 'down', { bob: step, legA: step, legB: -step, attack: state === 'attack' });
            // Pickaxe head
            p.rect(12, 8, 2, 1, '#aaaaaa');
            if (state === 'attack') {
                p.rect(10, 6, 5, 2, variant.accent2, 0.4);
            }
            break;
        }
        case 'sentinel': {
            const tick = state === 'walk' ? local : 0;
            p.rect(3, 4, 10, 10, o);
            p.rect(4, 5, 8, 8, variant.base);
            // Sensor
            p.rect(7, 7, 2, 2, variant.accent2);
            p.px(6, 7 + tick % 2, variant.accent);
            p.px(9, 7 + (tick + 1) % 2, variant.accent);
            if (state === 'attack') {
                p.rect(6, 2, 4, 2, variant.accent2);
            }
            break;
        }
        case 'ghoul': {
            const lurch = state === 'walk' ? [0, 1, 0, -1][local] ?? 0 : 0;
            p.rect(4, 3 + lurch, 8, 12, o);
            p.rect(5, 4 + lurch, 6, 10, variant.base);
            // Mouth / corruption
            p.rect(6, 10 + lurch, 4, 1, variant.accent2);
            p.px(6, 6 + lurch, variant.accent);
            p.px(9, 6 + lurch, variant.accent);
            if (state === 'attack') {
                p.rect(3, 9 + lurch, 2, 2, variant.accent2);
            }
            break;
        }
        case 'void': {
            const pulse = state === 'idle' ? local : (state === 'walk' ? local : 1);
            p.rect(3, 3, 10, 10, o);
            p.rect(4, 4, 8, 8, variant.base);
            // Rifts
            p.rect(6, 6, 1, 4, variant.accent2, 0.8);
            p.rect(9, 5, 1, 5, variant.accent, 0.7);
            if (pulse % 2 === 1) {
                p.px(5, 5, variant.accent2);
                p.px(10, 10, variant.accent2);
            }
            if (state === 'attack') {
                p.rect(2, 2, 12, 1, variant.accent2, 0.6);
            }
            break;
        }
        case 'guardian': {
            const bob = state === 'walk' ? [0, 1, 0, -1][local] ?? 0 : 0;
            p.rect(2, 2 + bob, 12, 13, o);
            p.rect(3, 3 + bob, 10, 11, variant.base);
            // Crystal horns
            p.px(4, 2 + bob, variant.accent2);
            p.px(11, 2 + bob, variant.accent2);
            // Core
            p.rect(7, 7 + bob, 2, 2, variant.accent);
            // Claws
            p.px(2, 12 + bob, variant.accent2);
            p.px(13, 12 + bob, variant.accent2);
            if (state === 'attack') {
                p.rect(6, 1, 4, 3, variant.accent, 0.5);
            }
            break;
        }
    }

    if (state === 'hit') {
        p.rect(0, 0, 16, 16, GamePalette.corruption, 0.08);
    }

    if (state === 'death') {
        p.rect(0, 15 - local, 16, 1, GamePalette.secondary, 0.2);
    }
}

function drawBossFrame(bossKey, ctx, frameIndex, originX, frameWidth, frameHeight) {
    const baseScale = 2;
    const baseGrid = Math.floor(frameWidth / baseScale);
    const scale = baseScale;
    const p = {
        px(x, y, color, alpha = 1) {
            ctx.globalAlpha = alpha;
            ctx.fillStyle = color;
            ctx.fillRect(originX + x * scale, y * scale, scale, scale);
            ctx.globalAlpha = 1;
        },
        rect(x, y, w, h, color, alpha = 1) {
            ctx.globalAlpha = alpha;
            ctx.fillStyle = color;
            ctx.fillRect(originX + x * scale, y * scale, w * scale, h * scale);
            ctx.globalAlpha = 1;
        }
    };

    const variants = {
        glitch_entity: {
            body: '#555555',
            accent: GamePalette.primary,
            accent2: GamePalette.accent,
            outline: GamePalette.outline,
            core: GamePalette.primary
        },
        corrupted_nature_spirit: {
            body: '#2d5016',
            accent: '#8b4513',
            accent2: GamePalette.corruption,
            outline: GamePalette.outline,
            core: GamePalette.health
        },
        crystalline_sentinel: {
            body: '#2a2a2a',
            accent: '#40e0d0',
            accent2: '#8a2be2',
            outline: GamePalette.outline,
            core: GamePalette.primary
        },
        industrial_titan: {
            body: '#4a4a4a',
            accent: '#808080',
            accent2: GamePalette.accent,
            outline: GamePalette.outline,
            core: GamePalette.corruption
        },
        void_entity: {
            body: GamePalette.secondary,
            accent: GamePalette.primary,
            accent2: GamePalette.accent,
            outline: GamePalette.outline,
            core: GamePalette.primary
        }
    };

    const v = variants[bossKey] ?? variants.glitch_entity;

    // Boss sprite sheet: 16 frames
    // idle: 0-1, walk: 2-5, attack: 6-8, hit: 9, death: 10-13, special: 14-15
    let state = 'idle';
    let local = 0;

    if (frameIndex <= 1) {
        state = 'idle';
        local = frameIndex;
    } else if (frameIndex <= 5) {
        state = 'walk';
        local = frameIndex - 2;
    } else if (frameIndex <= 8) {
        state = 'attack';
        local = frameIndex - 6;
    } else if (frameIndex === 9) {
        state = 'hit';
        local = 0;
    } else if (frameIndex <= 13) {
        state = 'death';
        local = frameIndex - 10;
    } else {
        state = 'special';
        local = frameIndex - 14;
    }

    const o = v.outline;
    const cx = Math.floor(baseGrid / 2);
    const cy = Math.floor(baseGrid / 2);

    const bob = (state === 'walk') ? [0, 1, 0, -1][local] ?? 0 : 0;
    const pulse = (state === 'idle') ? local : 1;

    // Large body silhouette
    p.rect(4, 4 + bob, baseGrid - 8, baseGrid - 8, o);
    p.rect(5, 5 + bob, baseGrid - 10, baseGrid - 10, v.body);

    // Core
    const coreSize = bossKey === 'industrial_titan' ? 6 : 5;
    p.rect(cx - Math.floor(coreSize / 2), cy - Math.floor(coreSize / 2) + bob, coreSize, coreSize, v.core, 0.8);

    // Eyes/face
    p.rect(cx - 8, cy - 6 + bob, 4, 3, v.accent2);
    p.rect(cx + 4, cy - 6 + bob, 4, 3, v.accent2);

    // Signature features
    if (bossKey === 'corrupted_nature_spirit') {
        // vines
        p.rect(2, cy + 2 + bob, 3, 8, v.accent);
        p.rect(baseGrid - 5, cy + 2 + bob, 3, 8, v.accent);
        p.px(3, cy + 3 + bob, v.accent2);
        p.px(baseGrid - 4, cy + 6 + bob, v.accent2);
    }

    if (bossKey === 'crystalline_sentinel') {
        // crystal shards
        p.rect(cx - 12, cy - 2 + bob, 3, 6, v.accent);
        p.rect(cx + 9, cy - 2 + bob, 3, 6, v.accent);
        p.px(cx, cy - 12 + bob, v.accent2);
    }

    if (bossKey === 'industrial_titan') {
        // shoulders
        p.rect(2, 8 + bob, 6, 8, v.accent);
        p.rect(baseGrid - 8, 8 + bob, 6, 8, v.accent);
        // corruption vents
        p.px(cx - 2, 6 + bob, v.accent2);
        p.px(cx + 1, 6 + bob, v.accent2);
    }

    if (bossKey === 'void_entity') {
        // rifts
        p.rect(cx - 1, 6 + bob, 2, baseGrid - 12, v.accent2, 0.7);
        p.rect(cx + 6, 8 + bob, 1, baseGrid - 16, v.accent, 0.7);
        if (pulse) {
            p.px(6, 6 + bob, v.accent2);
            p.px(baseGrid - 7, baseGrid - 7 + bob, v.accent2);
        }
    }

    if (state === 'attack') {
        p.rect(0, cy - 1, baseGrid, 2, v.accent2, 0.35);
    }

    if (state === 'special') {
        p.rect(0, 0, baseGrid, baseGrid, v.accent, 0.12);
        p.rect(cx - 10 + local * 2, cy - 10, 6, 6, v.accent2, 0.6);
    }

    if (state === 'hit') {
        p.rect(0, 0, baseGrid, baseGrid, GamePalette.corruption, 0.08);
    }

    if (state === 'death') {
        p.rect(0, baseGrid - (local + 1) * 4, baseGrid, 4, GamePalette.secondary, 0.25);
    }
}

export function createAllCharacterSpriteSheets(scene) {
    // Player
    createSpriteSheet(scene, 'player', PixelArtSpec.frameSizePx, PixelArtSpec.frameSizePx, 41, (ctx, frameIndex, originX) => {
        drawPlayerFrame(ctx, frameIndex, originX);
    });

    // NPCs (generate for a curated set + any NPC IDs present in config)
    const npcIds = new Set();
    Object.values(NPCConfig).forEach(list => {
        (list || []).forEach(npc => {
            if (npc?.id) npcIds.add(npc.id);
        });
    });

    // Ensure required spec NPCs exist
    ['elder', 'merchant', 'healer', 'guard', 'villager_farmer', 'villager_child'].forEach(id => npcIds.add(id));

    npcIds.forEach(npcId => {
        const key = `npc_${npcId}`;
        createSpriteSheet(scene, key, PixelArtSpec.frameSizePx, PixelArtSpec.frameSizePx, 24, (ctx, frameIndex, originX) => {
            drawNpcFrame(npcId, ctx, frameIndex, originX);
        });
    });

    // Enemies (10+)
    const enemyKeys = [
        'enemy_glitch_sprite',
        'enemy_corrupted_rat',
        'enemy_thorned_beast',
        'enemy_forest_wraith',
        'enemy_crystal_golem',
        'enemy_mining_glitch',
        'enemy_corrupted_sentinel',
        'enemy_urban_ghoul',
        'enemy_void_entity',
        'enemy_corrupted_guardian',

        // Legacy keys used by earlier enemy prototypes
        'glitch_fauna',
        'corrupted_human',
        'sentinel_machine'
    ];

    enemyKeys.forEach(enemyKey => {
        createSpriteSheet(scene, enemyKey, PixelArtSpec.frameSizePx, PixelArtSpec.frameSizePx, 14, (ctx, frameIndex, originX) => {
            drawEnemyFrame(enemyKey, ctx, frameIndex, originX);
        });
    });

    // Bosses (generate for all bosses in config)
    Object.keys(BossConfig).forEach(bossKey => {
        const cfg = BossConfig[bossKey];
        const width = cfg?.size?.width ?? 64;
        const height = cfg?.size?.height ?? 64;
        const textureKey = `boss_${bossKey}`;

        createSpriteSheet(scene, textureKey, width, height, 16, (ctx, frameIndex, originX) => {
            drawBossFrame(bossKey, ctx, frameIndex, originX, width, height);
        });
    });
}
