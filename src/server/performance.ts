import { performance } from 'perf_hooks';

export default class PerformanceMonoitor {
	public avg = 0;
	public max = -1;
	public min = Number.MAX_VALUE;
	public count = 0;
	private performanceSample = 0;
	private startTime: number;
	private updateFlag = false;

	public start() {
		if (this.performanceSample <= 0) {
			this.performanceSample = 20;
			this.startTime = performance.now();
			this.updateFlag = true;
		} else {
			this.performanceSample--;
		}
	}

	public stop() {
		if (this.updateFlag) {
			this.updatePerformanceStats(performance.now() - this.startTime);
			this.updateFlag = false;
		}
	}

	private async updatePerformanceStats(timePassed: number) {
		this.count++;
		this.avg = (this.avg * (this.count - 1) + timePassed) / this.count;
		if (timePassed < this.min) this.min = timePassed;
		if (this.count > 1 && timePassed > this.max) this.max = timePassed;

		process.stdout.cursorTo(0, 0);

		process.stdout.write(`Now: ${timePassed.toFixed(3)} ms
Min: ${this.min.toFixed(3)} ms
Max: ${this.max.toFixed(3)} ms
Avg: ${this.avg.toFixed(3)} ms
`);
	}
}
