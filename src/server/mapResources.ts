import { Point } from '../shared/hexTiles';
import { Constant } from '../shared/constants';

export class MapResources {
	private readonly INITIAL_RESOURCES: number;
	private readonly MAX_RESOURCES: number;
	private updateTimer: number;
	private resourceCount: number;
	public resources: Set<Resource>;
	private gameAddResource: () => void;

	constructor(gameAddResource?: () => void) {
		this.INITIAL_RESOURCES = Constant.RESOURCE.INITIAL_RESOURCES;
		this.MAX_RESOURCES = Constant.RESOURCE.MAX_RESOURCES;
		this.resourceCount = 0;
		this.resources = new Set();
		if (gameAddResource) this.gameAddResource = gameAddResource;
		this.resetUpdateTimer();
	}

	public addInitialResources(): void {
		for (let i = 0; i < this.INITIAL_RESOURCES; i++) {
			this.gameAddResource();
		}
	}

	public updateMapResourcesIfPossible(timePassed: number): void {
		if (!this.canUpdateMapResources()) {
			this.decrementUpdateTimer(timePassed);
			return;
		}

		const numResourcesToGenerate = this.getRandomResourceGenerationCount();

		for (let i = 0; i < numResourcesToGenerate; i++) {
			this.gameAddResource();
		}

		this.resetUpdateTimer();
	}

	public deleteResource(resource: Resource) {
		this.resources.delete(resource);
		this.resourceCount--;
	}

	private getRandomResourceGenerationCount(): number {
		let resourceNum: number = Math.floor(
			Math.random() * (Constant.RESOURCE.MAX_RESOURCES_PER_UPDATE + 1)
		);

		if (this.resourceCount + resourceNum > this.MAX_RESOURCES)
			resourceNum = this.MAX_RESOURCES - this.resourceCount;

		return resourceNum;
	}

	public generateResource(resourceID: string, randomPoint: Point): Resource {
		const type = this.getRandomResourceType();
		const newResource: Resource = new Resource(
			resourceID,
			randomPoint.xPos,
			randomPoint.yPos,
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

	private canUpdateMapResources(): boolean {
		return this.resourceCount < this.MAX_RESOURCES && this.updateTimer <= 0;
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

	constructor(id: string, xPos: number, yPos: number, type: string) {
		this.id = id;
		this.xPos = xPos;
		this.yPos = yPos;
		this.type = type;
		this.dropAmount = Constant.RESOURCE.DROP_AMOUNT[type];
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
