import { Regions } from './RegionConfig';

export const MusicKeys = Object.freeze({
    // Region Themes
    SILENT_VILLAGE: 'music-silent-village',
    FORGOTTEN_FOREST: 'music-forgotten-forest',
    CRYSTAL_MINES: 'music-crystal-mines',
    BROKEN_CITY: 'music-broken-city',
    THE_CORE: 'music-the-core',

    // Boss Themes
    BOSS_NORMAL: 'music-boss-normal',
    BOSS_ENRAGED: 'music-boss-enraged',
    BOSS_DEFEATED: 'music-boss-defeated'
});

export const RegionMusicMap = Object.freeze({
    [Regions.SILENT_VILLAGE]: MusicKeys.SILENT_VILLAGE,
    [Regions.FORGOTTEN_FOREST]: MusicKeys.FORGOTTEN_FOREST,
    [Regions.CRYSTAL_MINES]: MusicKeys.CRYSTAL_MINES,
    [Regions.BROKEN_CITY]: MusicKeys.BROKEN_CITY,
    [Regions.THE_CORE]: MusicKeys.THE_CORE
});

// Procedural music definitions. These are used to generate loopable AudioBuffers.
// The generator in AudioManager uses these parameters to build a themed loop.
export const MusicConfig = {
    [MusicKeys.SILENT_VILLAGE]: {
        theme: 'glitch-ambient',
        baseFreq: 55,
        shimmerFreqs: [220, 330, 440],
        noiseAmount: 0.15,
        tempo: 50,
        lengthSeconds: 12
    },
    [MusicKeys.FORGOTTEN_FOREST]: {
        theme: 'nature',
        baseFreq: 65,
        shimmerFreqs: [196, 247, 294],
        noiseAmount: 0.05,
        tempo: 70,
        lengthSeconds: 12
    },
    [MusicKeys.CRYSTAL_MINES]: {
        theme: 'crystal',
        baseFreq: 82.41,
        shimmerFreqs: [523.25, 659.25, 783.99],
        noiseAmount: 0.03,
        tempo: 80,
        lengthSeconds: 10
    },
    [MusicKeys.BROKEN_CITY]: {
        theme: 'industrial',
        baseFreq: 49,
        shimmerFreqs: [110, 165, 220],
        noiseAmount: 0.12,
        tempo: 90,
        lengthSeconds: 10
    },
    [MusicKeys.THE_CORE]: {
        theme: 'core',
        baseFreq: 40,
        shimmerFreqs: [164.81, 246.94, 329.63, 493.88],
        noiseAmount: 0.2,
        tempo: 110,
        lengthSeconds: 8
    },

    [MusicKeys.BOSS_NORMAL]: {
        theme: 'boss',
        baseFreq: 55,
        shimmerFreqs: [110, 146.83, 220],
        noiseAmount: 0.1,
        tempo: 120,
        lengthSeconds: 8
    },
    [MusicKeys.BOSS_ENRAGED]: {
        theme: 'boss-enraged',
        baseFreq: 55,
        shimmerFreqs: [146.83, 220, 293.66],
        noiseAmount: 0.14,
        tempo: 150,
        lengthSeconds: 8
    },
    [MusicKeys.BOSS_DEFEATED]: {
        theme: 'victory',
        baseFreq: 110,
        shimmerFreqs: [523.25, 659.25, 783.99, 1046.5],
        noiseAmount: 0.0,
        tempo: 90,
        lengthSeconds: 6
    }
};
