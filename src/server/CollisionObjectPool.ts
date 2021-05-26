import { CollisionObject } from './quadtree';

export class CollisionObjectPool {
	private increase_percent: number;
	private minimum_percent_free: number;
	private poolArray: Array<PoolCollisionObject>;
	private poolSize: number;
	private freeElements: number;

	constructor(initialSize = 1000) {
		this.increase_percent = 0.5;
		this.minimum_percent_free = 0.1;
		this.poolArray = new Array<PoolCollisionObject>(initialSize);
		for (let i = 0; i < this.poolArray.length; i++) {
			this.poolArray[i] = new PoolCollisionObject();
		}
		this.poolSize = initialSize;
		this.freeElements = initialSize;
	}

	/**
	 * Gets a pool collision object or creates a new one if none are free
	 * @returns a fresh pool collision object
	 */
	public getElement(): PoolCollisionObject {
		if (
			this.freeElements / this.poolArray.length <=
			this.minimum_percent_free
		) {
			this.increasePoolSize();
		}

		for (let i = 0; i < this.poolArray.length; i++) {
			if (this.poolArray[i].free) {
				this.poolArray[i].free = false;
				this.freeElements--;
				return this.poolArray[i];
			}
		}

		throw Error('Object pool getElement failure');
	}

	/**
	 * Frees and resets the data in a pool collision object so it can be reused
	 * @param element the element to free and reset
	 */
	public releaseElement(element: PoolCollisionObject): void {
		element.free = true;
		element.data.resetData();
		this.freeElements++;
	}

	/**
	 * Creates a new pool collision object
	 */
	private createElement(): void {
		this.freeElements++;
		this.poolArray.push(new PoolCollisionObject());
	}

	/**
	 * Increases the pool size by a set increase_percent
	 */
	private increasePoolSize() {
		const increaseSize = Math.round(
			this.increase_percent * this.poolArray.length
		);
		for (let i = 0; i < increaseSize; i++) {
			this.createElement();
		}
		this.poolSize += increaseSize;
		console.log('increasing pool size, new pool size:', this.poolSize);
	}
}

export class PoolCollisionObject {
	public free: boolean;
	public data: CollisionObject;

	constructor() {
		this.free = true;
		this.data = new CollisionObject();
	}
}
