import { Point } from './hexTiles';
import { Constant } from '../shared/constants';
import { Resource } from './objects/resource';
import Game from './game';

export class MapResources {
	private readonly INITIAL_RESOURCES: number;
	private readonly MAX_RESOURCES: number;
	private game: Game;
	private updateTimer: number;
	private resourceCount: number;
	public resources: Set<Resource>;

	constructor(game: Game) {
		this.INITIAL_RESOURCES = Constant.RESOURCE.INITIAL_RESOURCES;
		this.MAX_RESOURCES = Constant.RESOURCE.MAX_RESOURCES;
		this.resourceCount = 0;
		this.resources = new Set();
		this.resetUpdateTimer();
		this.game = game;
	}

	private addResource(): void {
		const randomPoint = this.getRandomEmptyPointOnMap();
		if (!randomPoint) return;

		const newResource: Resource = this.generateResource(
			this.game.idGenerator.newID(),
			randomPoint
		);

		this.game.collision.insertCollider(newResource);
	}

	private getRandomEmptyPointOnMap(): Point | null {
		let loopLimit = Constant.RANDOM_LOOP_LIMIT;
		let point: Point;

		do {
			if (loopLimit <= 0) return null;
			point = this.getRandomMapPoint();
			loopLimit--;
		} while (!this.game.hexTileMap.checkIfValidEmptyPointOnGrid(point));

		return point;
	}

	private getRandomMapPoint(): Point {
		return new Point(
			Math.random() * Constant.MAP_WIDTH,
			Math.random() * Constant.MAP_HEIGHT
		);
	}

	public addInitialResources(): void {
		for (let i = 0; i < this.INITIAL_RESOURCES; i++) {
			this.addResource();
		}
	}

	public update(timePassed: number): void {
		if (!this.canUpdateMapResources()) {
			this.decrementUpdateTimer(timePassed);
			return;
		}

		const numResourcesToGenerate = this.getRandomResourceGenerationCount();

		for (let i = 0; i < numResourcesToGenerate; i++) {
			this.addResource();
		}

		this.resetUpdateTimer();
	}

	public deleteResource(resource: Resource) {
		this.resources.delete(resource);
		this.resourceCount--;
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

	private getRandomResourceGenerationCount(): number {
		let resourceNum: number = Math.floor(
			Math.random() * (Constant.RESOURCE.MAX_RESOURCES_PER_UPDATE + 1)
		);

		if (this.resourceCount + resourceNum > this.MAX_RESOURCES)
			resourceNum = this.MAX_RESOURCES - this.resourceCount;

		return resourceNum;
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
