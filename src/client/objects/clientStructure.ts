import { ClientGameObject } from './clientGameObject';

export abstract class ClientStructure extends ClientGameObject {
	public init(newLiteral: any) {
		this.setAlive(true);
		this.setPosition(newLiteral.xPos, newLiteral.yPos);
		if (this.create) this.create(newLiteral);
	}

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
