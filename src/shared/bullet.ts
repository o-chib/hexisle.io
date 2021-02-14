export default class Bullet {
	id: string;
	xPos: number;
	yPos: number;
	xVel: number;
	yVel: number;
	expirationDate: number;
	
	speed: number = 1000;
	lifeLength: number = 1000;

	constructor(id: string, xPos: number, yPos: number, direction: number) {
		this.id = id;
		this.xPos = xPos;
		this.yPos = yPos;
		this.xVel = this.speed * Math.sin(direction);
		this.yVel = this.speed * Math.cos(direction);
		this.expirationDate = Date.now() + this.lifeLength;
	}

	updatePosition(timePassed: number) {
		this.xPos += timePassed * this.xVel;
		this.yPos += timePassed * this.yVel;
	}
	
	serializeForUpdate() {
		return {
			id: this.id,
			xPos: this.xPos,
			yPos: this.yPos
		};
	}

	isExpired(currentDate: number) : boolean {
		return this.expirationDate <= currentDate;
	}
}