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

	/**
	 * Inserts an object into the collision grid
	 * @param obj the object to insert
	 * @param radius the radius of the object
	 */
	public insertIntoGrid(obj: any, radius: number): void {
		const cObj = this.cObjPool.getElement();
		cObj.setData(obj, radius);
		const gridIndices = this.getGridIndices(obj, radius);
		if (this.areValidRowColIndices(gridIndices)) {
			this.insert(cObj, gridIndices!);
		}
	}

	/**
	 * Deletes an object from the collision grid
	 * @param obj the object to delete
	 * @param radius the radius of the object
	 */
	public deleteFromGrid(obj: any, radius: number): void {
		const gridIndices = this.getGridIndices(obj, radius);
		if (this.areValidRowColIndices(gridIndices)) {
			this.delete(obj, gridIndices!);
		}
	}

	/**
	 * Searches the collision grid for anything that collides with the box given
	 * @param searchL the left position of the box
	 * @param searchR the right position of the box
	 * @param searchT the top position of the box
	 * @param searchB the bottom position of the box
	 * @param results the list of results to append the collided objects to
	 * @returns early if the search parameters are out of bounds
	 */
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

		if (!this.areValidLRTBIndices(idxL, idxR, idxT, idxB)) {
			return;
		}

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

	/**
	 * Internal function for inserting a collision object into the grid
	 * @param cObj the collision object to insert
	 * @param gridIndices the indices of the gridbox to insert in
	 */
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

	/**
	 * Internal function for deleting a collision object from the grid
	 * @param obj the collision object to delete
	 * @param gridIndices the indices of the gridbox to delete from
	 */
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

	/**
	 * Internal function for searching for colliders
	 * @param idxL the left-most index of the grid-box
	 * @param idxR the right-most index of the grid-box
	 * @param idxT the top-most index of the grid-box
	 * @param idxB the bottom-most index of the grid-box
	 * @param searchL the left position of the search box
	 * @param searchR the right position of the search box
	 * @param searchT the top position of the search box
	 * @param searchB the bottom position of the search box
	 * @param results the list of results to append the collided objects to
	 */
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
				// console.log("    searching for", indice);

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

	/**
	 *
	 * @param obj the object to check collision against
	 * @param searchL the left position of the search box
	 * @param searchR the right position of the search box
	 * @param searchT the top position of the search box
	 * @param searchB the bottom position of the search box
	 * @returns boolean representing if the object and box collide
	 */
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

	/**
	 * Initializes the grid with default values (null in each gridbox)
	 */
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

	/**
	 * gets grid indices based on an object location and radius
	 * @param obj the object to get indices for
	 * @param radius the radius of the object
	 * @returns [number, number], or null if the object isn't contained in a single box
	 */
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

	/**
	 * Gets all indices for all gridboxes for indices represent multiple gridboxes
	 * @param idxL the left-most index of the grid-box
	 * @param idxR the right-most index of the grid-box
	 * @param idxT the top-most index of the grid-box
	 * @param idxB the bottom-most index of the grid-box
	 * @returns an array of indices arrays [ [number, number], ... ]
	 */
	private getIntersectingGridIndices(
		idxL: number,
		idxR: number,
		idxT: number,
		idxB: number
	): Array<Array<number>> {
		const results: Array<Array<number>> = [];
		const checkedRowsCols = new Map();
		for (let row = idxL; row < idxR + 1; row++) {
			if (checkedRowsCols.has(row)) {
				continue;
			}
			checkedRowsCols.set(row, []);
			for (let col = idxT; col < idxB + 1; col++) {
				if (checkedRowsCols.get(row).includes(col)) {
					continue;
				}
				checkedRowsCols.get(row).push(col);
				results.push([row, col]);
			}
		}
		return results;
	}

	/**
	 * Finds which objects in a list collide with a searchbox and pushes them on a list
	 * @param searchL the left position of the search box
	 * @param searchR the right position of the search box
	 * @param searchT the top position of the search box
	 * @param searchB the bottom position of the search box
	 * @param cObjs the list of objects to check against the searchbox
	 * @param results the list of results to append the collided objects to
	 */
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

	/**
	 * Checks if a certain [row, col] indices are in-bounds/valid
	 * @param indices the indices to validate
	 * @returns a boolean that's true if the indices are valid
	 */
	private areValidRowColIndices(indices: [number, number] | null): boolean {
		if (!indices) {
			return true;
		}

		const numBoxes = Math.floor(
			Constant.MAP_HEIGHT / Constant.GRID.BOX_SIZE
		);
		if (
			indices[0] < 0 ||
			indices[1] < 0 ||
			indices[0] >= numBoxes ||
			indices[1] >= numBoxes
		) {
			return false;
		}
		return true;
	}

	/**
	 * Checks if certain left, right, top, and bottom indices are in-bounds/valid
	 * @param idxL the left-most index of the grid-box
	 * @param idxR the right-most index of the grid-box
	 * @param idxT the top-most index of the grid-box
	 * @param idxB the bottom-most index of the grid-box
	 * @returns a boolean that's true if the indices are valid
	 */
	private areValidLRTBIndices(
		idxL: number,
		idxR: number,
		idxT: number,
		idxB: number
	): boolean {
		const numBoxes = Math.floor(
			Constant.MAP_HEIGHT / Constant.GRID.BOX_SIZE
		);
		if (idxL < 0 || idxT < 0 || idxR >= numBoxes || idxB >= numBoxes) {
			return false;
		}
		return true;
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
