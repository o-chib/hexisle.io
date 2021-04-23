import Turret from '../src/shared/turret';
import { Constant } from '../src/shared/constants';
import { Tile } from '../src/shared/hexTiles';

describe('turret methods', () => {
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

	it('init: shouldnt be able to shoot', () => {
		expect(turret.canShoot()).toEqual(false);
	});

	it('has target, reloadTimer at 0: should be able to shoot', () => {
		turret.hasTarget = true;
		expect(turret.canShoot()).toEqual(true);
	});

	it('has target, reloadTimer negative: should be able to shoot', () => {
		turret.hasTarget = true;
		turret.reloadTimer = -1000;
		expect(turret.canShoot()).toEqual(true);
	});

	it('has target, reloading: shouldnt be able to shoot', () => {
		turret.hasTarget = true;
		turret.reloadTimer = 1;
		expect(turret.canShoot()).toEqual(false);
	});

	it('has no target, not reloading: shouldnt be able to shoot', () => {
		turret.hasTarget = false;
		turret.reloadTimer = 0;
		expect(turret.canShoot()).toEqual(false);
	});

	it('0 hp: shouldnt be alive', () => {
		turret.hp = 0;
		expect(turret.isAlive()).toEqual(false);
	});

	it('negative hp: shouldnt be alive', () => {
		turret.hp = -1000;
		expect(turret.isAlive()).toEqual(false);
	});

	it('has hp: should be alive', () => {
		turret.hp = 1;
		expect(turret.isAlive()).toEqual(true);
	});
});
