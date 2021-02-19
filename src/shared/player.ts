export default class Player { // extends Phaser.Physics.Matter.Sprite
	id: string;
	xPos: number;
	yPos: number;
	xVel: number;
	yVel: number;
	direction: number;
	teamNumber: number;

	// Score tracking & player stats
	score: number;
	health: number;
		
	socket: SocketIOClient.Socket;

	constructor(socket: SocketIOClient.Socket, xPos: number, yPos: number, teamNumber: number) {
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
		this.socket = socket;
	}

	updateDirection(newDirection: number) {
		this.direction = newDirection;
	}

	serializeForUpdate() {
		return {
			id: this.id,
			xPos: this.xPos,
			yPos: this.yPos,
			direction: this.direction,
			score: this.score,
			health: this.health
		};
	}
}