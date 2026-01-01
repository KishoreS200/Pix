import Phaser from 'phaser';

export default class InputManager {
    constructor(scene) {
        this.scene = scene;
        this.keys = scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            upArrow: Phaser.Input.Keyboard.KeyCodes.UP,
            downArrow: Phaser.Input.Keyboard.KeyCodes.DOWN,
            leftArrow: Phaser.Input.Keyboard.KeyCodes.LEFT,
            rightArrow: Phaser.Input.Keyboard.KeyCodes.RIGHT,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            interact: Phaser.Input.Keyboard.KeyCodes.E
        });
    }

    getMovementVector() {
        let x = 0;
        let y = 0;

        if (this.keys.left.isDown || this.keys.leftArrow.isDown) {
            x -= 1;
        }
        if (this.keys.right.isDown || this.keys.rightArrow.isDown) {
            x += 1;
        }
        if (this.keys.up.isDown || this.keys.upArrow.isDown) {
            y -= 1;
        }
        if (this.keys.down.isDown || this.keys.downArrow.isDown) {
            y += 1;
        }

        const vector = new Phaser.Math.Vector2(x, y);
        if (vector.length() > 0) {
            vector.normalize();
        }
        return vector;
    }

    isAttackJustPressed() {
        return Phaser.Input.Keyboard.JustDown(this.keys.space);
    }
    
    isInteractJustPressed() {
        return Phaser.Input.Keyboard.JustDown(this.keys.interact);
    }
}
