interface IPoolObject {
	dirtyBit: boolean;

	setActive(bool: boolean): void;
	setVisible(bool: boolean): void;

	update(updateLiteral: any): void;
}
