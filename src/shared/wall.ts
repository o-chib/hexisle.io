import { Tile } from './hexTiles';

export default class Wall {
	id: string;
	xPos: number;
	yPos: number;
	teamNumber: number;
	tile: Tile;

	hp = 50;

	constructor(
		id: string,
		xPos: number,
		yPos: number,
		teamNumber: number,
		tile: Tile
	) {
		this.id = id;
		this.xPos = xPos;
		this.yPos = yPos;
		this.teamNumber = teamNumber;
		this.tile = tile;
	}

	serializeForUpdate(): any {
		return {
			id: this.id,
			xPos: this.xPos,
			yPos: this.yPos,
			hp: this.hp,
			team: this.teamNumber,
		};
	}

	isAlive(): boolean {
		return this.hp > 0;
	}
}
