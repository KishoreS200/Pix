import { SoundConfig } from '../utils/SoundConfig';
import { MusicConfig } from '../utils/MusicConfig';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export default class AudioManager {
    static getInstance(scene) {
        const game = scene?.game;
        if (!game) {
            return new AudioManager(scene);
        }

        if (!game.__audioManager) {
            game.__audioManager = new AudioManager(scene);
        } else {
            game.__audioManager.setScene(scene);
        }

        return game.__audioManager;
    }

    constructor(scene) {
        this.scene = scene;

        this.audioContext = null;
        this.ownsContext = false;

        this.masterGainNode = null;
        this.sfxGainNode = null;
        this.musicGainNode = null;

        this.masterVolume = 100;
        this.sfxVolume = 80;
        this.musicVolume = 60;
        this.muted = false;

        this.currentMusicKey = null;
        this.musicSource = null;
        this.musicSourceGain = null;

        this.musicBufferCache = new Map();
        this.musicCacheMax = 4;

        this.noiseBuffer = null;

        this._unlockHandlerBound = null;

        this._loadSettings();
        this._initAudioContext();
        this._setupMobileUnlock();
    }

    setScene(scene) {
        this.scene = scene;
    }

    _initAudioContext() {
        if (typeof window === 'undefined') return;

        const phaserCtx = this.scene?.sound?.context;
        if (phaserCtx && typeof phaserCtx.createGain === 'function') {
            this.audioContext = phaserCtx;
            this.ownsContext = false;
        } else {
            try {
                const Ctx = window.AudioContext || window.webkitAudioContext;
                if (Ctx) {
                    this.audioContext = new Ctx();
                    this.ownsContext = true;
                }
            } catch (error) {
                console.warn('[AudioManager] Failed to initialize audio context:', error);
                this.audioContext = null;
            }
        }

        if (!this.audioContext) return;

        this.masterGainNode = this.audioContext.createGain();
        this.sfxGainNode = this.audioContext.createGain();
        this.musicGainNode = this.audioContext.createGain();

        this.sfxGainNode.connect(this.masterGainNode);
        this.musicGainNode.connect(this.masterGainNode);

        const phaserMaster =
            this.scene?.sound?.masterGainNode ||
            this.scene?.sound?.masterVolumeNode ||
            this.scene?.sound?.destination;

        if (phaserMaster && typeof phaserMaster.connect === 'function') {
            this.masterGainNode.connect(phaserMaster);
        } else {
            this.masterGainNode.connect(this.audioContext.destination);
        }

        this._updateGainNodes();

        this._ensureNoiseBuffer();
    }

    _setupMobileUnlock() {
        if (typeof document === 'undefined') return;
        if (!this.audioContext) return;

        this._unlockHandlerBound = () => {
            if (this.audioContext?.state === 'suspended') {
                this.audioContext.resume().catch(() => undefined);
            }

            if (this.scene?.sound?.locked && this.scene?.sound?.unlock) {
                try {
                    this.scene.sound.unlock();
                } catch (_) {
                    // ignore
                }
            }

            document.removeEventListener('pointerdown', this._unlockHandlerBound);
            document.removeEventListener('touchstart', this._unlockHandlerBound);
            document.removeEventListener('keydown', this._unlockHandlerBound);
        };

        document.addEventListener('pointerdown', this._unlockHandlerBound, { passive: true });
        document.addEventListener('touchstart', this._unlockHandlerBound, { passive: true });
        document.addEventListener('keydown', this._unlockHandlerBound);
    }

    _loadSettings() {
        if (typeof localStorage === 'undefined') return;

        try {
            const master = localStorage.getItem('audio_master_volume');
            const sfx = localStorage.getItem('audio_sfx_volume');
            const music = localStorage.getItem('audio_music_volume');
            const muted = localStorage.getItem('audio_muted');

            if (master !== null) this.masterVolume = clamp(parseInt(master, 10), 0, 100);
            if (sfx !== null) this.sfxVolume = clamp(parseInt(sfx, 10), 0, 100);
            if (music !== null) this.musicVolume = clamp(parseInt(music, 10), 0, 100);
            if (muted !== null) this.muted = muted === 'true';
        } catch (error) {
            console.warn('[AudioManager] Failed to load audio settings:', error);
        }
    }

    _saveSettings() {
        if (typeof localStorage === 'undefined') return;

        try {
            localStorage.setItem('audio_master_volume', String(this.masterVolume));
            localStorage.setItem('audio_sfx_volume', String(this.sfxVolume));
            localStorage.setItem('audio_music_volume', String(this.musicVolume));
            localStorage.setItem('audio_muted', String(this.muted));
        } catch (error) {
            console.warn('[AudioManager] Failed to save audio settings:', error);
        }
    }

    _updateGainNodes() {
        if (!this.masterGainNode || !this.sfxGainNode || !this.musicGainNode) return;

        const master = this.muted ? 0 : this.masterVolume / 100;
        this.masterGainNode.gain.setValueAtTime(master, this.audioContext.currentTime);

        this.sfxGainNode.gain.setValueAtTime(this.sfxVolume / 100, this.audioContext.currentTime);
        this.musicGainNode.gain.setValueAtTime(this.musicVolume / 100, this.audioContext.currentTime);
    }

    _ensureNoiseBuffer() {
        if (!this.audioContext || this.noiseBuffer) return;

        const sampleRate = this.audioContext.sampleRate;
        const seconds = 1;
        const buffer = this.audioContext.createBuffer(1, sampleRate * seconds, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < data.length; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        this.noiseBuffer = buffer;
    }

    preloadAudio() {
        if (!this.audioContext) return;
        this._ensureNoiseBuffer();
    }

    setVolume(type, value) {
        const v = clamp(value, 0, 100);

        if (type === 'master') this.masterVolume = v;
        if (type === 'sfx') this.sfxVolume = v;
        if (type === 'music') this.musicVolume = v;

        this._updateGainNodes();
        this._saveSettings();
    }

    toggleMute() {
        this.muted = !this.muted;
        this._updateGainNodes();
        this._saveSettings();
        return this.muted;
    }

    playSound(key, volume = undefined) {
        if (!this.audioContext) return;
        if (this.muted) return;

        const cfg = SoundConfig[key];
        if (!cfg) return;

        const mult = this._normalizeMultiplier(volume);

        try {
            this._playSoundWithConfig(cfg, mult);
        } catch (error) {
            console.warn(`[AudioManager] Failed to play sound: ${key}`, error);
        }
    }

    _normalizeMultiplier(volume) {
        if (volume === undefined || volume === null) return 1;

        if (typeof volume !== 'number' || Number.isNaN(volume)) return 1;

        // allow either 0..1 multiplier or 0..100 percent
        if (volume > 1) return clamp(volume / 100, 0, 1);
        return clamp(volume, 0, 1);
    }

    _applyAdsr(gainNode, startTime, duration, peak) {
        const env = duration.envelope;
        const attack = clamp(env?.attack ?? 0.01, 0, 2);
        const decay = clamp(env?.decay ?? 0.05, 0, 2);
        const sustain = clamp(env?.sustain ?? 0.4, 0, 1);
        const release = clamp(env?.release ?? 0.05, 0, 2);

        const end = startTime + duration.duration;
        const releaseStart = Math.max(startTime, end - release);

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(peak, startTime + attack);
        gainNode.gain.linearRampToValueAtTime(peak * sustain, startTime + attack + decay);
        gainNode.gain.setValueAtTime(peak * sustain, releaseStart);
        gainNode.gain.linearRampToValueAtTime(0, end);

        return end;
    }

    _playSoundWithConfig(cfg, mult) {
        const ctx = this.audioContext;
        const now = ctx.currentTime;

        const gainNode = ctx.createGain();
        gainNode.connect(this.sfxGainNode);

        const peak = clamp((cfg.volume ?? 0.4) * mult, 0, 1);
        const endTime = this._applyAdsr(gainNode, now, cfg, peak);

        switch (cfg.type) {
            case 'tone':
                this._tone(cfg, gainNode, now, endTime);
                break;
            case 'sweep':
                this._sweep(cfg, gainNode, now, endTime);
                break;
            case 'chord':
                this._chord(cfg, gainNode, now, endTime);
                break;
            case 'arpeggio':
                this._arpeggio(cfg, gainNode, now);
                break;
            case 'fanfare':
                this._fanfare(cfg, gainNode, now);
                break;
            case 'impact':
                this._impact(cfg, gainNode, now, endTime);
                break;
            case 'alarm':
                this._alarm(cfg, gainNode, now, endTime);
                break;
            default:
                this._tone({ ...cfg, frequency: cfg.frequency ?? 440 }, gainNode, now, endTime);
                break;
        }

        // Cleanup
        ctx.resume?.().catch(() => undefined);

        setTimeout(() => {
            try {
                gainNode.disconnect();
            } catch (_) {
                // ignore
            }
        }, Math.ceil(cfg.duration * 1000) + 50);
    }

    _tone(cfg, gainNode, startTime, endTime) {
        const osc = this.audioContext.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(cfg.frequency, startTime);
        osc.connect(gainNode);
        osc.start(startTime);
        osc.stop(endTime);
    }

    _sweep(cfg, gainNode, startTime, endTime) {
        const osc = this.audioContext.createOscillator();
        osc.type = cfg.modulation ? 'triangle' : 'sine';

        const startFreq = Math.max(1, cfg.startFreq);
        const endFreq = Math.max(1, cfg.endFreq);

        osc.frequency.setValueAtTime(startFreq, startTime);
        osc.frequency.exponentialRampToValueAtTime(endFreq, endTime);

        osc.connect(gainNode);
        osc.start(startTime);
        osc.stop(endTime);

        if (cfg.noise) {
            this._noiseBurst(gainNode, startTime, endTime, 0.25);
        }
    }

    _noiseBurst(destination, startTime, endTime, level) {
        if (!this.noiseBuffer) this._ensureNoiseBuffer();
        if (!this.noiseBuffer) return;

        const ctx = this.audioContext;
        const src = ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        src.loop = true;

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0, startTime);
        noiseGain.gain.linearRampToValueAtTime(level, startTime + 0.005);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, endTime);

        src.connect(noiseGain);
        noiseGain.connect(destination);

        src.start(startTime);
        src.stop(endTime);
    }

    _chord(cfg, gainNode, startTime, endTime) {
        cfg.frequencies.forEach((freq) => {
            const osc = this.audioContext.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, startTime);
            osc.connect(gainNode);
            osc.start(startTime);
            osc.stop(endTime);
        });
    }

    _arpeggio(cfg, gainNode, startTime) {
        const noteDuration = cfg.noteDuration ?? 0.1;

        cfg.frequencies.forEach((freq, i) => {
            const t0 = startTime + i * noteDuration;
            const t1 = t0 + noteDuration * 1.1;

            const osc = this.audioContext.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t0);

            const g = this.audioContext.createGain();
            g.gain.setValueAtTime(0, t0);
            g.gain.linearRampToValueAtTime(1, t0 + 0.01);
            g.gain.exponentialRampToValueAtTime(0.0001, t1);

            osc.connect(g);
            g.connect(gainNode);

            osc.start(t0);
            osc.stop(t1);
        });
    }

    _fanfare(cfg, gainNode, startTime) {
        const noteDuration = cfg.noteDuration ?? 0.15;

        cfg.frequencies.forEach((freq, i) => {
            const t0 = startTime + i * noteDuration * 0.75;
            const t1 = t0 + noteDuration;

            const osc = this.audioContext.createOscillator();
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, t0);

            const g = this.audioContext.createGain();
            g.gain.setValueAtTime(0.0001, t0);
            g.gain.exponentialRampToValueAtTime(0.6, t0 + 0.02);
            g.gain.exponentialRampToValueAtTime(0.0001, t1);

            osc.connect(g);
            g.connect(gainNode);

            osc.start(t0);
            osc.stop(t1);
        });
    }

    _impact(cfg, gainNode, startTime, endTime) {
        const osc = this.audioContext.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(cfg.frequency, startTime);
        osc.frequency.exponentialRampToValueAtTime(Math.max(1, cfg.frequency / 2), endTime);
        osc.connect(gainNode);
        osc.start(startTime);
        osc.stop(endTime);

        if (cfg.noise) {
            this._noiseBurst(gainNode, startTime, endTime, 0.4);
        }
    }

    _alarm(cfg, gainNode, startTime, endTime) {
        const osc = this.audioContext.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(cfg.frequency, startTime);

        const lfo = this.audioContext.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime((cfg.pulseRate ?? 6), startTime);

        const lfoGain = this.audioContext.createGain();
        lfoGain.gain.setValueAtTime(0.5, startTime);

        lfo.connect(lfoGain);
        lfoGain.connect(gainNode.gain);

        osc.connect(gainNode);

        osc.start(startTime);
        lfo.start(startTime);
        osc.stop(endTime);
        lfo.stop(endTime);
    }

    async playMusic(key, loop = true, fadeDuration = 500) {
        if (!this.audioContext) return;

        if (this.currentMusicKey === key && this.musicSource) {
            return;
        }

        await this.stopMusic(fadeDuration);

        if (this.muted) return;

        const buffer = this._getOrCreateMusicBuffer(key);
        if (!buffer) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        const src = ctx.createBufferSource();
        src.buffer = buffer;
        src.loop = loop;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(1, now + fadeDuration / 1000);

        src.connect(gain);
        gain.connect(this.musicGainNode);

        src.start(now);

        this.musicSource = src;
        this.musicSourceGain = gain;
        this.currentMusicKey = key;
    }

    async stopMusic(fadeDuration = 500) {
        if (!this.musicSource || !this.audioContext) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;
        const fadeSec = fadeDuration / 1000;

        return new Promise((resolve) => {
            try {
                const gain = this.musicSourceGain;
                if (gain) {
                    gain.gain.cancelScheduledValues(now);
                    gain.gain.setValueAtTime(gain.gain.value, now);
                    gain.gain.linearRampToValueAtTime(0, now + fadeSec);
                }

                setTimeout(() => {
                    try {
                        this.musicSource?.stop();
                        this.musicSource?.disconnect();
                        this.musicSourceGain?.disconnect();
                    } catch (_) {
                        // ignore
                    }

                    this.musicSource = null;
                    this.musicSourceGain = null;
                    this.currentMusicKey = null;
                    resolve();
                }, fadeDuration + 20);
            } catch (error) {
                console.warn('[AudioManager] Failed to stop music:', error);
                this.musicSource = null;
                this.musicSourceGain = null;
                this.currentMusicKey = null;
                resolve();
            }
        });
    }

    _getOrCreateMusicBuffer(key) {
        if (!MusicConfig[key]) {
            console.warn(`[AudioManager] Unknown music key: ${key}`);
            return null;
        }

        if (this.musicBufferCache.has(key)) {
            const buf = this.musicBufferCache.get(key);
            // refresh LRU
            this.musicBufferCache.delete(key);
            this.musicBufferCache.set(key, buf);
            return buf;
        }

        const buffer = this._generateMusicBuffer(key);
        if (!buffer) return null;

        this.musicBufferCache.set(key, buffer);
        while (this.musicBufferCache.size > this.musicCacheMax) {
            const oldestKey = this.musicBufferCache.keys().next().value;
            this.musicBufferCache.delete(oldestKey);
        }

        return buffer;
    }

    _generateMusicBuffer(key) {
        const cfg = MusicConfig[key];
        if (!cfg || !this.audioContext) return null;

        const sampleRate = this.audioContext.sampleRate;
        const seconds = cfg.lengthSeconds ?? 10;
        const frameCount = Math.floor(sampleRate * seconds);

        const buffer = this.audioContext.createBuffer(2, frameCount, sampleRate);
        const L = buffer.getChannelData(0);
        const R = buffer.getChannelData(1);

        switch (cfg.theme) {
            case 'glitch-ambient':
                this._genGlitchAmbient(L, R, cfg, sampleRate);
                break;
            case 'nature':
                this._genNature(L, R, cfg, sampleRate);
                break;
            case 'crystal':
                this._genCrystal(L, R, cfg, sampleRate);
                break;
            case 'industrial':
                this._genIndustrial(L, R, cfg, sampleRate);
                break;
            case 'core':
                this._genCore(L, R, cfg, sampleRate);
                break;
            case 'boss':
                this._genBoss(L, R, cfg, sampleRate);
                break;
            case 'boss-enraged':
                this._genBossEnraged(L, R, cfg, sampleRate);
                break;
            case 'victory':
                this._genVictory(L, R, cfg, sampleRate);
                break;
            default:
                this._genSimpleAmbient(L, R, cfg, sampleRate);
                break;
        }

        this._applyLoopSmoothing(L, R, sampleRate, 0.02);
        this._clampStereo(L, R);

        return buffer;
    }

    _clampStereo(L, R) {
        for (let i = 0; i < L.length; i++) {
            L[i] = clamp(L[i], -1, 1);
            R[i] = clamp(R[i], -1, 1);
        }
    }

    _applyLoopSmoothing(L, R, sampleRate, seconds) {
        const n = Math.floor(sampleRate * seconds);
        if (n <= 1 || n * 2 >= L.length) return;

        for (let i = 0; i < n; i++) {
            const t = i / n;
            const a = t;
            const b = 1 - t;

            const headIdx = i;
            const tailIdx = L.length - n + i;

            const headL = L[headIdx];
            const tailL = L[tailIdx];
            const headR = R[headIdx];
            const tailR = R[tailIdx];

            // crossfade: tail -> head
            const mixedL = tailL * b + headL * a;
            const mixedR = tailR * b + headR * a;

            L[headIdx] = mixedL;
            R[headIdx] = mixedR;
            L[tailIdx] = mixedL;
            R[tailIdx] = mixedR;
        }
    }

    _genSimpleAmbient(L, R, cfg, sampleRate) {
        const base = cfg.baseFreq ?? 55;
        const noise = cfg.noiseAmount ?? 0.05;

        for (let i = 0; i < L.length; i++) {
            const t = i / sampleRate;
            let s = 0;
            s += Math.sin(2 * Math.PI * base * t) * 0.10;
            s += Math.sin(2 * Math.PI * base * 2 * t) * 0.05;
            s += Math.sin(2 * Math.PI * base * 3 * t) * 0.03;
            s += (Math.random() * 2 - 1) * noise * 0.15;

            L[i] = s * 0.25;
            R[i] = s * 0.25;
        }
    }

    _genGlitchAmbient(L, R, cfg, sampleRate) {
        this._genSimpleAmbient(L, R, cfg, sampleRate);

        const length = L.length;
        const glitches = 6;
        for (let g = 0; g < glitches; g++) {
            const start = Math.floor(Math.random() * length);
            const span = Math.floor(sampleRate * 0.08);

            for (let i = 0; i < span && start + i < length; i++) {
                const idx = start + i;
                const env = Math.exp(-i / span * 5);
                const n = (Math.random() * 2 - 1) * 0.12 * env;
                L[idx] += n;
                R[idx] += n;
            }
        }
    }

    _genNature(L, R, cfg, sampleRate) {
        this._genSimpleAmbient(L, R, cfg, sampleRate);

        const chirps = 8;
        for (let c = 0; c < chirps; c++) {
            const start = Math.floor(Math.random() * L.length);
            const span = Math.floor(sampleRate * 0.18);
            const f = 1200 + Math.random() * 800;

            for (let i = 0; i < span && start + i < L.length; i++) {
                const t = i / sampleRate;
                const env = Math.exp(-t * 10);
                const s = Math.sin(2 * Math.PI * f * t) * env * 0.08;
                L[start + i] += s;
                R[start + i] += s;
            }
        }
    }

    _genCrystal(L, R, cfg, sampleRate) {
        const base = cfg.baseFreq ?? 82.41;
        const shimmer = cfg.shimmerFreqs ?? [523.25, 659.25, 783.99];

        for (let i = 0; i < L.length; i++) {
            const t = i / sampleRate;
            let s = 0;

            s += Math.sin(2 * Math.PI * base * t) * 0.08;

            shimmer.forEach((f, idx) => {
                const mod = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(2 * Math.PI * 0.35 * t + idx));
                s += Math.sin(2 * Math.PI * f * t) * 0.04 * mod;
            });

            L[i] = s * 0.35;
            R[i] = s * 0.35;
        }
    }

    _genIndustrial(L, R, cfg, sampleRate) {
        this._genSimpleAmbient(L, R, cfg, sampleRate);

        const hits = 12;
        for (let h = 0; h < hits; h++) {
            const start = Math.floor(Math.random() * L.length);
            const span = Math.floor(sampleRate * 0.04);

            for (let i = 0; i < span && start + i < L.length; i++) {
                const env = Math.exp(-i / span * 7);
                const s = (Math.random() * 2 - 1) * 0.18 * env;
                L[start + i] += s;
                R[start + i] += s;
            }
        }
    }

    _genCore(L, R, cfg, sampleRate) {
        const base = cfg.baseFreq ?? 40;
        const noise = cfg.noiseAmount ?? 0.2;

        for (let i = 0; i < L.length; i++) {
            const t = i / sampleRate;
            let s = 0;

            s += Math.sin(2 * Math.PI * base * t) * 0.14;
            s += Math.sin(2 * Math.PI * base * 1.5 * t + Math.sin(t * 3)) * 0.10;
            s += Math.sin(2 * Math.PI * base * 2.5 * t + Math.sin(t * 5)) * 0.08;
            s += (Math.random() * 2 - 1) * noise * 0.12;

            L[i] = s * 0.45;
            R[i] = s * 0.45;
        }
    }

    _genBoss(L, R, cfg, sampleRate) {
        const base = cfg.baseFreq ?? 55;
        const tempo = (cfg.tempo ?? 120) / 60;

        for (let i = 0; i < L.length; i++) {
            const t = i / sampleRate;
            let s = 0;

            s += Math.sin(2 * Math.PI * base * t) * 0.12;

            const beatPhase = (t * tempo * 4) % 1;
            const env = Math.exp(-beatPhase * 9);
            s += Math.sin(2 * Math.PI * base * 2 * t) * env * 0.14;

            s += Math.sin(2 * Math.PI * base * 3 * t) * 0.05;

            L[i] = s * 0.45;
            R[i] = s * 0.45;
        }
    }

    _genBossEnraged(L, R, cfg, sampleRate) {
        this._genBoss(L, R, cfg, sampleRate);

        const tempo = (cfg.tempo ?? 150) / 60;
        for (let i = 0; i < L.length; i++) {
            const t = i / sampleRate;
            const pulse = Math.sin(2 * Math.PI * tempo * 8 * t) * 0.08;
            L[i] += pulse;
            R[i] += pulse;

            const n = (Math.random() * 2 - 1) * 0.05;
            L[i] += n;
            R[i] += n;
        }
    }

    _genVictory(L, R, cfg, sampleRate) {
        const notes = cfg.shimmerFreqs ?? [523.25, 659.25, 783.99, 1046.5];

        for (let i = 0; i < L.length; i++) {
            const t = i / sampleRate;
            let s = 0;

            notes.forEach((f, idx) => {
                const start = idx * 0.35;
                if (t >= start && t < start + 0.45) {
                    const nt = t - start;
                    const env = Math.exp(-nt * 3);
                    s += Math.sin(2 * Math.PI * f * nt) * env * 0.18;
                }
            });

            L[i] = s;
            R[i] = s;
        }
    }

    cleanup() {
        this.stopMusic(0);

        if (typeof document !== 'undefined' && this._unlockHandlerBound) {
            document.removeEventListener('pointerdown', this._unlockHandlerBound);
            document.removeEventListener('touchstart', this._unlockHandlerBound);
            document.removeEventListener('keydown', this._unlockHandlerBound);
        }

        this.musicBufferCache.clear();
        this.noiseBuffer = null;

        if (this.audioContext && this.ownsContext) {
            this.audioContext.close().catch(() => undefined);
        }

        this.audioContext = null;
        this.masterGainNode = null;
        this.sfxGainNode = null;
        this.musicGainNode = null;
    }

    destroy() {
        this.cleanup();
    }
}
