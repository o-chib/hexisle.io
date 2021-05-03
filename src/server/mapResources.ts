import { Point } from '../shared/hexTiles';
import { Constant } from '../shared/constants';

export class MapResources {
	public updateTimer: number;
	public minResources: number;
	public maxResources: number;
	public resourceCount: number;
	public resources: Set<Resource>;
	private gameAddResources: (numResource: number) => void;

	constructor(gameAddResources?: (numResource: number) => void) {
		this.updateTimer = Constant.RESOURCE.UPDATE_RATE;
		this.minResources = Constant.RESOURCE.MIN_RESOURCES;
		this.maxResources = Constant.RESOURCE.MAX_RESOURCES;
		this.resourceCount = 0;
		this.resources = new Set();
		if (gameAddResources) this.gameAddResources = gameAddResources;
	}

	updateMapResourcesIfPossible(timePassed: number): void {
		if (this.canUpdateMapResources()) {
			this.resetUpdateTimer();
			const numResourcesToGenerate = this.getRandomResourceGenerationCount();
			this.gameAddResources(numResourcesToGenerate);
		} else {
			this.decrementUpdateTimer(timePassed);
		}
	}

	deleteResource(resource: Resource) {
		this.resources.delete(resource);
		this.resourceCount--;
	}

	getRandomResourceGenerationCount(): number {
		let resourceNum: number = Math.floor(
			Math.random() * (this.maxResources - this.resourceCount)
		);
		if (this.resourceCount + resourceNum < this.minResources) {
			resourceNum +=
				this.minResources - (this.resourceCount + resourceNum);
		}
		return resourceNum;
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

	private getRandomResourceType(): string {
		const resourceID = this.getRandomResourceID();
		return Constant.RESOURCE.RESOURCE_NAME[resourceID];
	}

	private getRandomResourceID(): number {
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

	private calculateDropAmount(type: string): number {
		return Constant.RESOURCE.DROP_AMOUNT[type];
	}

	private canUpdateMapResources(): boolean {
		return this.resourceCount < this.maxResources && this.updateTimer <= 0;
	}

	private resetUpdateTimer(): void {
		this.updateTimer = Constant.RESOURCE.UPDATE_RATE;
	}

	private decrementUpdateTimer(timePassed: number): void {
		this.updateTimer -= timePassed;
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
