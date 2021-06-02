import { Constant } from '../shared/constants';
import { CollisionObjectPool } from './CollisionObjectPool';

export class CollisionGrid {
	// The ratio of child to parent width. Higher numbers will push payload further down
	// into the tree. The resulting quadtree will require more node testing but less object
	// testing.
	private grid: CollisionObject | null[][];
	private topLevelCObjs: CollisionObject[] | null;
	private cObjPool: CollisionObjectPool;

	constructor() {
		this.cObjPool = new CollisionObjectPool();
		this.topLevelCObjs = null;
		this.initGrid();
	}

	public insertIntoGrid(obj: any, radius: number): void {
		const cObj = this.cObjPool.getElement();
		cObj.setData(obj, radius);
		const gridIndices = this.getGridIndices(obj, radius);
		this.insert(cObj, gridIndices!);
	}

	public deleteFromGrid(obj: any, radius: number): void {
		const gridIndices = this.getGridIndices(obj, radius);
		this.delete(obj, gridIndices!);
	}

	public searchGrid(
		searchL: number,
		searchR: number,
		searchT: number,
		searchB: number,
		results: CollisionObject[]
	): void {
		// console.log(searchL, searchR, searchT, searchB);
		const idxL = Math.floor(searchL / Constant.GRID.BOX_SIZE);
		const idxR = Math.floor(searchR / Constant.GRID.BOX_SIZE);
		const idxT = Math.floor(searchT / Constant.GRID.BOX_SIZE);
		const idxB = Math.floor(searchB / Constant.GRID.BOX_SIZE);

		this.search(
			idxL,
			idxR,
			idxT,
			idxB,
			searchL,
			searchR,
			searchT,
			searchB,
			results
		);
	}

	private insert(cObj: CollisionObject, gridIndices: [number, number]): void {
		let cObjList: CollisionObject[] | null;
		// console.log("");

		// top level
		if (!gridIndices) {
			// initialize this array if needed
			if (!this.topLevelCObjs) {
				this.topLevelCObjs = [];
			}

			cObjList = this.topLevelCObjs;
			// console.log("inserting in top level");

			// inside a grid
		} else {
			// initialize this array if needed
			if (!this.grid[gridIndices[0]][gridIndices[1]]) {
				this.grid[gridIndices[0]][gridIndices[1]] = [];
			}

			cObjList = this.grid[gridIndices[0]][gridIndices[1]];
			// console.log("inserting in grid:", gridIndices);
		}

		// push the cObj onto the array
		cObjList!.push(cObj);
	}

	private delete(obj: any, gridIndices: [number, number]): void {
		let cObjList: CollisionObject[] | null;
		// console.log("");

		// top level
		if (!gridIndices) {
			cObjList = this.topLevelCObjs;
			// console.log("deleting in top level");

			// inside a grid
		} else {
			cObjList = this.grid[gridIndices[0]][gridIndices[1]];
			// console.log("deleting in grid:", gridIndices);
		}

		// find and remove the cObj
		const index: number = cObjList!.findIndex(
			(o) => o.payload.id === obj.id
		);
		cObjList!.splice(index, 1).forEach((cObj) => {
			this.cObjPool.releaseElement(cObj);
		});

		// set the grid array to null if there's nothing left in here
		if (cObjList!.length == 0) {
			cObjList = null;
		}
	}

	private search(
		idxL: number,
		idxR: number,
		idxT: number,
		idxB: number,
		searchL: number,
		searchR: number,
		searchT: number,
		searchB: number,
		results: CollisionObject[]
	): void {
		let cObjList: CollisionObject[] | null;

		// console.log("");

		// if it's wholly contained in one box then just search in there + maybe the top level node
		if (idxL == idxR && idxT == idxB) {
			// console.log("search: wholly contained", idxL, idxT);

			// check if there is anything in the top level node, search for collisions if something is in there
			cObjList = this.topLevelCObjs;
			if (cObjList) {
				this.pushCollidingItemsOntoResults(
					searchL,
					searchR,
					searchT,
					searchB,
					cObjList,
					results
				);
				// console.log("    searching top level");
			}

			// check if there is anything in this box, search for collisions if something is in there
			cObjList = this.grid[idxL][idxT];
			if (cObjList) {
				this.pushCollidingItemsOntoResults(
					searchL,
					searchR,
					searchT,
					searchB,
					cObjList,
					results
				);
				// console.log("    searching box", [idxL, idxT]);
			}

			// it must overlap so check the toplevelcObjs and overlapping boxes
		} else {
			// console.log("search: overlap");

			// check if there is anything in the top level node, search for collisions if something is in there
			cObjList = this.topLevelCObjs;
			if (cObjList) {
				this.pushCollidingItemsOntoResults(
					searchL,
					searchR,
					searchT,
					searchB,
					cObjList,
					results
				);
				// console.log("    searching top level");
			}

			// also check any surrounding boxes it overlaps in
			const indices = this.getIntersectingGridIndices(
				idxL,
				idxR,
				idxT,
				idxB
			);
			// console.log(indices);
			for (const indice of indices) {
				// check if there is anything in this box, search for collisions if something is in there
				cObjList = this.grid[indice[0]][indice[1]];
				if (cObjList) {
					this.pushCollidingItemsOntoResults(
						searchL,
						searchR,
						searchT,
						searchB,
						cObjList,
						results
					);
					// console.log("    searching box", [indice[0], indice[1]]);
				}
			}
		}
	}

	private collides(
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

	private initGrid(): void {
		const numBoxes = Math.floor(
			Constant.MAP_HEIGHT / Constant.GRID.BOX_SIZE
		);
		this.grid = [];
		for (let i = 0; i < numBoxes; i++) {
			this.grid[i] = [];
			for (let j = 0; j < numBoxes; j++) {
				this.grid[i][j] = null;
			}
		}
	}

	private getGridIndices(obj: any, radius: number): [number, number] | null {
		const objL = obj.xPos - radius;
		const objR = obj.xPos + radius;
		const objT = obj.yPos - radius;
		const objB = obj.yPos + radius;

		const idxL = Math.floor(objL / Constant.GRID.BOX_SIZE);
		const idxR = Math.floor(objR / Constant.GRID.BOX_SIZE);
		const idxT = Math.floor(objT / Constant.GRID.BOX_SIZE);
		const idxB = Math.floor(objB / Constant.GRID.BOX_SIZE);

		if (idxL == idxR && idxT == idxB) {
			return [idxL, idxT];
		} else {
			return null;
		}
	}

	private getIntersectingGridIndices(
		idxL: number,
		idxR: number,
		idxT: number,
		idxB: number
	): Array<Array<number>> {
		const results: Array<Array<number>> = [];
		const checkedRowsCols = new Map();
		for (const row of [idxL, idxR]) {
			if (checkedRowsCols.has(row)) {
				continue;
			}
			checkedRowsCols.set(row, []);
			for (const col of [idxT, idxB]) {
				if (checkedRowsCols.get(row).includes(col)) {
					continue;
				}
				checkedRowsCols.get(row).push(col);
				results.push([row, col]);
			}
		}
		return results;
	}

	private pushCollidingItemsOntoResults(
		searchL: number,
		searchR: number,
		searchT: number,
		searchB: number,
		cObjs: CollisionObject[],
		results: CollisionObject[]
	): void {
		cObjs
			.filter((cObj) =>
				this.collides(cObj, searchL, searchR, searchT, searchB)
			)
			.map((cObj) => {
				results.push(cObj);
			});
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
