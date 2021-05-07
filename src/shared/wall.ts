import DestructibleObj from './destructibleObj';
import { Constant } from './constants';
import { Tile } from './hexTiles';

export default class Wall extends DestructibleObj {
	public tile: Tile;

	constructor(id: string, tile: Tile) {
		super(
			id,
			tile.cartesian_coord.xPos,
			tile.cartesian_coord.yPos,
			tile.teamNumber,
			Constant.HP.WALL
		);
		this.tile = tile;
	}

	public serializeForUpdate(): any {
		return {
			id: this.id,
			xPos: this.xPos,
			yPos: this.yPos,
			teamNumber: this.teamNumber,
			hp: this.hp,
		};
	}
}
