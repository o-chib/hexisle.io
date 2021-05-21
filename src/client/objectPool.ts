import { IPoolObject } from './iPoolObject';

export default class ObjectPool {
	private scene: Phaser.Scene;
	private objConstructor: new (scene: Phaser.Scene) => IPoolObject;

	private activeObj: Map<string, IPoolObject>;
	private activeCount: number;

	private reserveObj: Array<IPoolObject>;
	private reserveCount: number;

	private currentDirtyBit = false;

	constructor(
		scene: Phaser.Scene,
		type: new (scene: Phaser.Scene) => IPoolObject,
		initPoolSize: number
	) {
		this.scene = scene;
		this.objConstructor = type;

		this.activeCount = 0;
		this.activeObj = new Map<string, IPoolObject>();

		this.reserveCount = 0;
		this.reserveObj = new Array<IPoolObject>();

		for (let i = 0; i < initPoolSize; i++) this.increaseReserveSize();
	}

	private increaseReserveSize(): void {
		const newObj = new this.objConstructor(this.scene);
		this.reserveCount++;
		this.reserveObj.push(newObj);
		newObj.die();
	}

	public get(id: string, state: any): IPoolObject {
		if (this.activeObj.has(id)) {
			const obj = this.activeObj.get(id)!;
			obj.dirtyBit = this.currentDirtyBit;
			return obj;
		}

		if (this.reserveCount == 0) this.increaseReserveSize();

		const newObj = this.reserveObj.pop()!;
		this.reserveCount--;

		this.activeObj.set(id, newObj);
		this.activeCount++;
		newObj.init(state);
		newObj.dirtyBit = this.currentDirtyBit;

		return newObj;
	}

	public remove(id: string): void {
		if (!this.activeObj.has(id)) throw new Error('Object not in pool');

		const deadObj = this.activeObj.get(id)!;
		deadObj.die();
		this.activeObj.delete(id);
		this.activeCount--;

		this.reserveObj.push(deadObj);
		this.reserveCount++;
	}

	public clean(): void {
		this.activeObj.forEach((obj: IPoolObject, key: string) => {
			if (obj.dirtyBit != this.currentDirtyBit) this.remove(key);
		});

		this.currentDirtyBit = !this.currentDirtyBit;
	}
}
