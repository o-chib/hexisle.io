export class ClientGameObject extends Phaser.GameObjects.Sprite {
	constructor(
		scene: Phaser.Scene,
		x: number,
		y: number,
		texture: string | Phaser.Textures.Texture,
		frame?: string | number | undefined
	) {
		super(scene, x, y, texture, frame);
		scene.add.existing(this);
	}
}
