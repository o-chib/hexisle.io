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
	private searchSubbox: Rect;
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
		this.searchSubbox = new Rect();
		this.cObjPool = new CollisionObjectPool();
	}

	/**
	 * Checks whether two objects collide with eachother rectangularly
	 * @param obj the collision object to check against the box
	 * @param box the rectangular bounds of an object
	 * @returns boolean
	 */
	public collides(obj: CollisionObject, box: Rect): boolean {
		if (
			box.l <= obj.r &&
			obj.l <= box.r &&
			obj.b >= box.t &&
			box.b >= obj.t
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
		// console.log("inserting obj:", obj);
		const pObj = this.cObjPool.getElement();
		pObj.setData(obj, radius);
		this.insert(this.topLevelNode, this.topLevelNodeBox.getCopy(), 0, pObj);
	}

	/**
	 * interface into deleting an object from the quadtree
	 * @param obj the object we are deleting
	 * @param radius the radius of the object
	 */
	public deleteFromQuadtree(obj: any, radius: number): void {
		// console.log("deleting obj:", obj);
		const pObj = this.cObjPool.getElement();
		pObj.setData(obj, radius);
		this.delete(this.topLevelNode, this.topLevelNodeBox.getCopy(), 0, pObj);
		this.cObjPool.releaseElement(pObj);
	}

	/**
	 * interface into updating an object in the quadtree
	 * @param obj the object we are updating
	 * @param radius the radius of the object
	 */
	public updateInQuadtree(obj: any, radius: number): void {
		// console.log("updating obj:", obj);
		const pObj = this.cObjPool.getElement();
		pObj.setData(obj, radius);
		this.update(this.topLevelNode, this.topLevelNodeBox.getCopy(), 0, pObj);
	}

	/**
	 * interface into searching for collisions for an object
	 * @param box the rectangular box of the object we are searching for
	 * @param results the list of collision objects we found that may collide
	 */
	public searchQuadtree(box: Rect, results: CollisionObject[]): void {
		this.search(
			this.topLevelNode,
			this.topLevelNodeBox.getCopy(),
			box,
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
		nodebox: Rect,
		depth: number,
		pObj: CollisionObject
	): void {
		const splitLeft: number =
			nodebox.l + this.SPLIT * (nodebox.r - nodebox.l);
		const splitRight: number =
			nodebox.r - this.SPLIT * (nodebox.r - nodebox.l);
		const splitBottom: number =
			nodebox.b + this.SPLIT * (nodebox.t - nodebox.b);
		const splitTop: number =
			nodebox.t - this.SPLIT * (nodebox.t - nodebox.b);

		// if we're at our deepest level it must be in here
		if (depth > this.MAX_DEPTH) {
			node.collisionObjects.push(pObj);

			// contained within UPPER LEFT
		} else if (pObj.r < splitRight && pObj.b < splitTop) {
			if (!node.kids[0]) node.kids[0] = new QuadtreeNode();
			nodebox.update(nodebox.l, splitRight, splitBottom, nodebox.t);
			this.insert(node.kids[0], nodebox, depth + 1, pObj);

			// contained within UPPER RIGHT
		} else if (pObj.l > splitLeft && pObj.b < splitTop) {
			if (!node.kids[1]) node.kids[1] = new QuadtreeNode();
			nodebox.update(splitLeft, nodebox.r, splitBottom, nodebox.t);
			this.insert(node.kids[1], nodebox, depth + 1, pObj);

			// contained within LOWER LEFT
		} else if (pObj.r < splitRight && pObj.t > splitBottom) {
			if (!node.kids[2]) node.kids[2] = new QuadtreeNode();
			nodebox.update(nodebox.l, splitRight, nodebox.b, splitTop);
			this.insert(node.kids[2], nodebox, depth + 1, pObj);

			// contained within LOWER RIGHT
		} else if (pObj.l > splitLeft && pObj.t > splitBottom) {
			if (!node.kids[3]) node.kids[3] = new QuadtreeNode();
			nodebox.update(splitLeft, nodebox.r, nodebox.b, splitTop);
			this.insert(node.kids[3], nodebox, depth + 1, pObj);

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
		nodebox: Rect,
		depth: number,
		pObj: CollisionObject
	): void {
		const splitLeft: number =
			nodebox.l + this.SPLIT * (nodebox.r - nodebox.l);
		const splitRight: number =
			nodebox.r - this.SPLIT * (nodebox.r - nodebox.l);
		const splitBottom: number =
			nodebox.b + this.SPLIT * (nodebox.t - nodebox.b);
		const splitTop: number =
			nodebox.t - this.SPLIT * (nodebox.t - nodebox.b);

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
			nodebox.update(nodebox.l, splitRight, splitBottom, nodebox.t);
			this.delete(node.kids[0], nodebox, depth + 1, pObj);

			// contained within UPPER RIGHT
		} else if (pObj.l > splitLeft && pObj.b > splitTop) {
			if (!node.kids[1]) node.kids[1] = new QuadtreeNode();
			nodebox.update(splitLeft, nodebox.r, splitBottom, nodebox.t);
			this.delete(node.kids[1], nodebox, depth + 1, pObj);

			// contained within LOWER LEFT
		} else if (pObj.r < splitRight && pObj.t < splitBottom) {
			if (!node.kids[2]) node.kids[2] = new QuadtreeNode();
			nodebox.update(nodebox.l, splitRight, nodebox.b, splitTop);
			this.delete(node.kids[2], nodebox, depth + 1, pObj);

			// contained within LOWER RIGHT
		} else if (pObj.l > splitLeft && pObj.t < splitBottom) {
			if (!node.kids[3]) node.kids[3] = new QuadtreeNode();
			nodebox.update(splitLeft, nodebox.r, nodebox.b, splitTop);
			this.delete(node.kids[3], nodebox, depth + 1, pObj);

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
		nodebox: Rect,
		depth: number,
		pObj: CollisionObject
	): void {
		this.delete(node, nodebox, depth, pObj);
		this.insert(node, nodebox, depth, pObj);
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
		nodebox: Rect,
		box: Rect,
		results: CollisionObject[]
	): void {
		const splitLeft: number =
			nodebox.l + this.SPLIT * (nodebox.r - nodebox.l);
		const splitRight: number =
			nodebox.r - this.SPLIT * (nodebox.r - nodebox.l);
		const splitBottom: number =
			nodebox.l + this.SPLIT * (nodebox.r - nodebox.l);
		const splitTop: number =
			nodebox.r - this.SPLIT * (nodebox.r - nodebox.l);

		// find all collision objects local to the current node and push them onto the results
		// if their rectangles overlap.
		node.collisionObjects
			.filter((pObj) => this.collides(pObj, box))
			.map((pObj) => {
				results.push(pObj);
			});

		const searchBox = nodebox.getCopy();

		// intersects UPPER LEFT
		if (box.l < splitRight && box.t < splitBottom && node.kids[0]) {
			this.searchSubbox.update(
				searchBox.l,
				splitRight,
				splitBottom,
				searchBox.t
			);
			this.search(node.kids[0], this.searchSubbox, box, results);

			// intersects UPPER RIGHT
		}
		if (box.r > splitLeft && box.t < splitBottom && node.kids[1]) {
			this.searchSubbox.update(
				splitLeft,
				searchBox.r,
				splitBottom,
				searchBox.t
			);
			this.search(node.kids[1], this.searchSubbox, box, results);

			// intersects LOWER LEFT
		}
		if (box.l < splitRight && box.b < splitTop && node.kids[2]) {
			this.searchSubbox.update(
				searchBox.l,
				splitRight,
				searchBox.b,
				splitTop
			);
			this.search(node.kids[2], this.searchSubbox, box, results);

			// intersects LOWER RIGHT
		}
		if (box.r > splitLeft && box.b < splitTop && node.kids[3]) {
			this.searchSubbox.update(
				splitLeft,
				searchBox.r,
				searchBox.b,
				splitTop
			);
			this.search(node.kids[3], this.searchSubbox, box, results);
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

	/**
	 * Resets an existing collision object to represent nothing
	 */
	public resetData(): void {
		this.l = 0;
		this.r = 0;
		this.b = 0;
		this.t = 0;
		this.payload = {};
	}
}
