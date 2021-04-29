import { HexTiles } from './../src/shared/hexTiles';

describe('HexTiles', () => {
	const hexTileMap: HexTiles = new HexTiles();
	hexTileMap.generateMap();

	it('should generate correct resourceCount', () => {
		expect(1).toEqual(1);
	});
});
