import Structure from './structure';
import { Constant } from '../../shared/constants';
import { Tile } from '../../shared/hexTiles';

export default class BoundaryWall extends Structure {
	public static readonly COLLISION_RADIUS = Constant.RADIUS.COLLISION.WALL;

	constructor(id: string, tile: Tile) {
		super(id, Constant.HP.WALL, tile);
	}

	public getBuildingType() {
		return Constant.BUILDING.BOUNDARY;
	}
}
