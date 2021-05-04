import { Point } from '../src/shared/hexTiles';
import { MapResources, Resource } from '../src/server/mapResources';

describe('Resource', () => {
	it('should generate correct resourceCount', () => {
		const mapResources = new MapResources();
		const xPos = 1;
		const yPos = 1;
		const point = new Point(xPos, yPos);
		const numResourceToGenerate = 10;

		for (let i = 0; numResourceToGenerate > i; i++) {
			mapResources.generateResource(i.toString(), point);
		}

		expect(mapResources.resources.size).toEqual(numResourceToGenerate);

		const newResource = new Resource(
			numResourceToGenerate.toString(),
			xPos,
			yPos,
			'BLUE'
		);
		mapResources.resources.add(newResource);

		expect(mapResources.resources.has(newResource)).toEqual(true);
	});
});
