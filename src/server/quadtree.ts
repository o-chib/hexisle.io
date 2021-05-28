import { Constant } from '../shared/constants';
import { CollisionObjectPool } from './CollisionObjectPool';

export class Quadtree {
	// The ratio of child to parent width. Higher numbers will push payload further down
	// into the tree. The resulting quadtree will require more node testing but less object
	// testing.
	private SPLIT: number;
	private MAX_DEPTH: number;
	private topLevelNode: QuadtreeNode;
	private topLevelNodeBox: Rect;
	private cObjPool: CollisionObjectPool;

	constructor() {
		this.SPLIT = Constant.QUADTREE.SPLIT; // originally(with overlapping) = 0.6;
		this.MAX_DEPTH = Constant.QUADTREE.MAX_DEPTH;
		this.topLevelNode = new QuadtreeNode();
		this.topLevelNodeBox = new Rect(
			0,
			Constant.MAP_WIDTH,
			Constant.MAP_HEIGHT,
			0
		);
		this.cObjPool = new CollisionObjectPool();
	}

	/**
	 * Checks whether two objects collide with eachother rectangularly
	 * @param obj the collision object to check against the box
	 * @param box the rectangular bounds of an object
	 * @returns boolean
	 */
	public collides(
		obj: CollisionObject,
		searchL: number,
		searchR: number,
		searchT: number,
		searchB: number
	): boolean {
		if (
			searchL <= obj.r &&
			obj.l <= searchR &&
			obj.b >= searchT &&
			searchB >= obj.t
		) {
			return true;
		} else {
			return false;
		}
	}

	/**
	 * interface into inserting an object into the quadtree
	 * @param obj the object we are inserting
	 * @param radius the radius of the object
	 */
	public insertIntoQuadtree(obj: any, radius: number): void {
		const pObj = this.cObjPool.getElement();
		pObj.setData(obj, radius);
		this.insert(
			this.topLevelNode,
			this.topLevelNodeBox.l,
			this.topLevelNodeBox.r,
			this.topLevelNodeBox.t,
			this.topLevelNodeBox.b,
			0,
			pObj
		);
	}

	/**
	 * interface into deleting an object from the quadtree
	 * @param obj the object we are deleting
	 * @param radius the radius of the object
	 */
	public deleteFromQuadtree(obj: any, radius: number): void {
		const pObj = this.cObjPool.getElement();
		pObj.setData(obj, radius);
		this.delete(
			this.topLevelNode,
			this.topLevelNodeBox.l,
			this.topLevelNodeBox.r,
			this.topLevelNodeBox.t,
			this.topLevelNodeBox.b,
			0,
			pObj
		);
		this.cObjPool.releaseElement(pObj);
	}

	/**
	 * interface into updating an object in the quadtree
	 * @param obj the object we are updating
	 * @param radius the radius of the object
	 */
	public updateInQuadtree(obj: any, radius: number): void {
		const pObj = this.cObjPool.getElement();
		pObj.setData(obj, radius);
		this.update(
			this.topLevelNode,
			this.topLevelNodeBox.l,
			this.topLevelNodeBox.r,
			this.topLevelNodeBox.t,
			this.topLevelNodeBox.b,
			0,
			pObj
		);
	}

	/**
	 * interface into searching for collisions for an object
	 * @param box the rectangular box of the object we are searching for
	 * @param results the list of collision objects we found that may collide
	 */
	public searchQuadtree(
		searchL: number,
		searchR: number,
		searchT: number,
		searchB: number,
		results: CollisionObject[]
	): void {
		this.search(
			this.topLevelNode,
			this.topLevelNodeBox.l,
			this.topLevelNodeBox.r,
			this.topLevelNodeBox.t,
			this.topLevelNodeBox.b,
			searchL,
			searchR,
			searchT,
			searchB,
			results
		);
	}

	/**
	 * Inserts an object into the quadtree at the first node possible
	 * @param node the collision node to search
	 * @param nodebox the rectangle bounds of this node
	 * @param depth the current depth into the quadtree
	 * @param pObj the pool object to insert
	 */
	private insert(
		node: QuadtreeNode,
		l: number,
		r: number,
		t: number,
		b: number,
		depth: number,
		pObj: CollisionObject
	): void {
		const splitLeft: number = l + this.SPLIT * (r - l);
		const splitRight: number = r - this.SPLIT * (r - l);
		const splitBottom: number = b + this.SPLIT * (t - b);
		const splitTop: number = t - this.SPLIT * (t - b);

		// if we're at our deepest level it must be in here
		if (depth > this.MAX_DEPTH) {
			node.collisionObjects.push(pObj);

			// contained within UPPER LEFT
		} else if (pObj.r < splitRight && pObj.b < splitTop) {
			if (!node.kids[0]) node.kids[0] = new QuadtreeNode();
			this.insert(
				node.kids[0],
				l,
				splitRight,
				splitBottom,
				t,
				depth + 1,
				pObj
			);

			// contained within UPPER RIGHT
		} else if (pObj.l > splitLeft && pObj.b < splitTop) {
			if (!node.kids[1]) node.kids[1] = new QuadtreeNode();
			this.insert(
				node.kids[1],
				splitLeft,
				r,
				splitBottom,
				t,
				depth + 1,
				pObj
			);

			// contained within LOWER LEFT
		} else if (pObj.r < splitRight && pObj.t > splitBottom) {
			if (!node.kids[2]) node.kids[2] = new QuadtreeNode();
			this.insert(
				node.kids[2],
				l,
				splitRight,
				b,
				splitTop,
				depth + 1,
				pObj
			);

			// contained within LOWER RIGHT
		} else if (pObj.l > splitLeft && pObj.t > splitBottom) {
			if (!node.kids[3]) node.kids[3] = new QuadtreeNode();
			this.insert(
				node.kids[3],
				splitLeft,
				r,
				b,
				splitTop,
				depth + 1,
				pObj
			);

			// object is not wholly contained in any child node
		} else {
			this.topLevelNode.collisionObjects.push(pObj);
		}
	}

	/**
	 * Deletes an object from the quadtree
	 * @param node the collision node to search
	 * @param nodebox the rectangle bounds of this node
	 * @param depth the current depth into the quadtree
	 * @param pObj the pool object to delete
	 */
	private delete(
		node: QuadtreeNode,
		l: number,
		r: number,
		t: number,
		b: number,
		depth: number,
		pObj: CollisionObject
	): void {
		const splitLeft: number = l + this.SPLIT * (r - l);
		const splitRight: number = r - this.SPLIT * (r - l);
		const splitBottom: number = b + this.SPLIT * (t - b);
		const splitTop: number = t - this.SPLIT * (t - b);

		// if we're at our deepest level it must be in here
		if (depth > this.MAX_DEPTH) {
			const index: number = node.collisionObjects.findIndex(
				(o) => o.payload.id === pObj.payload.id
			);
			const removedPObj = node.collisionObjects.splice(index, 1);
			removedPObj.forEach((element) => {
				this.cObjPool.releaseElement(element);
			});

			// contained within UPPER LEFT
		} else if (pObj.r < splitRight && pObj.b > splitTop) {
			if (!node.kids[0]) node.kids[0] = new QuadtreeNode();
			this.delete(
				node.kids[0],
				l,
				splitRight,
				splitBottom,
				t,
				depth + 1,
				pObj
			);

			// contained within UPPER RIGHT
		} else if (pObj.l > splitLeft && pObj.b > splitTop) {
			if (!node.kids[1]) node.kids[1] = new QuadtreeNode();
			this.delete(
				node.kids[1],
				splitLeft,
				r,
				splitBottom,
				t,
				depth + 1,
				pObj
			);

			// contained within LOWER LEFT
		} else if (pObj.r < splitRight && pObj.t < splitBottom) {
			if (!node.kids[2]) node.kids[2] = new QuadtreeNode();
			this.delete(
				node.kids[2],
				l,
				splitRight,
				b,
				splitTop,
				depth + 1,
				pObj
			);

			// contained within LOWER RIGHT
		} else if (pObj.l > splitLeft && pObj.t < splitBottom) {
			if (!node.kids[3]) node.kids[3] = new QuadtreeNode();
			this.delete(
				node.kids[3],
				splitLeft,
				r,
				b,
				splitTop,
				depth + 1,
				pObj
			);

			// object is not wholly contained in any child node
		} else {
			const index: number = this.topLevelNode.collisionObjects.findIndex(
				(o) => o.payload.id === pObj.payload.id
			);
			const removedPObj = this.topLevelNode.collisionObjects.splice(
				index,
				1
			);
			removedPObj.forEach((element) => {
				this.cObjPool.releaseElement(element);
			});
		}
	}

	/**
	 * Updates the position of a collision object currently in the quadtree
	 * @param node the top level node to start the search
	 * @param nodebox the top level nodebox
	 * @param depth 0, the very top depth level
	 * @param pObj the pool object to update in the quadtree
	 */
	private update(
		node: QuadtreeNode,
		l: number,
		r: number,
		t: number,
		b: number,
		depth: number,
		pObj: CollisionObject
	): void {
		this.delete(node, l, r, t, b, depth, pObj);
		this.insert(node, l, r, t, b, depth, pObj);
	}

	/**
	 * Searches the node and if it finds any collision objects in the deepest node, puts the collision objects in results
	 * @param node the collision node to search
	 * @param nodebox the rectangle bounds of this node
	 * @param box the rectangular box of the object we are searching for
	 * @param results the list of collision objects we found that may collide
	 */
	private search(
		node: QuadtreeNode,
		l: number,
		r: number,
		t: number,
		b: number,
		searchL: number,
		searchR: number,
		searchT: number,
		searchB: number,
		results: CollisionObject[]
	): void {
		const splitLeft: number = l + this.SPLIT * (r - l);
		const splitRight: number = r - this.SPLIT * (r - l);
		const splitBottom: number = l + this.SPLIT * (r - l);
		const splitTop: number = r - this.SPLIT * (r - l);

		// find all collision objects local to the current node and push them onto the results
		// if their rectangles overlap.
		node.collisionObjects
			.filter((pObj) =>
				this.collides(pObj, searchL, searchR, searchT, searchB)
			)
			.map((pObj) => {
				results.push(pObj);
			});

		// intersects UPPER LEFT
		if (searchL < splitRight && searchT < splitBottom && node.kids[0]) {
			this.search(
				node.kids[0],
				l,
				splitRight,
				splitBottom,
				t,
				searchL,
				searchR,
				searchT,
				searchB,
				results
			);

			// intersects UPPER RIGHT
		}
		if (searchR > splitLeft && searchT < splitBottom && node.kids[1]) {
			this.search(
				node.kids[1],
				splitLeft,
				r,
				splitBottom,
				t,
				searchL,
				searchR,
				searchT,
				searchB,
				results
			);

			// intersects LOWER LEFT
		}
		if (searchL < splitRight && searchB < splitTop && node.kids[2]) {
			this.search(
				node.kids[2],
				l,
				splitRight,
				b,
				splitTop,
				searchL,
				searchR,
				searchT,
				searchB,
				results
			);

			// intersects LOWER RIGHT
		}
		if (searchR > splitLeft && searchB < splitTop && node.kids[3]) {
			this.search(
				node.kids[3],
				splitLeft,
				r,
				b,
				splitTop,
				searchL,
				searchR,
				searchT,
				searchB,
				results
			);
		}
	}
}

export class Rect {
	public l: number;
	public r: number;
	public b: number;
	public t: number;

	constructor(l = 0, r = 0, b = 0, t = 0) {
		this.l = l;
		this.r = r;
		this.b = b;
		this.t = t;
	}

	public update(l: number, r: number, b: number, t: number): void {
		this.l = l;
		this.r = r;
		this.b = b;
		this.t = t;
	}

	public getCopy(): Rect {
		return new Rect(this.l, this.r, this.b, this.t);
	}
}

export class QuadtreeNode {
	public collisionObjects: CollisionObject[];
	public kids: QuadtreeNode[]; //ul,ur,ll,lr

	constructor() {
		this.collisionObjects = [];
		this.kids = [];
	}
}

export class CollisionObject extends Rect {
	public payload: any;

	constructor(l = 0, r = 0, b = 0, t = 0, payload = {}) {
		super(l, r, b, t);
		this.payload = payload;
	}

	/**
	 * Sets an existing collision object to represent a new object
	 * @param object the object to set this collisionObject to represent
	 */
	public setData(object: any, radius: number): void {
		this.l = object.xPos - radius;
		this.r = object.xPos + radius;
		this.b = object.yPos + radius;
		this.t = object.yPos - radius;
		this.payload = object;
	}
}
