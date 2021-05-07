import { Constant } from '../shared/constants';

export class HexTiles {
	public tileMap: Tile[][]; // Made in offset even-q coordinates
	public hexRadius: number;
	public hexSize: number;
	public campRadius: number;
	public mapHeight: number;
	public campfiresInHalfWidth: number;
	public baseCoords: OffsetPoint[];
	public boundaryCoords: OffsetPoint[];
	private gameGetBuilding: (building: string, id: string) => any;

	constructor(
		gameGetBuildingMethod?: (building: string, id: string) => any,
		mapHeight: number = Constant.MAP_HEIGHT
	) {
		this.hexSize = Constant.RADIUS.HEX;
		this.campRadius = Constant.RADIUS.CAMP_HEXES;
		this.mapHeight = mapHeight;
		this.hexRadius = this.getMapHexRadius();
		this.campfiresInHalfWidth = this.getNumCampfiresInMapRadius();
		this.baseCoords = [];
		this.boundaryCoords = [];
		if (gameGetBuildingMethod) this.gameGetBuilding = gameGetBuildingMethod;
	}

	generateMap(): void {
		this.generateTileMap();
		this.generateChunks();
		this.generateBoundary();
		const campDistanceFromCenter = Math.max(
			1,
			Math.floor(this.campfiresInHalfWidth * 0.75)
		);
		this.generateBases(Constant.TEAM_COUNT, campDistanceFromCenter);
	}

	generateTileMap(): void {
		// Initisalizes the tile[][] with blank tiles
		this.tileMap = [];

		// for each column
		for (let col = 0; col < 2 * this.hexRadius + 1; col++) {
			this.tileMap[col] = [];

			// for each row
			for (let row = 0; row < 2 * this.hexRadius + 1; row++) {
				this.tileMap[col][row] = new Tile(
					Constant.BUILDING.NONE,
					-1
				);
				this.tileMap[col][row].offset_coord = new OffsetPoint(col, row);
				this.tileMap[col][row].cartesian_coord = this.offsetToCartesian(
					this.tileMap[col][row].offset_coord
				);

				this.tileMap[col][row].building =
					Constant.BUILDING.OUT_OF_BOUNDS;
			}
		}
	}

	generateChunks(): void {
		// Sets each hexagonal chunk of CAMP_RADIUS as playable,
		// with CAMP as center, and a boundary ring of (CAMP_RADIUS + 1) surrounding it.
		// If boundary cannot fit, the entire chunk is left OUT_OF_BOUNDS

		// start at the center of the map, and make it a camp
		const hex: OffsetPoint = new OffsetPoint(
			this.hexRadius,
			this.hexRadius
		);

		this.tileMap[hex.q][hex.r].building = Constant.BUILDING.CAMP;
		const hexesToCheck: OffsetPoint[] = this.getCampfireRadiusPoints(
			hex,
			this.campfiresInHalfWidth
		);

		// keep repeating until we don't have any hexes left
		for (const hex of hexesToCheck) {
			if (!this.checkIfValidHex(hex)) {
				continue;
			}
			const territoryHexes: OffsetPoint[] = this.getHexRadiusPoints(
				this.tileMap[hex.q][hex.r],
				this.campRadius
			);
			const boundaryRingHexes: OffsetPoint[] = this.getHexRingPoints(
				this.tileMap[hex.q][hex.r],
				this.campRadius + 1
			);

			// Check if the outermost ring is within the tileMap indices
			// If all tiles are fully inside, set camp to valid
			let isValid = true;
			for (const tile of boundaryRingHexes) {
				if (!this.checkIfValidHex(tile)) {
					isValid = false;
					break;
				}
			}
			if (isValid) {
				//Set this chunk center as camp
				this.tileMap[hex.q][hex.r].building = Constant.BUILDING.CAMP;
				// Set territory hexes as playable
				for (const tile of territoryHexes) {
					if (
						this.tileMap[tile.q][tile.r].building !=
						Constant.BUILDING.CAMP
					) {
						this.tileMap[tile.q][tile.r].building =
							Constant.BUILDING.NONE;
					}
				}
				// Set boundary ring hexes
				for (const tile of boundaryRingHexes) {
					if (
						this.tileMap[tile.q][tile.r].building ==
						Constant.BUILDING.OUT_OF_BOUNDS
					) {
						this.tileMap[tile.q][tile.r].building =
							Constant.BUILDING.BOUNDARY;
					}
				}
			}
		}
	}

	generateBoundary(): void {
		for (let q = 0; q < this.tileMap.length; ++q) {
			for (let r = 0; r < this.tileMap[q].length; ++r) {
				if (this.tileMap[q][r].building == Constant.BUILDING.BOUNDARY)
					this.boundaryCoords.push(this.tileMap[q][r].offset_coord);
			}
		}
	}

	generateBases(teamCount: number, campDistanceFromCenter: number): void {
		// Takes the tilemap and sets camps to bases dependent on the parameterss
		// teamCount is the number of teams, with a maximum of 6
		// campDistanceFromCenter is how many camps away radially the bases should spawn
		if (teamCount == 1) {
			this.tileMap[this.hexRadius][this.hexRadius].building =
				Constant.BUILDING.BASE;
			this.baseCoords.push(
				new OffsetPoint(this.hexRadius, this.hexRadius)
			);
			return;
		}

		const baseDirs: number[] = this.getBaseDirectionsFromTeamCount(
			teamCount
		);

		// add a random offset for direction
		// so bases can have any orientation around the centerTile
		const dirOffset = Math.floor(Math.random() * 6);
		// For every direction we go in
		for (let dir of baseDirs) {
			let travHex: OffsetPoint = new OffsetPoint(
				this.hexRadius,
				this.hexRadius
			);
			// Add random offset to direction (dir loops from 0 to 5)
			dir = (dir + dirOffset) % 6;

			// Traverse campDistanceFromCenter from the center hex to the next campfire
			travHex = this.traverseCampfires(
				travHex,
				dir,
				campDistanceFromCenter
			);

			// Assign it to a base
			if (this.checkIfValidHex(travHex)) {
				if (this.tileMap[travHex.q][travHex.r].isInBounds())
					this.tileMap[travHex.q][travHex.r].building =
						Constant.BUILDING.BASE;
				this.baseCoords.push(travHex);
			}
		}
	}

	checkIfValidHex(OffsetPoint: OffsetPoint): boolean {
		// takes in an axial coordinate and returns if that hex exists

		if (
			OffsetPoint.q < 0 ||
			OffsetPoint.r < 0 ||
			OffsetPoint.q > this.hexRadius * 2 ||
			OffsetPoint.r > this.hexRadius * 2
		) {
			return false;
		}
		return true;
	}

	checkIfValidEmptyPointOnGrid(point: Point): boolean {
		const hexCoord: OffsetPoint = this.cartesianToOffset(point);

		if (!this.checkIfValidHex(hexCoord)) return false;

		if (
			this.tileMap[hexCoord.q][hexCoord.r].building !=
				Constant.BUILDING.NONE ||
			this.tileMap[hexCoord.q][hexCoord.r].teamNumber != -1
		) {
			return false;
		}

		return true;
	}

	getCampfireRadiusPoints(
		centerPoint: OffsetPoint,
		radius: number
	): OffsetPoint[] {
		// Takes center Campfire and returns list of Campfires points that surround it in flat-top hexagonal shape
		// radius = number of adjacent campfires in a straight line till vertice
		let results: OffsetPoint[] = [];
		results[0] = new OffsetPoint(centerPoint.q, centerPoint.r);

		for (let k = 1; k <= radius; ++k) {
			const subResult = this.getCampfireRingPoints(centerPoint, k);
			results = results.concat(subResult);
		}
		return results;
	}

	getCampfireRingPoints(
		centerPoint: OffsetPoint,
		radius: number
	): OffsetPoint[] {
		// Takes center Campfire and returns a list of Campfires that form a ring at some radius from the center
		// radius = number of adjacent campfires in a straight line till vertice
		const results: OffsetPoint[] = [];

		// Get starting campfire (West of center)
		let currPoint = this.traverseCampfires(centerPoint, 4, radius);

		let k = 0;
		for (let i = 0; i < 6; ++i) {
			// Iterate in all 6 Campfire Directions
			for (let j = 0; j < radius; ++j) {
				results[k] = new OffsetPoint(currPoint.q, currPoint.r);
				currPoint = this.getAdjacentCampfirePoint(currPoint, i);
				++k;
			}
		}
		return results;
	}

	traverseCampfires(from: OffsetPoint, direction: number, distance: number) {
		// Move in straight line to campfire that is at some number of campfires away from this campfire
		// Move in 6 possible directions
		let point = new OffsetPoint(from.q, from.r);
		for (let i = 0; i < distance; ++i) {
			point = this.getAdjacentCampfirePoint(point, direction);
		}
		return point;
	}

	getAdjacentCampfirePoint(
		from: OffsetPoint,
		direction: number
	): OffsetPoint {
		let campfire: OffsetPoint = new OffsetPoint();
		switch (direction) {
			case 0: // North East
				// Go north-east
				campfire = this.hexTraverse(from, 5, this.campRadius + 1);
				// Go north
				campfire = this.hexTraverse(campfire, 4, this.campRadius);
				break;
			case 1: // East
				// Go south-east
				campfire = this.hexTraverse(from, 0, this.campRadius + 1);
				// Go north-east
				campfire = this.hexTraverse(campfire, 5, this.campRadius);
				break;
			case 2: // South East
				// Go south
				campfire = this.hexTraverse(from, 1, this.campRadius + 1);
				// Go south-east
				campfire = this.hexTraverse(campfire, 0, this.campRadius);
				break;
			case 3: //South West
				// Go south-west
				campfire = this.hexTraverse(from, 2, this.campRadius + 1);
				// Go south
				campfire = this.hexTraverse(campfire, 1, this.campRadius);
				break;
			case 4: // West
				// Go north-west
				campfire = this.hexTraverse(from, 3, this.campRadius + 1);
				// Go south-west
				campfire = this.hexTraverse(campfire, 2, this.campRadius);
				break;
			case 5: // North West
				// Go north
				campfire = this.hexTraverse(from, 4, this.campRadius + 1);
				// Go north-west
				campfire = this.hexTraverse(campfire, 3, this.campRadius);
				break;
		}
		return campfire;
	}

	getHexRingPoints(centreTile: Tile, radius: number): OffsetPoint[] {
		// Takes center tile and returns a list of points that form a ring at some radius from the center
		// radius = number of tiles from top to center - excluding the center.
		const results: OffsetPoint[] = [];

		// Get starting tile (North of center)
		let evenQ = false; // if current point lies on even q or odd q
		if (centreTile.offset_coord.q % 2 == 0) {
			evenQ = true;
		}
		let currPoint = this.getHexDirectionPoint(4, evenQ);
		currPoint.scale(radius);
		currPoint.add(centreTile.offset_coord);

		let k = 0;
		for (let i = 0; i < 6; ++i) {
			// Iterate in all 6 Hex Directions
			for (let j = 0; j < radius; ++j) {
				results[k] = new OffsetPoint(currPoint.q, currPoint.r);
				currPoint = this.getHexNeighborPoint(currPoint, i);
				++k;
			}
		}
		return results;
	}

	getHexRadiusPoints(centerTile: Tile, radius: number): OffsetPoint[] {
		// Takes center tile and returns list of points that surround it in hexagonal shape
		// radius = number of tiles from top to center - excluding the center.

		let results: OffsetPoint[] = [];
		results[0] = new OffsetPoint(
			centerTile.offset_coord.q,
			centerTile.offset_coord.r
		);

		for (let k = 1; k <= radius; ++k) {
			const subResult = this.getHexRingPoints(centerTile, k);
			results = results.concat(subResult);
		}
		return results;
	}

	cartesianToOffset(point: Point): OffsetPoint {
		// takes in a point in the cartesian plane
		// returns the offset odd-q coordinate of the hex it's in

		// account for the half a hex to the bottom right we're pushing the map
		let xPos: number = point.xPos;
		let yPos: number = point.yPos;
		xPos = xPos - this.hexSize;
		yPos = yPos - this.hexSize;

		// make the offset coord into a cube format
		let cube: number[] = this.pixelToCube(new Point(xPos, yPos));

		// round the cube
		cube = this.roundCube(cube);

		// convert the cube to evenq coords and return
		return this.cubeToOffset(cube);
	}

	offsetToCartesian(OffsetPoint: OffsetPoint): Point {
		// given an offset odd-q hex coordinate,
		// returns the cartesian coordinate of the center of that hex

		// matrix multiplication for conversions
		const x: number = this.hexSize * (1.5 * OffsetPoint.q);

		// if the column number is odd shift the hexes down, if it's even don't
		let y: number;
		if (OffsetPoint.q % 2 != 0) {
			y =
				this.hexSize *
				(Math.sqrt(3) / 2 + Math.sqrt(3) * OffsetPoint.r);
		} else {
			y = this.hexSize * (Math.sqrt(3) * OffsetPoint.r);
		}
		return new Point(x + this.hexSize, y + this.hexSize);
	}

	getHexPointsFromCenter(point: Point): Point[] {
		const hexPoints: Point[] = [];

		// iterate through each corner
		for (let i = 0; i < 6; i++) {
			hexPoints.push(this.getHexCorner(point, i));
		}
		return hexPoints;
	}

	getSurroundingTilesFromCart(point: Point): Tile[] {
		// Gets all tiles a radius away from the cartesian point
		// returns a list of tiles

		const results: Tile[] = [];
		const centerTile: Tile = new Tile();
		centerTile.offset_coord = this.cartesianToOffset(
			new Point(point.xPos, point.yPos)
		);
		const screenCoords: OffsetPoint[] = this.getHexRadiusPoints(
			centerTile,
			5
		);
		for (const coord of screenCoords) {
			if (this.checkIfValidHex(coord)) {
				results.push(this.tileMap[coord.q][coord.r]);
			}
		}
		return results;
	}

	public getHexHeight(): number {
		return this.hexSize * Math.sqrt(3);
	}

	public getHexWidth(): number {
		return this.hexSize * 2;
	}

	private getHexCorner(point: Point, angle: number): Point {
		// given a cartesian point, which is the center of some hex
		// this returns a point of the hex, whose angle is given by the number

		const angle_deg: number = 60 * angle;
		const angle_rad: number = (Math.PI / 180) * angle_deg;
		return new Point(
			point.xPos + this.hexSize * Math.cos(angle_rad),
			point.yPos + this.hexSize * Math.sin(angle_rad)
		);
	}

	private getMapHexRadius(): number {
		// given the mapsize, calculates how hexes radially it can hold, given
		// that there is a hex in the absolute center of the map

		const mapRadius: number = this.mapHeight / 2;
		const freeSpace: number = mapRadius - this.getHexHeight() / 2;
		return Math.floor(freeSpace / this.getHexHeight());
	}

	getNumCampfiresInMapRadius() {
		// Calculate number of campfires to fit in horizontal hexRadius tiles
		// We need n = number of campfires horizontally
		// # tiles needed = [n * (# tiles in between camps)]+ leftover tiles from ending campfire + 1 boundary tile
		// OR # = [n * (2 * campRadius + 1)] + (campRadius + 1) <= hexRadius
		const spaceBetweenCamps = 2 * this.campRadius + 1;
		const addedTiles = this.campRadius + 1;

		const n = Math.floor((this.hexRadius - addedTiles) / spaceBetweenCamps);

		return n;
	}

	private getBaseDirectionsFromTeamCount(teamCount: number): number[] {
		// takes in the number of teams and returns a list of the directions a base will be in
		const baseDirs: number[] = [];
		const possibleBaseDirs: number[] = [0, 1, 2, 3, 4, 5];
		let selectBaseDirsIndex = 0;

		if (teamCount > 6) {
			teamCount = 6;
		} else if (teamCount < 1) {
			teamCount = 1;
		}

		for (let i = 0; i < teamCount; i++) {
			baseDirs.push(possibleBaseDirs[selectBaseDirsIndex]);

			if (teamCount < 3) {
				selectBaseDirsIndex += 3;
			} else {
				selectBaseDirsIndex += 2;
			}

			if (selectBaseDirsIndex > 5) {
				selectBaseDirsIndex = 1;
			}
		}

		return baseDirs;
	}

	private pixelToCube(point: Point): number[] {
		// used for conversions from cartesian to offset odd-q
		// returns the cube: x, y, z in that order in a list

		const q: number = ((2 / 3) * point.xPos) / this.hexSize;
		const r: number =
			((-1 / 3) * point.xPos + (Math.sqrt(3) / 3) * point.yPos) /
			this.hexSize;
		return [q, -q - r, r];
	}

	private cubeToOffset(cube: number[]): OffsetPoint {
		// used for conversions from cartesian to odd-q offset
		// returns an offset odd-q point

		const q: number = cube[0];
		const r: number = cube[2] + (cube[0] - (cube[0] & 1)) / 2;
		return new OffsetPoint(q, r);
	}

	private roundCube(cube: number[]): number[] {
		let rx: number = Math.round(cube[0]);
		let ry: number = Math.round(cube[1]);
		let rz: number = Math.round(cube[2]);

		const x_dif = Math.abs(rx - cube[0]);
		const y_dif = Math.abs(ry - cube[1]);
		const z_dif = Math.abs(rz - cube[2]);

		if (x_dif > y_dif && x_dif > z_dif) {
			rx = -ry - rz;
		} else if (y_dif > z_dif) {
			ry = -rx - rz;
		} else {
			rz = -rx - ry;
		}
		return [rx, ry, rz];
	}

	private getHexDirectionPoint(
		directionIndex: number,
		evenQ: boolean
	): OffsetPoint {
		// Specifies all directions one can move from any hex;
		// displacement depends on position of current tile - if it is offset due to 'odd-q' configuration.

		let offsetDir = new OffsetPoint(0, 0);
		switch (directionIndex) {
			case 0: //South-East
				if (evenQ) offsetDir = new OffsetPoint(1, 0);
				else offsetDir = new OffsetPoint(1, 1);
				break;
			case 1: //South
				offsetDir = new OffsetPoint(0, 1);
				break;
			case 2: //South-West
				if (evenQ) offsetDir = new OffsetPoint(-1, 0);
				else offsetDir = new OffsetPoint(-1, 1);
				break;
			case 3: //North-West
				if (evenQ) offsetDir = new OffsetPoint(-1, -1);
				else offsetDir = new OffsetPoint(-1, 0);
				break;
			case 4: // North
				offsetDir = new OffsetPoint(0, -1);
				break;
			case 5: //North-East
				if (evenQ) offsetDir = new OffsetPoint(1, -1);
				else offsetDir = new OffsetPoint(1, 0);
				break;
		}
		return offsetDir;
	}

	private getHexNeighborPoint(
		point: OffsetPoint,
		directionIndex: number
	): OffsetPoint {
		// Get coords of adjacent tile based on direction
		const neighbor = new OffsetPoint(point.q, point.r);

		let evenQ = false; // if current point lies on even q or odd q;
		if (point.q % 2 == 0) {
			evenQ = true;
		}
		const direction = this.getHexDirectionPoint(directionIndex, evenQ);
		neighbor.add(direction);

		return neighbor;
	}

	private hexTraverse(
		hex: OffsetPoint,
		direction: number,
		distance: number
	): OffsetPoint {
		// moves the hex coordinate from it's original position <distance> hexes away in the direction <direction>
		// returns the offset coordinate of the new position

		for (let i = 0; i < distance; i++) {
			// make sure we're using the right column directions (even or odd)
			if (hex.q % 2 == 0) {
				hex.add(this.getHexDirectionPoint(direction, true));
			} else {
				hex.add(this.getHexDirectionPoint(direction, false));
			}
		}
		return hex;
	}

	public isHexInHexList(hex: OffsetPoint, hexList: OffsetPoint[]): boolean {
		// checks if a given hex coordinate is in a list of offset points (checks q and r)
		// returns a true if it is in the list

		for (const checkHex of hexList) {
			if (checkHex.q == hex.q && checkHex.r == hex.r) {
				return true;
			}
		}
		return false;
	}
}

export class Tile {
	public offset_coord: OffsetPoint;
	public cartesian_coord: Point;
	public teamNumber: number;
	public building: string;
	public buildingObj: any;

	constructor(
		building: string = Constant.BUILDING.NONE,
		teamNumber = -1,
	) {
		this.teamNumber = teamNumber;
		this.building = building;
		this.buildingObj = null;
	}

	public hasNoBuilding(): boolean {
		return (
			this.building == Constant.BUILDING.NONE &&
			!this.buildingObj
		);
	}

	public setBuilding(buildingType: string, buildingObj: any): void {
		this.building = buildingType;
		this.buildingObj = buildingObj;
	}

	public removeBuilding(): void {
		this.building = Constant.BUILDING.NONE;
		this.buildingObj = null;
	}

	public changeTeamNumber(teamNumber: number) {
		this.teamNumber = teamNumber;
		if (this.buildingObj)
			this.buildingObj.teamNumber = teamNumber;
	}

	public isInBounds(): boolean {
		return (
			this.building != Constant.BUILDING.OUT_OF_BOUNDS &&
			this.building != Constant.BUILDING.BOUNDARY
		);
	}

	public serializeForUpdate(): any {
		return {
			id: this.building,
			xPos: this.cartesian_coord.xPos,
			yPos: this.cartesian_coord.yPos,
		};
	}
}

export class OffsetPoint {
	public q: number;
	public r: number;
	public s: number;

	constructor(q = 0, r = 0) {
		this.q = q;
		this.r = r;
		this.s = -this.q - this.r;
	}

	public length(): number {
		return (Math.abs(this.q) + Math.abs(this.r) + Math.abs(this.s)) / 2;
	}

	public scale(x: number) {
		this.q *= x;
		this.r *= x;
		this.s *= x;
	}

	public add(offset_coord: OffsetPoint) {
		this.q += offset_coord.q;
		this.r += offset_coord.r;
		this.s += offset_coord.s;
	}
}

export class Point {
	public xPos: number;
	public yPos: number;

	constructor(x = 0, y = 0) {
		this.xPos = x;
		this.yPos = y;
	}
}
