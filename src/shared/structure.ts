import { Tile } from './hexTiles';
import IndestructibleObj from './indestructibleObj';

export default interface Structure extends IndestructibleObj {
	tile: Tile;
	getBuildingType(): string;
}
