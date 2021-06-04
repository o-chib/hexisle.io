import { Constant } from '../../shared/constants';
import Collision from '../collision';
import GameObject from './gameObject';

export default class Bullet extends GameObject {
	public readonly RADIUS = Constant.RADIUS.BULLET;
	public static readonly DAMAGE = 10;
	public static readonly SPEED = 1.2;
	private static readonly LIFELENGTH = 1 * 1000;

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
		this.xVel = Bullet.SPEED * Math.cos(direction);
		this.yVel = Bullet.SPEED * Math.sin(direction);
		this.expirationDate = Date.now() + Bullet.LIFELENGTH;
	}

	public updatePosition(timePassed: number, collision: Collision) {
		collision.deleteCollider(this);
		this.xPos += timePassed * this.xVel;
		this.yPos += timePassed * this.yVel;
		collision.insertCollider(this);
	}

	public isExpired(currentDate: number): boolean {
		return this.expirationDate <= currentDate;
	}
}
