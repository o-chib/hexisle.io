export default class Player {
	// extends Phaser.Physics.Matter.Sprite
	lastUpdateTime: number;

	id: string;
	xPos: number;
	yPos: number;
	xVel: number;
	yVel: number;
	direction: number;
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
		this.updatePosition(Date.now());
	}

	updatePosition(presentTime: number): void {
		const timePassed = (presentTime - this.lastUpdateTime) / 1000;
		this.xPos += timePassed * this.xVel;
		this.yPos -= timePassed * this.yVel;
		this.lastUpdateTime = presentTime;
	}

    updateMovementFromPlayer(player: Player): void {
        this.xPos = player.xPos;
        this.xPos = player.yPos;
        this.xVel = player.xVel;
        this.yVel = player.yVel;
        this.lastUpdateTime = player.lastUpdateTime;
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
