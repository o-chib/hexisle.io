import { Constant } from '../../shared/constants';
import { Tile } from '../hexTiles';
import Structure from './structure';

export default class Base extends Structure {
	public readonly RADIUS = Constant.RADIUS.BASE;

	constructor(id: string, tile: Tile) {
		super(id, Constant.HP.BASE, tile);
	}

	public getBuildingType(): string {
		return Constant.BUILDING.BASE;
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
