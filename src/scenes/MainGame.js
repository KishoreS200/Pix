import Phaser from 'phaser';

export default class MainGame extends Phaser.Scene {
    constructor() {
        super('MainGame');
    }

    create() {
        this.add.text(400, 300, 'Pixel Realm - Ready for Development', {
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);
    }

    update() {
        // empty loop
    }
}
