export interface IPoolObject {
	dirtyBit: boolean;

	// For operations that need to be done on each update
	update(updateLiteral: any): void;
	// For operations that only need to be done when created
	init(objectState: any): void;
	// For operations to clean up object
	die(): void;
}
