import { Constant } from '../../shared/constants';
import { IPoolObject } from '../iPoolObject';
import MainScene from '../scenes/mainScene';

export abstract class ClientGameObject
	extends Phaser.GameObjects.Sprite
	implements IPoolObject
{
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

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public init(objLiteral: any): void {
		this.setAlive(true);
		this.setPosition(objLiteral.xPos, objLiteral.yPos);
		if (this.create) this.create(objLiteral);
	}

	public die(): void {
		this.setAlive(false);
	}

	protected setAlive(status: boolean) {
		this.setActive(status);
		this.setVisible(status);
	}

	protected getVolume(): number {
		const mainSceneObj = this.scene as MainScene;
		const mainPlayerPosition = mainSceneObj.myPlayer.getPosition();
		const distance = Phaser.Math.Distance.Between(
			this.x,
			this.y,
			mainPlayerPosition.x,
			mainPlayerPosition.y
		);
		let ratio = distance / Constant.RADIUS.VIEW;
		ratio = Phaser.Math.Clamp(ratio, 0, 1);
		return 1 - ratio;
	}
}

export interface ClientGameObject {
	// Optional function that will run additional operations after initializing the object
	create?(objLiteral: any): void;
}
