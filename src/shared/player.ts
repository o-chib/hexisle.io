import { Constant } from '../shared/constants';
import Collision from './../server/collision';

export default class Player {
	// extends Phaser.Physics.Matter.Sprite
	lastUpdateTime: number;

	id: string;
	xPos: number;
	yPos: number;
	private xVel: number;
	private yVel: number;
	private direction: number;
	teamNumber: number;
	speed: number;

	// Score tracking & player stats
	health: number;
	score: number;
	resources: number;

	socket: SocketIOClient.Socket;

	constructor(
		socket: SocketIOClient.Socket,
		xPos: number,
		yPos: number,
		teamNumber: number
	) {
		this.id = socket.id;
		this.xPos = xPos;
		this.yPos = yPos;
		this.xVel = 0;
		this.yVel = 0;
		this.direction = 0;
		this.teamNumber = teamNumber;
		this.score = 0;
		this.health = Constant.HP.PLAYER;
		//this.healthRegen = 1;
		this.speed = 600;
		this.socket = socket;
		this.resources = 0;
		this.lastUpdateTime = Date.now();
	}

	updateResource(resourceValue: number) {
		this.resources += resourceValue;
	}

	updateDirection(newDirection: number): void {
		this.direction = newDirection;
	}

	updateVelocity(direction: number): void {
		if (direction == null) {
			this.xVel = 0;
			this.yVel = 0;
		} else {
			this.xVel = this.speed * Math.cos(direction);
			this.yVel = this.speed * Math.sin(direction);
		}
	}

	setNoVelocity(): void {
		this.xVel = 0;
		this.yVel = 0;
	}

	updatePosition(presentTime: number, collision: Collision): void {
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

	canAffordStructure(building: string) {
		const cost: number = Constant.COST[building];
		if (this.resources < cost) return false;
		return true;
	}

	buyStructure(building: string): void {
		const cost: number = Constant.COST[building];
		this.updateResource(-cost);
	}

	refundStructure(building: string): void {
		const cost: number = Constant.COST[building];
		this.updateResource(
			Math.ceil(cost * Constant.COST.BUILDING_REFUND_MULTIPLIER)
		);
	}

	serializeForUpdate() {
		return {
			id: this.id,
			xPos: this.xPos,
			yPos: this.yPos,
			direction: this.direction,
			health: this.health,
			resources: this.resources,
			score: this.score,
			teamNumber: this.teamNumber,
			xVel: this.xVel,
			yVel: this.yVel,
		};
	}
}
