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

	constructor(
		id: string,
		xPos: number,
		yPos: number,
		teamNumber: number,
		tile: Tile
	) {
		this.id = id;
		this.xPos = xPos;
		this.yPos = yPos;
		this.direction = 0;
		this.teamNumber = teamNumber;
		this.tile = tile;
		this.hp = Constant.HP.TURRET;
		this.reloadTimer = 0;
	}

	canShoot() {
		return this.reloadTimer > 0;
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
