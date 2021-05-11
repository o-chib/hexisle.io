import { Constant } from './constants';
import IndestructibleObj from './indestructibleObj';

export default class Bullet extends IndestructibleObj {
	public static readonly DAMAGE = 10;
	private static readonly SPEED = 1;
	private static readonly LIFELENGTH = 1 * 1000;

	public id: string;
	public xPos: number;
	public yPos: number;
	public teamNumber: number;
	public speed: number;
	public xVel: number;
	public yVel: number;
	public expirationDate: number;

	constructor(
		id: string,
		xPos: number,
		yPos: number,
		direction: number,
		teamNumber: number
	) {
		super(id, xPos, yPos, teamNumber);
		this.speed = Bullet.SPEED;
		this.xVel = this.speed * Math.cos(direction);
		this.yVel = this.speed * Math.sin(direction);
		this.expirationDate = Date.now() + Bullet.LIFELENGTH;
	}

	public updatePosition(timePassed: number) {
		this.xPos += timePassed * this.xVel;
		this.yPos += timePassed * this.yVel;
	}

	public isExpired(currentDate: number): boolean {
		return this.expirationDate <= currentDate;
	}
}
