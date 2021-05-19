import Player from '../src/server/objects/player';
import * as SocketIOClient from 'socket.io-client';
import { Constant } from '../src/shared/constants';

describe('Player', () => {
	let player: Player;
	beforeEach(() => {
		const socket = SocketIOClient.connect('http://localhost', {
			port: '80',
		});
		player = new Player(socket, 0);
	});

	it('can afford wall and turret', () => {
		player.resources = Constant.COST.TURRET;
		expect(player.canAffordStructure(Constant.BUILDING.WALL)).toEqual(true);
		expect(player.canAffordStructure(Constant.BUILDING.TURRET)).toEqual(
			true
		);
	});

	it('cannot afford turret, can afford wall', () => {
		player.resources = Constant.COST.WALL;
		expect(player.canAffordStructure(Constant.BUILDING.WALL)).toEqual(true);
		expect(player.canAffordStructure(Constant.BUILDING.TURRET)).toEqual(
			false
		);
	});

	it('cannot affort either wall or turret', () => {
		player.resources = Constant.COST.WALL - 1;
		expect(player.canAffordStructure(Constant.BUILDING.WALL)).toEqual(
			false
		);
		expect(player.canAffordStructure(Constant.BUILDING.TURRET)).toEqual(
			false
		);
	});

	it('buy wall: has proper amount of resources', () => {
		player.resources = Constant.COST.WALL;
		player.buyStructure(Constant.BUILDING.WALL);
		expect(player.resources).toEqual(0);
	});

	it('buy turret: has proper amount of resources', () => {
		player.resources = Constant.COST.TURRET;
		player.buyStructure(Constant.BUILDING.TURRET);
		expect(player.resources).toEqual(0);
	});

	it('refund wall: has proper amount of resources', () => {
		player.refundStructure(Constant.BUILDING.WALL);
		const expectedResources: number = Math.ceil(
			Constant.COST.WALL * Constant.COST.BUILDING_REFUND_MULTIPLIER
		);
		expect(player.resources).toEqual(expectedResources);
	});

	it('refund turret: has proper amount of resources', () => {
		player.refundStructure(Constant.BUILDING.TURRET);
		const expectedResources: number = Math.ceil(
			Constant.COST.TURRET * Constant.COST.BUILDING_REFUND_MULTIPLIER
		);
		expect(player.resources).toEqual(expectedResources);
	});

	it('reloadTimer at 0 (init): can shoot', () => {
		expect(player.canShoot()).toEqual(true);
	});

	it('reloadTimer negative: can shoot', () => {
		player.reloadTimer = -1000;
		expect(player.canShoot()).toEqual(true);
	});

	it('reloading: cannot shoot', () => {
		player.reloadTimer = 1;
		expect(player.canShoot()).toEqual(false);
	});

	it('just shot: should be reloading', () => {
		player.resetReloadTimer();
		expect(player.reloadTimer).toEqual(Player.RELOAD_TIME);
	});

	it('reloading after a shot: timer decrements', () => {
		player.reloadTimer = Player.RELOAD_TIME;
		player.reload(10);
		expect(player.reloadTimer).toEqual(Player.RELOAD_TIME - 10);
	});

	it('at 0 hp: is not alive', () => {
		player.hp = 0;
		expect(player.isAlive()).toEqual(false);
	});

	it('at negative hp: is not alive', () => {
		player.hp = -1000;
		expect(player.isAlive()).toEqual(false);
	});

	it('has hp: is alive', () => {
		player.hp = 1;
		expect(player.isAlive()).toEqual(true);
	});
});
