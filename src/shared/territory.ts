import { OffsetPoint } from './hexTiles';
const Constant = require('../shared/constants');

export default class Territory {
	public id: string;
    public xPos: number;
    public yPos: number;
	public teamNumber: number;

	constructor(
		id: string,
		xPos: number,
        yPos: number,
		teamNumber: number,
	) {
		this.id = id;
		this.xPos = xPos;
        this.yPos = yPos;
		this.teamNumber = teamNumber;
	}

	serializeForUpdate(): any {
		return {
			id: this.id,
            xPos: this.xPos,
            yPos: this.yPos,
			teamNumber: this.teamNumber,
		};
	}

}
