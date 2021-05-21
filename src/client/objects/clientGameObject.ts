import { IPoolObject } from '../iPoolObject';

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

	public abstract update(objectState: any): void;

	public init(objLiteral: any): void {
		this.setAlive(true);
	}

	public die(): void {
		this.setAlive(false);
	}

	protected setAlive(status: boolean) {
		this.setActive(status);
		this.setVisible(status);
	}
}
