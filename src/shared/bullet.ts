export default class Bullet {
	id: string;
	xPos: number;
	yPos: number;
	xVel: number;
	yVel: number;
	speed: number = 3;

	constructor(xPos: number, yPos: number, direction: number) {
		this.xPos = xPos;
		this.yPos = yPos;
		this.xVel = this.speed * Math.sin(direction);
		this.yVel = this.speed * Math.cos(direction);
	}

	updatePosition(timePassed: number) {
		this.xPos += timePassed * this.xVel;
		this.yPos += timePassed * this.yVel;
	}
	
	serializeForUpdate() {
		return {
			xPos: this.xPos,
			yPos: this.yPos
		};
	}
}