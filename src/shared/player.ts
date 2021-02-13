export default class Player { // extends Phaser.Physics.Matter.Sprite
	id: string;
	xPos: number;
	yPos: number;
	xVel: number;
	yVel: number;
	color: string = "0x"+Math.floor(Math.random()*16777215).toString(16);
	socket: SocketIOClient.Socket;

	constructor(socket: SocketIOClient.Socket, xPos: number, yPos: number) {
		this.id = socket.id;
		this.xPos = xPos;
		this.yPos = yPos;
		this.xVel = 0;
		this.yVel = 0;
		this.socket = socket;
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