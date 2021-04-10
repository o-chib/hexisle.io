import Bullet from '../src/shared/bullet';
const Constant = require('../src/shared/constants');

describe('Bullet', () => {
	it('should move at right speed', () => {
		const x = 1;
		const y = 1;
		const bullet = new Bullet('0', x, y, Constant.DIRECTION.N, 0);

		expect(bullet.yPos).toEqual(y);

		bullet.updatePosition(100);

		expect(bullet.yPos).toEqual(y + bullet.speed * 100);
	});
});
