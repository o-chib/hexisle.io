import { Point } from '../shared/hexTiles';
import { Constant } from '../shared/constants';

export class ResourceSystem {
	public previousPassiveUpdateTimestamp: number;
	public previousMapUpdateTimestamp: number;
	public minResource: number;
	public maxResource: number;
	public resourceCount: number;
	public resources: Set<Resource>;

	constructor() {
		this.previousUpdateTimestamp = Date.now();
		this.minResource = Constant.RESOURCE.MIN_RESOURCES;
		this.maxResource = Constant.RESOURCE.MAX_RESOURCES;
		this.resourceCount = 0;
		this.resources = new Set();
	}

	updateMapResources(currentTimestamp: number, timePassed: number): boolean {
		if (
			this.resourceCount < this.maxResource &&
			timePassed >= Constant.RESOURCE.UPDATE_RATE
		) {
			this.previousUpdateTimestamp = currentTimestamp;
			return true;
		}
		return false;
	}

	getRandomResourceGenerationCount(): number {
		return (
			Math.floor(Math.random() * (this.maxResource - this.minResource)) +
			1
		);
	}

	generateResource(resourceID: string, randomPoint: Point): Resource {
		const type = this.getRandomResourceType();
		const dropAmount = this.calculateDropAmount(type);
		const newResource: Resource = new Resource(
			resourceID,
			randomPoint.xPos,
			randomPoint.yPos,
			dropAmount,
			type
		);
		this.resources.add(newResource);
		this.resourceCount++;
		return newResource;
	}

	getRandomResourceType(): string {
		const resourceID = this.getRandomResourceID();
		return Constant.RESOURCE.RESOURCE_NAME[resourceID];
	}

	getRandomResourceID(): number {
		const num = Math.random();
		let rarity = 0;
		const lastIndex = Constant.RESOURCE.RESOURCE_ID.length - 1;

		for (let i = 0; i < lastIndex; i++) {
			rarity += Constant.RESOURCE.RESOURCE_RARITY[i];
			if (num < rarity) {
				return Constant.RESOURCE.RESOURCE_ID[i];
			}
		}

		return Constant.RESOURCE.RESOURCE_ID[lastIndex];
	}

	calculateDropAmount(type: string): number {
		return Constant.RESOURCE.DROP_AMOUNT[type];
	}

	deleteResource(resource: Resource) {
		this.resources.delete(resource);
		this.resourceCount--;
	}
}

export class Resource {
	public id: string;
	public xPos: number;
	public yPos: number;
	public dropAmount: number;
	public type: string;

	constructor(
		id: string,
		xPos: number,
		yPos: number,
		dropAmount: number,
		type: string
	) {
		this.id = id;
		this.xPos = xPos;
		this.yPos = yPos;
		this.dropAmount = dropAmount;
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
