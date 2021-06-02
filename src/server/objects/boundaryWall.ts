import Structure from './structure';
import { Constant } from '../../shared/constants';
import { Tile } from '../hexTiles';

export default class BoundaryWall extends Structure {
	public readonly RADIUS = Constant.RADIUS.WALL;

	constructor(id: string, tile: Tile) {
		super(id, Constant.HP.WALL, tile);
	}

	public getBuildingType() {
		return Constant.BUILDING.BOUNDARY;
	}

	public isAlive(): boolean {
		return true;
	}
}
