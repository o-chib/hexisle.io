import { Constant } from '../../shared/constants';
import GameObject from './gameObject';

export class Resource extends GameObject {
	public readonly RADIUS = Constant.RADIUS.RESOURCE;
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
