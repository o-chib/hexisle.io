export default class Player { // extends Phaser.Physics.Matter.Sprite
	id: string;
	xPos: number;
	yPos: number;
	xVel: number;
	yVel: number;
	teamNumber: number;
	socket: SocketIOClient.Socket;

	constructor(socket: SocketIOClient.Socket, xPos: number, yPos: number, teamNumber: number) {
		this.id = socket.id;
		this.xPos = xPos;
		this.yPos = yPos;
		this.xVel = 0;
		this.yVel = 0;
		this.socket = socket;
		this.teamNumber = teamNumber;
	}

	serializeForUpdate() {
		return {
			id: this.id,
			xPos: this.xPos,
			yPos: this.yPos
			//hp: this.hp,
		};
	}
}