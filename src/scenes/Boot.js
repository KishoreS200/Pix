import Phaser from 'phaser';

export default class Boot extends Phaser.Scene {
    constructor() {
        super('Boot');
    }

    create() {
        console.log('Boot scene started');
        this.scene.start('Preload');
    }
}
