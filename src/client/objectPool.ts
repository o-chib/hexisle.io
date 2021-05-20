import { ClientGameObject } from './clientGameObject';

export default class ObjectPool<ObjType extends ClientGameObject> {
	private scene: Phaser.Scene;
	private objConstructor: new (
		scene: Phaser.Scene,
		x?: number,
		y?: number,
		texture?: string | Phaser.Textures.Texture,
		frame?: string | number | undefined
	) => ObjType;

	private activeObj: Map<string, ObjType>;
	private activeCount: number;

	private reserveObj: Array<ObjType>;
	private reserveCount: number;

	constructor(
		scene: Phaser.Scene,
		type: new () => ObjType,
		initPoolSize: number
	) {
		this.scene = scene;
		this.objConstructor = type;

		this.activeCount = 0;
		this.activeObj = new Map<string, ObjType>();

		this.reserveCount = 0;
		this.reserveObj = new Array<ObjType>();

		for (let i = 0; i < initPoolSize; i++) this.increaseReserveSize();
	}

	private increaseReserveSize(): void {
		const newObj = new this.objConstructor(this.scene);
		this.reserveCount++;
		this.reserveObj.push(newObj);
		newObj.setActive(false);
		newObj.setVisible(false);
	}

	public get(id: string): ClientGameObject {
		if (this.activeObj.has(id)) return this.activeObj.get(id)!;

		if (this.reserveCount == 0) this.increaseReserveSize();

		const newObj = this.reserveObj.pop()!;
		this.reserveCount--;

		this.activeObj.set(id, newObj);
		this.activeCount++;

		return newObj;
	}

	public remove(id: string): void {
		if (this.activeObj.has(id)) throw new Error('Object not in pool');

		const deadObj = this.activeObj.get(id)!;
		deadObj.setActive(false);
		deadObj.setVisible(false);
		this.activeObj.delete(id);
		this.activeCount--;

		this.reserveObj.push(deadObj);
		this.reserveCount++;
	}
}
