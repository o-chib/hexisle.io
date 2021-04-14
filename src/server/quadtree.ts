// Import Mapsize or something

export class Quadtree {
	// The ratio of child to parent width.  Higher numbers will push payload further down
	// into the tree.  The resulting quadtree will require more node testing but less object
	// testing.
	private SPLIT: number;
	private MAX_DEPTH: number;
	private topLevelNode: QuadtreeNode;
	private topLevelNodeBox: Rect;

	constructor() {
		this.SPLIT = 0.5; // originally(with overlapping) = 0.6;
		this.MAX_DEPTH = 8;
		this.topLevelNode = new QuadtreeNode();
		this.topLevelNodeBox = new Rect(0, 4000, 4000, 0);
	}

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

	public getTopLevelNode(): QuadtreeNode {
		return this.topLevelNode;
	}

	public insertIntoQuadtree(obj: CollisionObject): void {
		this.insert(this.topLevelNode, this.topLevelNodeBox, 0, obj);
	}

	public deleteFromQuadtree(obj: CollisionObject): void {
		this.delete(this.topLevelNode, this.topLevelNodeBox, 0, obj);
	}

	public updateInQuadtree(obj: CollisionObject): void {
		this.update(this.topLevelNode, this.topLevelNodeBox, 0, obj);
	}

	public searchQuadtree(box: Rect, results: CollisionObject[]): void {
		this.search(this.topLevelNode, this.topLevelNodeBox, box, results);
	}

	private insert(
		node: QuadtreeNode,
		nodebox: Rect,
		depth: number,
		obj: CollisionObject
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
			node.collisionObjects.push(obj);

			// contained within UPPER LEFT
		} else if (obj.r < splitRight && obj.b > splitTop) {
			if (!node.kids[0]) node.kids[0] = new QuadtreeNode();
			nodebox = new Rect(nodebox.l, splitRight, splitBottom, nodebox.t);
			this.insert(node.kids[0], nodebox, depth + 1, obj);

			// contained within UPPER RIGHT
		} else if (obj.l > splitLeft && obj.b > splitTop) {
			if (!node.kids[1]) node.kids[1] = new QuadtreeNode();
			nodebox = new Rect(splitLeft, nodebox.r, splitBottom, nodebox.t);
			this.insert(node.kids[1], nodebox, depth + 1, obj);

			// contained within LOWER LEFT
		} else if (obj.r < splitRight && obj.t < splitBottom) {
			if (!node.kids[2]) node.kids[2] = new QuadtreeNode();
			nodebox = new Rect(nodebox.l, splitRight, nodebox.b, splitTop);
			this.insert(node.kids[2], nodebox, depth + 1, obj);

			// contained within LOWER RIGHT
		} else if (obj.l > splitLeft && obj.t < splitBottom) {
			if (!node.kids[3]) node.kids[3] = new QuadtreeNode();
			nodebox = new Rect(splitLeft, nodebox.r, nodebox.b, splitTop);
			this.insert(node.kids[3], nodebox, depth + 1, obj);

			// object is not wholly contained in any child node
		} else {
			this.topLevelNode.collisionObjects.push(obj);
		}
	}

	private delete(
		node: QuadtreeNode,
		nodebox: Rect,
		depth: number,
		obj: CollisionObject
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
				(o) => o.payload.id === obj.payload.id
			);
			node.collisionObjects.splice(index, 1);

			// contained within UPPER LEFT
		} else if (obj.r < splitRight && obj.b > splitTop) {
			if (!node.kids[0]) node.kids[0] = new QuadtreeNode();
			nodebox = new Rect(nodebox.l, splitRight, splitBottom, nodebox.t);
			this.delete(node.kids[0], nodebox, depth + 1, obj);

			// contained within UPPER RIGHT
		} else if (obj.l > splitLeft && obj.b > splitTop) {
			if (!node.kids[1]) node.kids[1] = new QuadtreeNode();
			nodebox = new Rect(splitLeft, nodebox.r, splitBottom, nodebox.t);
			this.delete(node.kids[1], nodebox, depth + 1, obj);

			// contained within LOWER LEFT
		} else if (obj.r < splitRight && obj.t < splitBottom) {
			if (!node.kids[2]) node.kids[2] = new QuadtreeNode();
			nodebox = new Rect(nodebox.l, splitRight, nodebox.b, splitTop);
			this.delete(node.kids[2], nodebox, depth + 1, obj);

			// contained within LOWER RIGHT
		} else if (obj.l > splitLeft && obj.t < splitBottom) {
			if (!node.kids[3]) node.kids[3] = new QuadtreeNode();
			nodebox = new Rect(splitLeft, nodebox.r, nodebox.b, splitTop);
			this.delete(node.kids[3], nodebox, depth + 1, obj);

			// object is not wholly contained in any child node
		} else {
			const index: number = this.topLevelNode.collisionObjects.findIndex(
				(o) => o.payload.id === obj.payload.id
			);
			this.topLevelNode.collisionObjects.splice(index, 1);
		}
	}

	private update(
		node: QuadtreeNode,
		nodebox: Rect,
		depth: number,
		obj: CollisionObject
	): void {
		this.delete(node, nodebox, depth, obj);
		this.insert(node, nodebox, depth, obj);
	}

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
			.filter((obj) => this.collides(obj, box))
			.map((obj) => {
				results.push(obj);
			});

		// intersects UPPER LEFT
		if (box.l < splitRight && box.t > splitBottom && node.kids[0]) {
			const subbox = new Rect(
				nodebox.l,
				splitRight,
				splitBottom,
				nodebox.t
			);
			this.search(node.kids[0], subbox, box, results);

			// intersects UPPER RIGHT
		}
		if (box.r > splitLeft && box.t > splitBottom && node.kids[1]) {
			const subbox = new Rect(
				splitLeft,
				nodebox.r,
				splitBottom,
				nodebox.t
			);
			this.search(node.kids[1], subbox, box, results);

			// intersects LOWER LEFT
		}
		if (box.l < splitRight && box.b < splitTop && node.kids[2]) {
			const subbox = new Rect(nodebox.l, splitRight, nodebox.b, splitTop);
			this.search(node.kids[2], subbox, box, results);

			// intersects LOWER RIGHT
		}
		if (box.r > splitLeft && box.b < splitTop && node.kids[3]) {
			const subbox = new Rect(splitLeft, nodebox.r, nodebox.b, splitTop);
			this.search(node.kids[3], subbox, box, results);
		}
	}
}

export class Rect {
	public l: number;
	public r: number;
	public b: number;
	public t: number;

	constructor(l: number, r: number, b: number, t: number) {
		this.l = l;
		this.r = r;
		this.b = b;
		this.t = t;
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

	constructor(l, r, b, t, payload) {
		super(l, r, b, t);
		this.payload = payload;
	}
}
