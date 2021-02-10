export default class Player { // extends Phaser.Physics.Matter.Sprite
	socketId: string;
	xPos: number;
	yPos: number;
	xVel: number;
	yVel: number;
	color: string = "0x"+Math.floor(Math.random()*16777215).toString(16);
	direction: number;

	constructor(socketId: string, xPos: number, yPos: number) {
		this.socketId = socketId;
		this.xPos = xPos;
		this.yPos = yPos;
		this.xVel = 0;
		this.yVel = 0;
		this.direction = 0;
	}

	serializeForUpdate() {
		return {
			socketId: this.socketId,
			xPos: this.xPos,
			yPos: this.yPos
			//direction: this.direction,
			//hp: this.hp,
		};
	}
}