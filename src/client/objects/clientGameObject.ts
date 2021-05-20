export abstract class ClientGameObject
	extends Phaser.GameObjects.Sprite
	implements IPoolObject {
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
}
