import Structure from './structure';
import { Constant } from './constants';
import { Tile } from './hexTiles';
import DestructibleObj from './destructibleObj';

export default class Wall extends DestructibleObj implements Structure {
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

	public getBuildingType() {
		return Constant.BUILDING.WALL;
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
