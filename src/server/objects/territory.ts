import { Constant } from '../../shared/constants';
import GameObject from './gameObject';

export default class Territory extends GameObject {
	public readonly RADIUS = Constant.RADIUS.TERRITORY;

	constructor(id: string, xPos: number, yPos: number, teamNumber: number) {
		super(id, xPos, yPos, teamNumber);
	}
}
