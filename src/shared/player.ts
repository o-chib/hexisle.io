const Constant = require('../shared/constants');
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
	score: number;
	health: number;

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
		this.health = 100;
		//this.healthRegen = 1;
		this.speed = 600;
		this.socket = socket;
		this.lastUpdateTime = Date.now();
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

	serializeForUpdate() {
		return {
			id: this.id,
			xPos: this.xPos,
			yPos: this.yPos,
			direction: this.direction,
			score: this.score,
			health: this.health,
			teamNumber: this.teamNumber,
		};
	}
}
