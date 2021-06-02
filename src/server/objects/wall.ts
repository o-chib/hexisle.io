import Structure from './structure';
import { Constant } from '../../shared/constants';
import { Tile } from '../../shared/hexTiles';

export default class Wall extends Structure {
	public readonly RADIUS = Constant.RADIUS.WALL;

	constructor(id: string, tile: Tile) {
		super(id, Constant.HP.WALL, tile);
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
