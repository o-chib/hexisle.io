import { IPoolObject } from '../iPoolObject';

export abstract class ClientGameObjectContainer implements IPoolObject {
	public dirtyBit: boolean;
	protected children: IPoolObject[];

	constructor() {
		this.children = [];
	}

	public update(objectState: any): void {
		this.children.forEach((child) => {
			child.update(objectState);
		});
	}

	public init(objLiteral: any): void {
		this.children.forEach((child) => {
			child.init(objLiteral);
		});
	}

	public die(): void {
		this.children.forEach((child) => {
			child.die();
		});
	}
}
