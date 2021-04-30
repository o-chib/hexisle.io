import { Constant } from './constants';
import { Tile } from './hexTiles';

export default class Turret {
	id: string;
	xPos: number;
	yPos: number;
	direction: number;
	teamNumber: number;
	tile: Tile;
	hp: number;
	reloadTimer: number;
	hasTarget: boolean;
	gameShootBullet: (turret: Turret) => void;

	constructor(
		id: string,
		tile: Tile,
		gameShootBulletMethod?: (turret: Turret) => void
	) {
		this.id = id;
		this.xPos = tile.cartesian_coord.xPos;
		this.yPos = tile.cartesian_coord.yPos;
		this.direction = 0;
		this.teamNumber = tile.team;
		this.tile = tile;
		this.hp = Constant.HP.TURRET;
		this.reloadTimer = 0;
		this.hasTarget = false;
		if (gameShootBulletMethod) this.gameShootBullet = gameShootBulletMethod;
	}

	aimAndFireIfPossible(direction: number, timePassed: number) {
		this.aim(direction);
		if (this.canShoot()) this.turretShootBullet();
		else this.reload(timePassed);
	}

	aim(direction: number) {
		if (direction != Constant.DIRECTION.INVALID) {
			this.direction = direction;
			this.hasTarget = true;
		} else {
			this.hasTarget = false;
		}
	}

	canShoot(): boolean {
		return this.hasTarget && this.reloadTimer <= 0;
	}

	turretShootBullet() {
		this.gameShootBullet(this);
	}

	resetReloadTimer(): void {
		this.reloadTimer = Constant.TIMING.TURRET_RELOAD_TIME;
	}

	reload(timePassed: number): void {
		this.reloadTimer -= timePassed;
	}

	serializeForUpdate(): any {
		return {
			id: this.id,
			xPos: this.xPos,
			yPos: this.yPos,
			direction: this.direction,
			hp: this.hp,
			teamNumber: this.teamNumber,
		};
	}

	isAlive(): boolean {
		return this.hp > 0;
	}
}
