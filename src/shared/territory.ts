import IndestructibleObj from './indestructibleObj';

export default class Territory extends IndestructibleObj {
	constructor(id: string, xPos: number, yPos: number, teamNumber: number) {
		super(id, xPos, yPos, teamNumber);
	}
}
