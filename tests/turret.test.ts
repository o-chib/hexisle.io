import Turret from '../src/server/objects/turret';
import { Constant } from '../src/shared/constants';
import { Tile, Point } from '../src/shared/hexTiles';

describe('Turret', () => {
	let turret: Turret;
	beforeEach(() => {
		const tile = new Tile(Constant.BUILDING.TURRET, 0);
		tile.cartesian_coord = new Point(0, 0);
		turret = new Turret('0', tile);
	});

	it('aiming with invalid direction: has no target', () => {
		turret.aim(Constant.DIRECTION.INVALID);
		expect(turret.hasTarget).toEqual(false);
	});

	it('aiming with valid direction: has target and given direction', () => {
		turret.aim(1);
		expect(turret.hasTarget).toEqual(true);
		expect(turret.direction).toEqual(1);
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

	it('shot: should be reloading', () => {
		turret.resetReloadTimer();
		expect(turret.reloadTimer).toEqual(Turret.RELOAD_TIME);
	});

	it('reloading after a shot: timer decrements', () => {
		turret.reloadTimer = Turret.RELOAD_TIME;
		turret.reload(10);
		expect(turret.reloadTimer).toEqual(Turret.RELOAD_TIME - 10);
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
