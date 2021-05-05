import { GameObjects } from "phaser";
import { Constant } from "./constants";
import IndestructibleObj from "./indestructibleObj";

export default class Bullet extends IndestructibleObj {
	public id: string;
	public xPos: number;
	public yPos: number;
	public teamNumber: number;
	public xVel: number;
	public yVel: number;
	public expirationDate: number;
	private speed: number;
	private lifeLength: number;

	constructor(
		id: string,
		xPos: number,
		yPos: number,
		direction: number,
		teamNumber: number
	) {
		super(id, xPos, yPos, teamNumber);
		this.xVel = this.speed * Math.cos(direction);
		this.yVel = this.speed * Math.sin(direction);
		this.expirationDate = Date.now() + this.lifeLength;
		this.speed = Constant.OBJS.BULLET.SPEED;
		this.lifeLength = Constant.OBJS.BULLET.LIFELENGTH;
	}

	public updatePosition(timePassed: number) {
		this.xPos += timePassed * this.xVel;
		this.yPos += timePassed * this.yVel;
	}

	public isExpired(currentDate: number): boolean {
		return this.expirationDate <= currentDate;
	}
}
