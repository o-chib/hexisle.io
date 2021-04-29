import { Constant } from '../src/shared/constants';
import { HexTiles, Tile, OffsetPoint, Point} from './../src/shared/hexTiles';

describe('HexTiles', () => {
	const hexTileMap: HexTiles = new HexTiles(5000);
	hexTileMap.generateMap();

	it('checkIfValidHex should return false', () => {
		expect(hexTileMap.checkIfValidHex(new OffsetPoint(-1, -1))).toEqual(false);
	});

	it('checkIfValidHex should return true', () => {
		expect(hexTileMap.checkIfValidHex(new OffsetPoint(10, 10))).toEqual(true);
	});

	it('checkIfValidEmptyPointOnGrid should return false', () => {
		expect(hexTileMap.checkIfValidEmptyPointOnGrid(new Point(2500, 3300))).toEqual(false);
	});

	it('checkIfValidEmptyPointOnGrid should return true', () => {
		expect(hexTileMap.checkIfValidEmptyPointOnGrid(new Point(2300, 3100))).toEqual(true);
	});

	it('cartesianToOffset should give an empty tile at the right offset coord', () => {
		let hexCoord: OffsetPoint = hexTileMap.cartesianToOffset(new Point(1900, 2700));
		expect(hexCoord.q).toEqual(16);
		expect(hexCoord.r).toEqual(20);

		let tile: Tile = hexTileMap.tileMap[hexCoord.q][hexCoord.r];
		expect(tile.building).toEqual(Constant.BUILDING.NONE);
	});

	it('cartesianToOffset should give a boundary tile at the right offset coord', () => {
		let hexCoord: OffsetPoint = hexTileMap.cartesianToOffset(new Point(4100, 3600));
		expect(hexCoord.q).toEqual(36);
		expect(hexCoord.r).toEqual(27);

		let tile: Tile = hexTileMap.tileMap[hexCoord.q][hexCoord.r];
		expect(tile.building).toEqual(Constant.BUILDING.BOUNDARY);
	});
});
