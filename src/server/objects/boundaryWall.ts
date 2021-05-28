import Structure from './structure';
import { Constant } from '../../shared/constants';
import { Tile } from '../../shared/hexTiles';

export default class BoundaryWall extends Structure {
	constructor(id: string, tile: Tile) {
		super(id, Constant.HP.WALL, tile);
	}

	public getBuildingType() {
		return Constant.BUILDING.BOUNDARY;
	}
}
