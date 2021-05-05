import IndestructibleObj from "./indestructibleObj";

export default class DestructibleObj extends IndestructibleObj {
	public id: string;
	public xPos: number;
	public yPos: number;
	public teamNumber: number;
	public hp: number;

	constructor(
		id: string,
		xPos: number = 0,
		yPos: number = 0,
		teamNumber: number = -1,
		hp: number = 0
	) {
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
