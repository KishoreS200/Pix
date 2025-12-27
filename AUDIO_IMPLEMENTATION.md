# Phase 11: Audio System Implementation

## Overview
A complete procedural audio system has been implemented using Web Audio API for all sound effects and background music. No external audio files are required.

## Implemented Components

### 1. Core Systems

#### AudioManager (`src/systems/AudioManager.js`)
- **Singleton Pattern**: Shared across scenes via `getInstance()`
- **Procedural Generation**: All sounds generated via Web Audio API
- **Volume Controls**: Master, SFX, Music (0-100 scale)
- **Mute Toggle**: Global mute functionality
- **Settings Persistence**: Saves to localStorage
- **Mobile Compatibility**: iOS audio context suspension handling
- **Music System**: Fade in/out, looping, LRU cache
- **Performance**: Efficient buffer management

### 2. Sound Effects

#### Combat Sounds
- `attack-swing`: Player attack swing (sweep down)
- `attack-hit`: Impact on enemy hit
- `enemy-hit`: Enemy pain sound
- `knockback`: Knockback impact
- `player-hurt`: Player damage sound
- `death`: Entity death sound

#### Loot Sounds
- `coin-pickup`: Coin collection arpeggio (C-E-G)
- `potion-pickup`: Potion collection chord
- `powerup-pickup`: Power-up sweep up
- `boss-loot`: Epic loot fanfare (planned for boss system)

#### UI Sounds
- `level-up`: Level up arpeggio (C-E-G-C)
- `boss-phase`: Boss phase change alarm (planned)
- `boss-defeated`: Victory fanfare (planned)
- `game-over`: Game over sweep down
- `menu-select`: Menu selection beep (planned)
- `menu-confirm`: Menu confirmation bell (planned)

### 3. Background Music

#### Region Themes (Procedurally Generated)
- **Silent Village**: Glitch ambient with noise bursts
- **Forgotten Forest**: Nature theme with bird chirps
- **Crystal Mines**: Crystalline shimmering tones
- **Broken City**: Industrial ambient with metallic clangs
- **The Core**: Chaotic core theme with heavy noise

#### Boss Themes (Ready for Boss System)
- **Boss Normal**: Driving bass with rhythmic pulse
- **Boss Enraged**: Faster, more aggressive version
- **Boss Defeated**: Victory melody

### 4. Integration Points

#### MainGame.js
- Initializes AudioManager on scene create
- Plays region music based on current region
- Handles region transitions with fade out/in (500ms)
- Stops music on scene shutdown
- Handles game over audio

#### CombatManager.js
- Plays `attack-swing` on hitbox creation
- Plays `attack-hit` and `enemy-hit` on successful hit
- Plays `knockback` on knockback application

#### Player.js
- Plays `player-hurt` when taking damage
- Death handled by game over system

#### Enemy.js
- Plays `death` sound on enemy death

#### ProgressionManager.js
- Plays `level-up` sound on level up

#### MainGame Event Listeners
- Coin collection → `coin-pickup`
- Potion collection → `potion-pickup`
- Power-up collection → `powerup-pickup`
- Player death → `game-over` + stop music

## Sound Generation Techniques

### Procedural Methods
1. **Tone**: Simple sine wave oscillator
2. **Sweep**: Frequency sweep (exponential ramp)
3. **Chord**: Multiple simultaneous oscillators
4. **Arpeggio**: Sequential notes with envelope
5. **Fanfare**: Square wave sequential notes
6. **Impact**: Triangle wave with noise burst
7. **Alarm**: Square wave with LFO modulation

### ADSR Envelopes
All sounds use configurable Attack-Decay-Sustain-Release envelopes for natural sound shaping.

### Music Generation
- Base frequency drones
- Harmonic overtones
- Modulated shimmer frequencies
- Tempo-based rhythmic elements
- Noise layers for texture
- Loop smoothing (crossfade at boundaries)

## Usage

### Playing Sounds
```javascript
// Basic usage
this.scene.audioManager.playSound('attack-swing');

// With volume multiplier (0-100 or 0-1)
this.scene.audioManager.playSound('coin-pickup', 50);
```

### Playing Music
```javascript
// Play region music
const musicKey = RegionMusicMap[regionName];
this.audioManager.playMusic(musicKey, true, 500);

// Stop music
this.audioManager.stopMusic(500);
```

### Volume Controls
```javascript
// Set volumes (0-100)
this.audioManager.setVolume('master', 80);
this.audioManager.setVolume('sfx', 70);
this.audioManager.setVolume('music', 50);

// Toggle mute
const isMuted = this.audioManager.toggleMute();
```

## Performance Characteristics

- **Memory**: Music buffers cached (max 4), LRU eviction
- **CPU**: Sounds generated on-demand, minimal overhead
- **No Network**: All audio procedurally generated
- **File Size**: Zero audio asset bytes

## Browser Compatibility

- ✅ Chrome/Edge (desktop & mobile)
- ✅ Firefox (desktop & mobile)
- ✅ Safari (desktop & mobile)
- ✅ iOS Safari (with user interaction unlock)
- ✅ Web Audio API support detection
- ✅ Graceful degradation if unavailable

## Settings Persistence

Settings are saved to localStorage:
- `audio_master_volume`: 0-100
- `audio_sfx_volume`: 0-100
- `audio_music_volume`: 0-100
- `audio_muted`: true/false

## Future Enhancements (Phase 12+)

- Audio settings menu UI
- Boss music system integration
- Per-region ambient sounds
- Spatial audio positioning
- Dynamic music intensity based on combat
- Custom sound profiles

## Technical Notes

### iOS Audio Context Suspension
The AudioManager handles iOS's audio context suspension policy by:
1. Resuming context on user interaction
2. Unlocking Phaser's sound system if needed
3. Removing listeners after first unlock

### Phaser Integration
The AudioManager can use Phaser's audio context if available, or create its own. This ensures compatibility with Phaser's sound system while providing advanced Web Audio API features.

### LRU Cache
Music buffers use an LRU (Least Recently Used) cache to limit memory usage. When the cache exceeds 4 entries, the oldest unused buffer is evicted.

## Testing Checklist

- [x] Sound effects play on combat actions
- [x] Loot pickup sounds play correctly
- [x] Level up sound plays
- [x] Region music plays on scene start
- [x] Music transitions on region change
- [x] Music stops on game over
- [x] Volume controls work
- [x] Settings persist across sessions
- [x] Mobile audio unlock works
- [x] No audio distortion or clipping
- [x] Graceful degradation if Web Audio unavailable

## Configuration Files

- `src/utils/SoundConfig.js`: All sound effect definitions
- `src/utils/MusicConfig.js`: All music track definitions
- `src/systems/AudioManager.js`: Core audio system

## Sound Design Philosophy

All sounds follow the glitch/corruption theme:
- **Combat**: Sharp, punchy, immediate feedback
- **Loot**: Pleasant, rewarding chimes
- **UI**: Clear, distinct tones
- **Music**: Atmospheric, region-appropriate, looping
- **Boss**: Intense, dramatic, memorable

Volumes are balanced so music never overpowers sound effects, and critical gameplay sounds are always audible.
