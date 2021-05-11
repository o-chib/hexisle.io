import { Constant } from '../shared/constants';
import { Point } from './hexTiles';
import Collision from './../server/collision';
import DestructibleObj from './destructibleObj';

export default class Player extends DestructibleObj {
	private static readonly SPEED = 600;
	private static readonly RELOAD_TIME = 0.5 * 1000;

	public socket: SocketIOClient.Socket;
	public name: string;
	public resources: number;
	private xVel: number;
	private yVel: number;
	private direction: number;
	private lastUpdateTime: number;

	constructor(socket: SocketIOClient.Socket, teamNumber: number, name = '') {
		super(socket.id, 0, 0, teamNumber, Constant.HP.PLAYER);
		this.socket = socket;
		this.name = name;
		this.resources = 0;
		this.xVel = 0;
		this.yVel = 0;
		this.direction = 0;
		this.lastUpdateTime = Date.now();
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

	public updatePosition(presentTime: number, collision: Collision): void {
		const timePassed = (presentTime - this.lastUpdateTime) / 1000;
		const newX = this.xPos + timePassed * this.xVel;
		const newY = this.yPos - timePassed * this.yVel;
		if (
			!collision.doesObjCollideWithStructure(
				newX,
				newY,
				Constant.RADIUS.PLAYER
			)
		) {
			this.xPos = newX;
			this.yPos = newY;
		} else {
			this.xVel = 0;
			this.yVel = 0;
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
		this.hp = 100;
		this.resources = 0;
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
