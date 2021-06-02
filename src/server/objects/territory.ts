import { Constant } from '../../shared/constants';
import IndestructibleObj from './indestructibleObj';

export default class Territory extends IndestructibleObj {
	public readonly RADIUS = Constant.RADIUS.TERRITORY;

	constructor(id: string, xPos: number, yPos: number, teamNumber: number) {
		super(id, xPos, yPos, teamNumber);
	}
}
