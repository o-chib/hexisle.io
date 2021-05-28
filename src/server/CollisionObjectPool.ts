import { CollisionObject } from './quadtree';

export class CollisionObjectPool {
	private increase_percent: number;
	private poolArray: Array<CollisionObject>;
	private poolSize: number;
	private activeElements: number;

	constructor(initialSize = 100) {
		this.increase_percent = 0.5;
		this.poolArray = new Array<CollisionObject>(initialSize);
		for (let i = 0; i < this.poolArray.length; i++) {
			this.poolArray[i] = new CollisionObject();
		}
		this.poolSize = initialSize;
		this.activeElements = 0;
	}

	/**
	 * Gets a pool collision object or creates a new one if none are free
	 * @returns a fresh pool collision object
	 */
	public getElement(): CollisionObject {
		if (this.poolArray.length == 0) this.increasePoolSize();
		this.activeElements++;
		return this.poolArray.pop()!;
	}

	/**
	 * Frees and resets the data in a pool collision object so it can be reused
	 * @param element the element to free and reset
	 */
	public releaseElement(element: CollisionObject): void {
		this.poolArray.push(element);
		this.activeElements--;
	}

	/**
	 * Creates a new pool collision object
	 */
	private createElement(): void {
		this.poolArray.push(new CollisionObject());
	}

	/**
	 * Increases the pool size by a set increase_percent
	 */
	private increasePoolSize() {
		const increaseSize = Math.round(
			this.increase_percent * this.activeElements
		);
		for (let i = 0; i < increaseSize; i++) {
			this.createElement();
		}
		this.poolSize += increaseSize;
		console.log('increasing pool size, new pool size:', this.poolSize);
	}
}
