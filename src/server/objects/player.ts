import { Constant } from '../../shared/constants';
import { Point } from '../hexTiles';
import Collision from '../collision';
import { MapResources } from '../mapResources';
import DestructibleObj from './destructibleObj';
import * as SocketIO from 'socket.io';

export default class Player extends DestructibleObj {
	public readonly RADIUS = Constant.RADIUS.PLAYER;
	public static readonly RELOAD_TIME = 0.16 * 1000;
	public static readonly RESPAWN_TIME = 3000;
	private static readonly SPEED = 600;

	public socket: SocketIO.Socket;
	public name: string;
	public resources: number;
	public reloadTimer: number;
	private respawnTimer: number;
	private xVel: number;
	private yVel: number;
	private direction: number;
	private lastUpdateTime: number;
	private gameShootBullet: (turret: any, direction: number) => void;
	private respawning: boolean;

	constructor(
		socket: SocketIO.Socket,
		teamNumber: number,
		name = '',
		gameShootBulletMethod?: (turret: any, direction: number) => void
	) {
		super(socket.id, 0, 0, teamNumber, Constant.HP.PLAYER);
		this.socket = socket;
		this.name = name;
		this.resources = 0;
		this.xVel = 0;
		this.yVel = 0;
		this.reloadTimer = Player.RELOAD_TIME;
		this.direction = 0;
		this.lastUpdateTime = Date.now();
		if (gameShootBulletMethod) this.gameShootBullet = gameShootBulletMethod;
		this.respawning = false;
	}

	public updateResource(resourceValue: number) {
		this.resources += resourceValue;
	}

	public updateDirection(newDirection: number): void {
		this.direction = newDirection;
	}

	public updateVelocity(direction: number): void {
		if (direction == null) {
			this.xVel = 0;
			this.yVel = 0;
		} else {
			this.xVel = Player.SPEED * Math.cos(direction);
			this.yVel = Player.SPEED * Math.sin(direction);
		}
	}

	public setNoVelocity(): void {
		this.xVel = 0;
		this.yVel = 0;
	}

	public updatePosition(
		presentTime: number,
		collision: Collision,
		mapResources: MapResources
	): void {
		const timePassed = (presentTime - this.lastUpdateTime) / 1000;
		const newX = this.xPos + timePassed * this.xVel;
		const newY = this.yPos - timePassed * this.yVel;
		if (!(this.xVel == 0 && this.yVel == 0)) {
			if (
				!collision.updatePlayerPosition(newX, newY, mapResources, this)
			) {
				this.xVel = 0;
				this.yVel = 0;
			}
		}
		this.lastUpdateTime = presentTime;
	}

	public canAffordStructure(building: string) {
		const cost: number = Constant.COST[building];
		if (this.resources < cost) return false;
		return true;
	}

	public buyStructure(building: string): void {
		const cost: number = Constant.COST[building];
		this.updateResource(-cost);
	}

	public refundStructure(building: string): void {
		const cost: number = Constant.COST[building];
		this.updateResource(
			Math.ceil(cost * Constant.COST.BUILDING_REFUND_MULTIPLIER)
		);
	}

	public respawn(respawnPoint: Point) {
		this.xPos = respawnPoint.xPos;
		this.yPos = respawnPoint.yPos;
		this.hp = Constant.HP.PLAYER;
		this.resources = 0;
		this.respawning = false;
		this.lastUpdateTime = Date.now();
	}

	public canShoot(): boolean {
		return this.reloadTimer <= 0;
	}

	public shootBullet(direction: number) {
		if (!this.canShoot()) return;
		this.gameShootBullet(this, direction);
		this.resetReloadTimer();
	}

	public resetReloadTimer(): void {
		this.reloadTimer = Player.RELOAD_TIME;
	}

	public reload(timePassed: number): void {
		if (this.reloadTimer > 0) this.reloadTimer -= timePassed;
	}

	public canRespawn(timePassed: number, collision: Collision): boolean {
		// Run when they first die
		if (!this.respawning) {
			this.respawning = true;
			this.respawnTimer = 0;
			this.setNoVelocity();
			collision.deleteCollider(this);
			return false;
		}

		this.setNoVelocity();
		this.respawnTimer += timePassed;
		return this.respawnTimer >= Player.RESPAWN_TIME;
	}

	public serializeForUpdate() {
		return {
			id: this.id,
			xPos: this.xPos,
			yPos: this.yPos,
			teamNumber: this.teamNumber,
			hp: this.hp,
			name: this.name,
			resources: this.resources,
			xVel: this.xVel,
			yVel: this.yVel,
			direction: this.direction,
		};
	}
}
