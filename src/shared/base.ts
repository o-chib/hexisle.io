import { Constant } from './constants';
import { Tile } from './hexTiles';

export default class Base {
	id: string;
	xPos: number;
	yPos: number;
	teamNumber: number;
	tile: Tile;
	hp: number;

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
		this.hp = Constant.HP.BASE;
	}

	serializeForUpdate(): any {
		return {
			id: this.id,
			xPos: this.xPos,
			yPos: this.yPos,
			hp: this.hp,
			teamNumber: this.teamNumber,
		};
	}

	isAlive(): boolean {
		return this.hp > 0;
	}
}
