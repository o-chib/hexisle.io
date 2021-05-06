import IndestructibleObj from './indestructibleObj';

export default class Territory extends IndestructibleObj {
	public id: string;
	public xPos: number;
	public yPos: number;
	public teamNumber: number;

	constructor(id: string, xPos: number, yPos: number, teamNumber: number) {
		super(id, xPos, yPos, teamNumber);
	}
}
