import Turret from '../src/shared/turret';
import { Constant } from '../src/shared/constants';
import { Tile } from '../src/shared/hexTiles';

describe('Turret', () => {
	let turret: Turret;
	beforeEach(() => {
		turret = new Turret(
			'0',
			0,
			0,
			0,
			new Tile(Constant.BUILDING.TURRET, 0)
		);
	});

	it('on init: cannot shoot', () => {
		expect(turret.canShoot()).toEqual(false);
	});

	it('has target, reloadTimer at 0: can shoot', () => {
		turret.hasTarget = true;
		expect(turret.canShoot()).toEqual(true);
	});

	it('has target, reloadTimer negative: can shoot', () => {
		turret.hasTarget = true;
		turret.reloadTimer = -1000;
		expect(turret.canShoot()).toEqual(true);
	});

	it('has target, reloading: cannot shoot', () => {
		turret.hasTarget = true;
		turret.reloadTimer = 1;
		expect(turret.canShoot()).toEqual(false);
	});

	it('has no target, not reloading: cannot shoot', () => {
		turret.hasTarget = false;
		turret.reloadTimer = 0;
		expect(turret.canShoot()).toEqual(false);
	});

	it('at 0 hp: is not alive', () => {
		turret.hp = 0;
		expect(turret.isAlive()).toEqual(false);
	});

	it('at negative hp: is not alive', () => {
		turret.hp = -1000;
		expect(turret.isAlive()).toEqual(false);
	});

	it('has hp: is alive', () => {
		turret.hp = 1;
		expect(turret.isAlive()).toEqual(true);
	});
});
