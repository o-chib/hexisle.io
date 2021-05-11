import IndestructibleObj from './indestructibleObj';

export default class DestructibleObj extends IndestructibleObj {
	public hp: number;

	constructor(id: string, xPos = 0, yPos = 0, teamNumber = -1, hp = 0) {
		super(id, xPos, yPos, teamNumber);
		this.hp = hp;
	}

	public isAlive(): boolean {
		return this.hp > 0;
	}

	public serializeForUpdate() {
		return {
			id: this.id,
			xPos: this.xPos,
			yPos: this.yPos,
			teamNumber: this.teamNumber,
			hp: this.hp,
		};
	}
}
