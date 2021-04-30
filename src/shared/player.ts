import { Constant } from '../shared/constants';
import Collision from './../server/collision';

export default class Player {
	private PLAYER_SPEED = 600;
	lastUpdateTime: number;

	id: string;
	teamNumber: number;
	xPos: number;
	yPos: number;
	private xVel: number;
	private yVel: number;
	private direction: number;
	name: string;

	// Score tracking & player stats
	health: number;
	score: number;
	resources: number;

	socket: SocketIOClient.Socket;

	constructor(socket: SocketIOClient.Socket, teamNumber: number, name = '') {
		this.id = socket.id;
		//this.xPos = 0;
		//this.yPos = 0;
		this.xVel = 0;
		this.yVel = 0;
		this.direction = 0;
		this.teamNumber = teamNumber;
		this.score = 0;
		this.health = 100;
		//this.healthRegen = 1;
		this.socket = socket;
		this.resources = 0;
		this.lastUpdateTime = Date.now();
		this.name = name;
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
			this.xVel = this.PLAYER_SPEED * Math.cos(direction);
			this.yVel = this.PLAYER_SPEED * Math.sin(direction);
		}
	}

	updatePosition(presentTime: number, collision: Collision): void {
		const timePassed = (presentTime - this.lastUpdateTime) / 1000;
		const newX = this.xPos + timePassed * this.xVel;
		const newY = this.yPos - timePassed * this.yVel;
		if (
			!collision.doesObjCollideWithWall(
				newX,
				newY,
				Constant.PLAYER_RADIUS
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

	buyWall(): boolean {
		if (this.resources < Constant.WALL_COST) return false;
		this.updateResource(-Constant.WALL_COST);
		return true;
	}

	refundWall(): void {
		this.updateResource(
			Math.ceil(Constant.WALL_COST * Constant.BUILDING_REFUND_MULTIPLIER)
		);
	}

	serializeForUpdate() {
		return {
			id: this.id,
			xPos: this.xPos,
			yPos: this.yPos,
			name: this.name,
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
