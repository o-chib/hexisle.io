import { Point } from '../src/shared/hexTiles';
import { MapResources, Resource } from '../src/server/mapResources';

describe('Resource', () => {
	it('should generate correct resourceCount', () => {
		const mapResources = new MapResources();
		const xPos = 1;
		const yPos = 1;
		const point = new Point(xPos, yPos);
		const numResourceToGenerate =
			mapResources.getRandomResourceGenerationCount() +
			mapResources.minResources;

		let i = 0;
		while (numResourceToGenerate > i) {
			mapResources.generateResource(i.toString(), point);
			i++;
		}
		expect(mapResources.resourceCount).toEqual(numResourceToGenerate);

		const newResource = new Resource(i.toString(), xPos, yPos, 2, 'BLACK');
		mapResources.resources.add(newResource);

		expect(mapResources.resources.has(newResource)).toEqual(true);
	});
});
