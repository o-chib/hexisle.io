import { Constant } from '../shared/constants';
import Collision from './../server/collision';
import DestructibleObj from './destructibleObj';

export default class Player extends DestructibleObj {
	public id: string;
	public xPos: number;
	public yPos: number;
	public teamNumber: number;
	public socket: SocketIOClient.Socket;
	private xVel: number;
	private yVel: number;
	private direction: number;
	private speed: number;
	private lastUpdateTime: number;

	// Score tracking & player stats
	public hp: number;
	public score: number;
	public resources: number;

	constructor(
		socket: SocketIOClient.Socket,
		xPos: number,
		yPos: number,
		teamNumber: number
	) {
		super(socket.id, xPos, yPos, teamNumber, Constant.HP.PLAYER);
		this.socket = socket;
		this.xVel = 0;
		this.yVel = 0;
		this.direction = 0;
		this.speed = 600;
		this.lastUpdateTime = Date.now();
		this.score = 0;
		this.resources = 0;
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
			this.xVel = this.speed * Math.cos(direction);
			this.yVel = this.speed * Math.sin(direction);
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

	public serializeForUpdate() {
		return {
			id: this.id,
			xPos: this.xPos,
			yPos: this.yPos,
			teamNumber: this.teamNumber,
			hp: this.hp,
			xVel: this.xVel,
			yVel: this.yVel,
			direction: this.direction,
			score: this.score,
			resources: this.resources,
		};
	}
}
