export default class IDgenerator {
	private runningCount: number;

	constructor() {
		this.runningCount = 0;
	}

	newID(): string {
		return (this.runningCount++).toString();
	}
}
