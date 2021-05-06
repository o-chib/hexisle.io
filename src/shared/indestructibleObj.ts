export default class IndestructibleObj {
	public id: string;
	public xPos: number;
	public yPos: number;
	public teamNumber: number;

	constructor(id: string, xPos = 0, yPos = 0, teamNumber = -1) {
		this.id = id;
		this.xPos = xPos;
		this.yPos = yPos;
		this.teamNumber = teamNumber;
	}

	public serializeForUpdate() {
		return {
			id: this.id,
			xPos: this.xPos,
			yPos: this.yPos,
			teamNumber: this.teamNumber,
		};
	}
}
