import { Point } from './../src/shared/hexTiles';
import { ResourceSystem, Resource } from './../src/shared/resources'
import { Constant } from './../src/shared/constants';

describe('Resource', () => {
	it('should generate correct resourceCount', () => {
        const resourceSystem = new ResourceSystem();
        const xPos = 1;
        const yPos = 1;
		const point = new Point(xPos, yPos);
        const numResourceToGenerate = resourceSystem.getRandomResourceGenerationCount()
										+ resourceSystem.minResource;

        let i = 0;
        while(numResourceToGenerate > i) {
            resourceSystem.generateResource(i.toString(), point);
            i++;
        }
		expect(resourceSystem.resourceCount).toEqual(numResourceToGenerate);

        const newResource = new Resource(i.toString(), xPos, yPos, 2, 'BLACK');
        resourceSystem.resources.add(newResource);

        expect(resourceSystem.resources.has(newResource)).toEqual(true);
	});
});
