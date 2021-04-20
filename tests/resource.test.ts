import { Point } from './../src/shared/hexTiles';
import { ResourceSystem, Resource } from './../src/shared/resources'
import { Constant } from './../src/shared/constants';

describe('Bullet', () => {
	it('should move at right speed', () => {
        const resourceSystem = new ResourceSystem();
        const xPos = 1;
        const yPos = 1;
		const point = new Point(xPos, yPos);
        const numResourceToGenerate = resourceSystem.getRandomResourceGenerationCount()
										+ resourceSystem.minResource;

        let i = 0;
        while(numResourceToGenerate > i) {
            resourceSystem.generateResource(point);
            i++;
        }
		expect(resourceSystem.resourceCount).toEqual(numResourceToGenerate);

        const newResource = new Resource(point, 2, 'BLACK');
        resourceSystem.resources.add(newResource);

        expect(resourceSystem.resources.has(newResource)).toEqual(true);
	});
});
