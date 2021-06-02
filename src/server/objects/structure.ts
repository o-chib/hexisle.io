import DestructibleObj from './destructibleObj';
import { Tile } from '../hexTiles';

export default abstract class Structure extends DestructibleObj {
	public tile: Tile;

	constructor(id: string, hp = 0, tile: Tile) {
		super(
			id,
			tile.cartesian_coord.xPos,
			tile.cartesian_coord.yPos,
			tile.teamNumber,
			hp
		);
		this.tile = tile;
		this.tile.setBuilding(this.getBuildingType(), this);
	}

	public abstract getBuildingType(): string;
}
