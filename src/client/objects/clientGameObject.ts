export abstract class ClientGameObject extends Phaser.GameObjects.Sprite {
	public dirtyBit: boolean;

	constructor(
		scene: Phaser.Scene,
		x = 0,
		y = 0,
		texture: string | Phaser.Textures.Texture = '',
		frame?: string | number | undefined
	) {
		super(scene, x, y, texture, frame);
		scene.add.existing(this);
	}

	public abstract update(objectState: any);

	protected handleDamageAnimation(
		structureTextureName: string,
		healthPercent: number
	): void {
		// Every structure (Wall/Turret/Base) has 4 states or frames.
		// Create local animation and load by playing and pausing the animation.
		// Sets the required frame based on health %

		if (!this.anims.get(structureTextureName + '_destroying')) {
			this.anims.create({
				key: structureTextureName + '_destroying',
				frames: this.anims.generateFrameNames(structureTextureName),
				frameRate: 1,
				repeat: -1,
			});

			// Update anims internal isPlaying/isPaused variables, and loaded anim.
			this.anims.play(structureTextureName + '_destroying');
			this.anims.pause();
		} else if (this.anims.exists(structureTextureName + '_destroying')) {
			this.anims.play(structureTextureName + '_destroying');
			this.anims.pause();
		}

		// Use overall player health to continue animation
		if (healthPercent >= 0.75) {
			this.anims.setProgress(0);
		} else if (healthPercent >= 0.5) {
			this.anims.setProgress(1 / 3);
		} else if (healthPercent >= 0.25) {
			this.anims.setProgress(2 / 3);
		} else if (healthPercent > 0.0) {
			this.anims.setProgress(1);
		}
	}
}
