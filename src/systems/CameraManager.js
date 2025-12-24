import Phaser from 'phaser';

const DEFAULT_LERP = 0.15;

const normalizeBounds = (bounds) => {
    if (!bounds) {
        return {
            minX: 0,
            minY: 0,
            maxX: 0,
            maxY: 0,
            width: 0,
            height: 0
        };
    }

    if (typeof bounds.width === 'number' && typeof bounds.height === 'number') {
        const minX = bounds.minX ?? 0;
        const minY = bounds.minY ?? 0;

        return {
            minX,
            minY,
            maxX: minX + bounds.width,
            maxY: minY + bounds.height,
            width: bounds.width,
            height: bounds.height
        };
    }

    const minX = bounds.minX ?? 0;
    const minY = bounds.minY ?? 0;
    const maxX = bounds.maxX ?? minX;
    const maxY = bounds.maxY ?? minY;

    return {
        minX,
        minY,
        maxX,
        maxY,
        width: maxX - minX,
        height: maxY - minY
    };
};

export default class CameraManager {
    constructor() {
        this.scene = null;
        this.camera = null;

        this.player = null;

        this.currentRegion = null;
        this.bounds = normalizeBounds(null);

        this.lerpFactor = DEFAULT_LERP;
        this.offset = new Phaser.Math.Vector2(0, 0);

        this.deadZone = null;

        this.isTransitioning = false;

        this.shakeDuration = 0;
        this.shakeTimeLeft = 0;
        this.shakeIntensity = 0;
        this._shakeOffset = new Phaser.Math.Vector2(0, 0);
    }

    init(scene, player, regionBounds, options = {}) {
        this.scene = scene;
        this.camera = scene.cameras.main;
        this.player = player;

        this.lerpFactor = options.lerpFactor ?? DEFAULT_LERP;
        this.offset.set(options.offsetX ?? 0, options.offsetY ?? 0);

        if (options.deadZone) {
            this.deadZone = {
                width: options.deadZone.width,
                height: options.deadZone.height
            };
        }

        if (options.roundPixels !== undefined) {
            this.camera.roundPixels = options.roundPixels;
        }

        this.setRegion(options.regionName ?? 'Unknown', regionBounds);

        const { scrollX, scrollY } = this._getDesiredCameraScroll();
        const clamped = this._clampScroll(scrollX, scrollY);
        this.camera.setScroll(clamped.scrollX, clamped.scrollY);
    }

    setRegion(regionName, bounds) {
        this.currentRegion = regionName;
        this.bounds = normalizeBounds(bounds.bounds ? bounds.bounds : bounds);

        if (this.camera) {
            this.camera.setBounds(this.bounds.minX, this.bounds.minY, this.bounds.width, this.bounds.height);
        }

        if (this.scene?.physics?.world) {
            this.scene.physics.world.setBounds(this.bounds.minX, this.bounds.minY, this.bounds.width, this.bounds.height);
        }

        if (this.scene?.events) {
            this.scene.events.emit('regionchanged', this.currentRegion, this.bounds);
        }
    }

    update(_time, delta = 16.6667) {
        if (!this.camera || !this.player || this.isTransitioning) return;

        const effectiveLerp = 1 - Math.pow(1 - this.lerpFactor, delta / 16.6667);

        const { scrollX: desiredScrollX, scrollY: desiredScrollY } = this._getDesiredCameraScroll();
        const desiredClamped = this._clampScroll(desiredScrollX, desiredScrollY);

        let nextScrollX = Phaser.Math.Linear(this.camera.scrollX, desiredClamped.scrollX, effectiveLerp);
        let nextScrollY = Phaser.Math.Linear(this.camera.scrollY, desiredClamped.scrollY, effectiveLerp);

        this._updateShake(delta);

        nextScrollX += this._shakeOffset.x;
        nextScrollY += this._shakeOffset.y;

        const finalClamped = this._clampScroll(nextScrollX, nextScrollY);
        this.camera.setScroll(finalClamped.scrollX, finalClamped.scrollY);
    }

    shake(intensity = 5, duration = 200) {
        this.shakeIntensity = intensity;
        this.shakeDuration = duration;
        this.shakeTimeLeft = duration;
    }

    transitionToRegion(newRegion, newBounds, duration = 500) {
        if (!this.scene || !this.camera || !this.player) return Promise.resolve();
        if (this.isTransitioning) return Promise.resolve();

        this.isTransitioning = true;

        const half = Math.max(1, Math.floor(duration / 2));

        const targetSpawn = newBounds?.spawn;

        return new Promise((resolve) => {
            let fadeInComplete = false;
            let tweenComplete = false;

            const finish = () => {
                if (!fadeInComplete || !tweenComplete) return;
                this.isTransitioning = false;
                resolve();
            };

            this.camera.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                this.setRegion(newRegion, newBounds);

                if (targetSpawn) {
                    this.player.setPosition(targetSpawn.x, targetSpawn.y);
                    if (this.player.body) {
                        this.player.body.reset(targetSpawn.x, targetSpawn.y);
                    }
                }

                const start = this._clampScroll(this.camera.scrollX, this.camera.scrollY);
                const desiredScroll = this._getDesiredCameraScroll();
                const desired = this._clampScroll(desiredScroll.scrollX, desiredScroll.scrollY);

                this.camera.setScroll(start.scrollX, start.scrollY);

                this.scene.tweens.add({
                    targets: this.camera,
                    scrollX: desired.scrollX,
                    scrollY: desired.scrollY,
                    ease: 'Sine.easeInOut',
                    duration: half,
                    onComplete: () => {
                        tweenComplete = true;
                        finish();
                    }
                });

                this.camera.fadeIn(half, 0, 0, 0);
            });

            this.camera.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, () => {
                fadeInComplete = true;
                finish();
            });

            this.camera.fadeOut(half, 0, 0, 0);
        });
    }

    _getDesiredCameraScroll() {
        const viewWidth = this.camera.width / this.camera.zoom;
        const viewHeight = this.camera.height / this.camera.zoom;

        const idealPlayerScreenX = viewWidth / 2 - this.offset.x;
        const idealPlayerScreenY = viewHeight / 2 - this.offset.y;

        if (!this.deadZone) {
            return {
                scrollX: this.player.x - idealPlayerScreenX,
                scrollY: this.player.y - idealPlayerScreenY
            };
        }

        const dzLeft = idealPlayerScreenX - this.deadZone.width / 2;
        const dzRight = idealPlayerScreenX + this.deadZone.width / 2;
        const dzTop = idealPlayerScreenY - this.deadZone.height / 2;
        const dzBottom = idealPlayerScreenY + this.deadZone.height / 2;

        let desiredScrollX = this.camera.scrollX;
        let desiredScrollY = this.camera.scrollY;

        const playerScreenX = this.player.x - this.camera.scrollX;
        const playerScreenY = this.player.y - this.camera.scrollY;

        if (playerScreenX < dzLeft) {
            desiredScrollX = this.player.x - dzLeft;
        } else if (playerScreenX > dzRight) {
            desiredScrollX = this.player.x - dzRight;
        }

        if (playerScreenY < dzTop) {
            desiredScrollY = this.player.y - dzTop;
        } else if (playerScreenY > dzBottom) {
            desiredScrollY = this.player.y - dzBottom;
        }

        return {
            scrollX: desiredScrollX,
            scrollY: desiredScrollY
        };
    }

    _clampScroll(scrollX, scrollY) {
        const viewWidth = this.camera.width / this.camera.zoom;
        const viewHeight = this.camera.height / this.camera.zoom;

        const minCamX = this.bounds.minX;
        const maxCamX = Math.max(minCamX, this.bounds.maxX - viewWidth);
        const minCamY = this.bounds.minY;
        const maxCamY = Math.max(minCamY, this.bounds.maxY - viewHeight);

        return {
            scrollX: Phaser.Math.Clamp(scrollX, minCamX, maxCamX),
            scrollY: Phaser.Math.Clamp(scrollY, minCamY, maxCamY)
        };
    }

    _updateShake(delta) {
        if (this.shakeTimeLeft <= 0) {
            this._shakeOffset.set(0, 0);
            return;
        }

        this.shakeTimeLeft -= delta;

        const t = Phaser.Math.Clamp(this.shakeTimeLeft / this.shakeDuration, 0, 1);
        const currentIntensity = this.shakeIntensity * t;

        this._shakeOffset.set(
            Phaser.Math.FloatBetween(-currentIntensity, currentIntensity),
            Phaser.Math.FloatBetween(-currentIntensity, currentIntensity)
        );

        if (this.shakeTimeLeft <= 0) {
            this._shakeOffset.set(0, 0);
        }
    }
}
