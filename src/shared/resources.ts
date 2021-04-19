import { Point } from './hexTiles';
import { Constant } from '../shared/constants';

export class ResourceSystem {
    public minResource: number;
    public maxResource: number;
    public resourceCount: number;
    public resources: Set<Resource>;

    constructor() {
        this.minResource = 20;
        this.maxResource = 50;
        this.resourceCount = 0;
        this.resources = new Set();
    }

    getRandomResourceGenerationCount(): number{
        return Math.floor(Math.random() * (this.maxResource - this.minResource + 1));
    }

    generateResource(randomPoint: Point): Resource {
        const type = this.getRandomResourceType();
        const dropAmount = this.calculateDropAmount(type);
        const newResource: Resource = new Resource(
            randomPoint,
            dropAmount,
            type
        )
        this.resources.add(newResource);
        this.resourceCount++;
        return newResource;
    }

    getRandomResourceType(): string {
        let resourceID = this.getRandomResourceID();
        return Constant.RESOURCE.RESOURCE_NAME[resourceID];
    }

    getRandomResourceID(): number {
        var num = Math.random();
        var rarity = 0;
        var lastIndex = Constant.RESOURCE.RESOURCE_ID.length - 1;

        for(var i=0; i < lastIndex; i++) {
            rarity += Constant.RESOURCE.RESOURCE_RARITY[i];
            if(num < rarity) {
                return Constant.RESOURCE.RESOURCE_ID[i];
            }
        }

        return Constant.RESOURCE.RESOURCE_ID[lastIndex];
    }

    calculateDropAmount(type: string): number {
        return Constant.RESOURCE.DROP_AMOUNT[type];
    }

    deleteResource() {
        this.resourceCount--;
    }
} 

export class Resource {
    public location: Point;
    public dropAmount: number;
    public type: string;

    constructor(
        location: Point,
        dropAmount: number,
        type: string,
    ) {
        this.location = location;
        this.dropAmount = dropAmount;
        this.type = type;
    }
}