import { Constant } from './constants';
import DestructibleObj from './destructibleObj';
import { Tile } from './hexTiles';

export default class Base extends DestructibleObj {
	tile: Tile;

	constructor(
		id: string,
		xPos: number,
		yPos: number,
		teamNumber: number,
		tile: Tile
	) {
		super(id, xPos, yPos, teamNumber, Constant.HP.BASE);
		this.tile = tile;
	}

	serializeForUpdate(): any {
		return {
			id: this.id,
			xPos: this.xPos,
			yPos: this.yPos,
			teamNumber: this.teamNumber,
			hp: this.hp,
			tile: this.tile,
		};
	}
}
