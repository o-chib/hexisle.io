import DestructibleObj from './destructibleObj';
import { Constant } from './constants';
import { Tile } from './hexTiles';

export default class Turret extends DestructibleObj {
	public static readonly RELOAD_TIME = 1 * 1000;

	public tile: Tile;
	public direction: number;
	public reloadTimer: number;
	public hasTarget: boolean;
	private gameShootBullet: (turret: any, direction: number) => void;

	constructor(
		id: string,
		tile: Tile,
		gameShootBulletMethod?: (turret: any, direction: number) => void
	) {
		super(
			id,
			tile.cartesian_coord.xPos,
			tile.cartesian_coord.yPos,
			tile.teamNumber,
			Constant.HP.TURRET
		);
		this.tile = tile;
		this.direction = 0;
		this.reloadTimer = 0;
		this.hasTarget = false;
		if (gameShootBulletMethod) this.gameShootBullet = gameShootBulletMethod;
	}

	public aimAndFireIfPossible(direction: number, timePassed: number) {
		this.aim(direction);
		if (this.canShoot()) this.turretShootBullet();
		else this.reload(timePassed);
	}

	public aim(direction: number) {
		if (direction != Constant.DIRECTION.INVALID) {
			this.direction = direction;
			this.hasTarget = true;
		} else {
			this.hasTarget = false;
		}
	}

	public canShoot(): boolean {
		return this.hasTarget && this.reloadTimer <= 0;
	}

	public turretShootBullet() {
		this.gameShootBullet(this, this.direction);
		this.resetReloadTimer();
	}

	public resetReloadTimer(): void {
		this.reloadTimer = Turret.RELOAD_TIME;
	}

	public reload(timePassed: number): void {
		if (this.reloadTimer > 0) this.reloadTimer -= timePassed;
	}

	public serializeForUpdate(): any {
		return {
			id: this.id,
			xPos: this.xPos,
			yPos: this.yPos,
			teamNumber: this.teamNumber,
			hp: this.hp,
			direction: this.direction,
		};
	}
}
