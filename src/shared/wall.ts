import Structure from './structure';
import { Constant } from './constants';
import { Tile } from './hexTiles';

export default class Wall extends Structure {
	constructor(id: string, tile: Tile) {
		super(id, Constant.HP.WALL, tile);
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
