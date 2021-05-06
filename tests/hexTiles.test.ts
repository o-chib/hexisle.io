import { Constant } from '../src/shared/constants';
import { HexTiles, Tile, OffsetPoint, Point } from './../src/shared/hexTiles';

describe('HexTiles', () => {
	const hexTileMap: HexTiles = new HexTiles(undefined, 10000);
	hexTileMap.generateMap();

	it('checkIfValidHex should return false', () => {
		expect(hexTileMap.checkIfValidHex(new OffsetPoint(-1, -1))).toEqual(
			false
		);
	});

	it('checkIfValidHex should return true', () => {
		expect(hexTileMap.checkIfValidHex(new OffsetPoint(10, 10))).toEqual(
			true
		);
	});

	it('checkIfValidEmptyPointOnGrid should return false', () => {
		expect(
			hexTileMap.checkIfValidEmptyPointOnGrid(new Point(2700, 5700))
		).toEqual(false);
	});

	it('checkIfValidEmptyPointOnGrid should return true', () => {
		expect(
			hexTileMap.checkIfValidEmptyPointOnGrid(new Point(3300, 5600))
		).toEqual(true);
	});

	it('cartesianToOffset should give an empty tile at the right offset coord', () => {
		const hexCoord: OffsetPoint = hexTileMap.cartesianToOffset(
			new Point(2900, 1700)
		);
		expect(hexCoord.q).toEqual(25);
		expect(hexCoord.r).toEqual(12);

		const tile: Tile = hexTileMap.tileMap[hexCoord.q][hexCoord.r];
		expect(tile.building).toEqual(Constant.BUILDING.NONE);
	});

	it('cartesianToOffset should give a boundary tile at the right offset coord', () => {
		const hexCoord: OffsetPoint = hexTileMap.cartesianToOffset(
			new Point(7400, 4600)
		);
		expect(hexCoord.q).toEqual(65);
		expect(hexCoord.r).toEqual(34);

		const tile: Tile = hexTileMap.tileMap[hexCoord.q][hexCoord.r];
		expect(tile.building).toEqual(Constant.BUILDING.BOUNDARY);
	});

	it('cartesianToOffset should not modify the point given to it', () => {
		const point: Point = new Point(1900, 2700);
		hexTileMap.cartesianToOffset(point);
		expect(point.xPos).toEqual(1900);
		expect(point.yPos).toEqual(2700);
	});
});
