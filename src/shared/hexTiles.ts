import { Constant } from '../shared/constants';

export class HexTiles {
	public tileMap: Tile[][]; // Made in offset even-q coordinates
	public hexRadius: number;
	public hexSize: number;
	public campRadius: number;
	public mapHeight: number;
	public baseCoords: OffsetPoint[];
	public boundaryCoords: OffsetPoint[];

	constructor() {
		this.hexSize = 75;
		this.campRadius = 4;
		this.mapHeight = Constant.MAP_HEIGHT;
		this.hexRadius = this.getMapHexRadius();
		this.baseCoords = [];
		this.boundaryCoords = [];
	}

	generateMap(): void {
		this.generateTileMap();
		this.generateBoundary();
		this.generateCamps();
		this.generateBases(2, 1);
	}

	generateTileMap(): void {
		// generates the hex integer coordinates from the game-size
		console.log('time to generate tilemap');
		console.time();

		this.tileMap = [];

		//hexagon based
		const centerTile = new Tile();
		centerTile.offset_coord = new OffsetPoint(
			this.hexRadius,
			this.hexRadius
		);

		const offsetCoords = this.getHexRadiusPoints(
			centerTile,
			this.hexRadius
		);

		// for each column
		for (let col = 0; col < 2 * this.hexRadius + 1; col++) {
			this.tileMap[col] = [];

			// for each row
			for (let row = 0; row < 2 * this.hexRadius + 1; row++) {
				this.tileMap[col][row] = new Tile();
				this.tileMap[col][row].offset_coord = new OffsetPoint(col, row);
				this.tileMap[col][row].cartesian_coord = this.offsetToCartesian(
					this.tileMap[col][row].offset_coord
				);
				if (
					!this.isHexInHexList(
						this.tileMap[col][row].offset_coord,
						offsetCoords
					)
				) {
					this.tileMap[col][row].building =
						Constant.BUILDING.OUT_OF_BOUNDS;
				}
			}
		}
		console.timeEnd();
	}

	generateBoundary(): void {
		// sets the outer ring of tiles to a boundary tile
		console.log('time to generate boundary');
		console.time();

		const boundaryHexes: OffsetPoint[] = this.getHexRingPoints(
			this.tileMap[this.hexRadius][this.hexRadius],
			this.hexRadius
		);
		for (const boundaryHex of boundaryHexes) {
			this.boundaryCoords.push(boundaryHex);
			this.tileMap[boundaryHex.q][boundaryHex.r].building =
				Constant.BUILDING.BOUNDARY;
		}

		console.timeEnd();
	}

	generateCamps(): void {
		// Takes the tilemap and sets tiles to camps dependent on the class config (private variables)
		console.log('time to generate camps');
		console.time();

		// start at the center of the map, and make it a camp
		let hex: OffsetPoint = new OffsetPoint(this.hexRadius, this.hexRadius);
		this.tileMap[hex.q][hex.r].building = Constant.BUILDING.CAMP;
		const hexesToCheck: OffsetPoint[] = [hex];
		const campHexes: OffsetPoint[] = [hex];

		// keep repeating until we don't have any hexes left
		while (hexesToCheck.length > 0) {
			hex = hexesToCheck.splice(0, 1)[0];

			// check all 6 possible surrounding campsite coordinates for this hex
			for (let i = 0; i < 6; i++) {
				// create a new hex to traverse with
				let travHex: OffsetPoint = new OffsetPoint(hex.q, hex.r);

				// direction to check
				let dir: number = i;

				// start and go the length of the hex radius in the desired direction (clockwise starting at north)
				travHex = this.hexTraverse(travHex, dir, this.campRadius);

				// if i is at the last index, loop back to 0, or else increment it
				if (i == 5) {
					dir = 0;
				} else {
					dir += 1;
				}

				// start and go the length of the hex radius + 1 in the original direction + 1
				travHex = this.hexTraverse(travHex, dir, this.campRadius + 1);

				// check if this site exists, if it does add it to the list of hexes to check
				// around for more campfires and set the tile as a campfire
				if (this.checkIfValidHex(travHex)) {
					// only add it if we haven't been to it before
					if (!this.isHexInHexList(travHex, campHexes)) {
						hexesToCheck.push(travHex);
						campHexes.push(travHex);
						if (this.tileMap[travHex.q][travHex.r].isInBounds())
							this.tileMap[travHex.q][travHex.r].building =
								Constant.BUILDING.CAMP;
					}
				}
			}
		}
		console.timeEnd();
	}

	generateBases(teamCount, campDistanceFromCenter): void {
		// Takes the tilemap and sets camps to bases dependent on the parameters
		// teamCount is the number of teams, with a maximum of 6
		// campDistanceFromCenter is how many camps away radially the bases should spawn
		console.log('time to generate bases');
		console.time();

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

		// For every direction we go in
		for (let dir of baseDirs) {
			let travHex: OffsetPoint = new OffsetPoint(
				this.hexRadius,
				this.hexRadius
			);

			// Traverse campDistanceFromCenter from the center hex
			travHex = this.hexTraverse(
				travHex,
				dir,
				this.campRadius * campDistanceFromCenter
			);

			// if i is at the last index, loop back to 0, or else increment it
			if (dir == 5) {
				dir = 0;
			} else {
				dir += 1;
			}

			// start and go the length of the hex radius + 1 in the original direction + 1
			travHex = this.hexTraverse(
				travHex,
				dir,
				this.campRadius * campDistanceFromCenter + 1
			);

			// Assign it to a base
			if (this.checkIfValidHex(travHex)) {
				if (this.tileMap[travHex.q][travHex.r].isInBounds())
					this.tileMap[travHex.q][travHex.r].building =
						Constant.BUILDING.BASE;
				this.baseCoords.push(travHex);
			}
		}
		console.timeEnd();
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

	checkIfValidPointOnGrid(point: Point): boolean {
		let hexCoord: OffsetPoint = this.cartesianToOffset(point);

		if(!this.checkIfValidHex(hexCoord)) return false;

		if (this.tileMap[hexCoord.q][hexCoord.r].building != Constant.BUILDING.NONE) {
			return false;
		}

		return true;
	}

	getRandomMapPoint(): Point {
    return new Point(Math.random() * this.mapHeight, Math.random() * this.mapHeight);
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
		let cube: number[] = this.pixelToCube(
			new Point(xPos, yPos)
		);

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
			console.log('coord around', coord.q, coord.r);
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

	private getBaseDirectionsFromTeamCount(teamCount): number[] {
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
	public team: number;
	public building: string;
	public buildingId: string;

	constructor(building = Constant.BUILDING.NONE, team = -1) {
		this.building = building;
		this.team = team;
	}

	hasNoBuilding(): boolean {
		return this.building == Constant.BUILDING.NONE;
	}

	removeBuilding(): void {
		this.building = Constant.BUILDING.NONE;
		this.buildingId = '';
	}

	isInBounds(): boolean {
		return (
			this.building != Constant.BUILDING.OUT_OF_BOUNDS &&
			this.building != Constant.BUILDING.BOUNDARY
		);
	}

	serializeForUpdate(): any {
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
