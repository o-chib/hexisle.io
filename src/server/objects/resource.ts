import { Constant } from '../../shared/constants';
import IndestructibleObj from './indestructibleObj';

export class Resource extends IndestructibleObj {
	public dropAmount: number;
	public type: string;

	constructor(id: string, xPos: number, yPos: number, type: string) {
		super(id, xPos, yPos, Constant.TEAM.NONE);
		this.dropAmount = Constant.RESOURCE.DROP_AMOUNT[type];
		this.type = type;
	}

	serializeForUpdate(): any {
		return {
			id: this.id,
			xPos: this.xPos,
			yPos: this.yPos,
			dropAmount: this.dropAmount,
			type: this.type,
		};
	}
}
