import { MusicKeys } from '../utils/MusicConfig';

export default class Boss {
    constructor(scene, x, y) {
        this.scene = scene;
        this.x = x;
        this.y = y;

        this.phase = 1;
        this.isAlive = true;

        this.startEncounter();
    }

    startEncounter() {
        if (this.scene?.audioManager) {
            this.scene.audioManager.playMusic(MusicKeys.BOSS_NORMAL, true, 500);
        }
    }

    enterPhase(phase) {
        if (!this.isAlive) return;

        this.phase = phase;

        if (this.scene?.audioManager) {
            this.scene.audioManager.playSound('boss-phase');

            if (phase >= 2) {
                this.scene.audioManager.playMusic(MusicKeys.BOSS_ENRAGED, true, 500);
            }
        }
    }

    die() {
        if (!this.isAlive) return;
        this.isAlive = false;

        if (this.scene?.audioManager) {
            this.scene.audioManager.playSound('death');
            this.scene.audioManager.playSound('boss-defeated');
            this.scene.audioManager.playMusic(MusicKeys.BOSS_DEFEATED, false, 500);
        }
    }
}
