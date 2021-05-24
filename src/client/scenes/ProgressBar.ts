import Anchor from 'phaser3-rex-plugins/plugins/anchor.js';

export default class ProgressBar {
	private bar_ui_container: Phaser.GameObjects.Container;
	private bar_container: Phaser.GameObjects.Container;
	private bar_back: Phaser.GameObjects.Image;
	private bar: Phaser.GameObjects.Image;
	private bar_icon: Phaser.GameObjects.Image;
	private position_config: any;
	private infoText: Phaser.GameObjects.Text;

	constructor() {
		return;
	}

	public createBar(
		scene: Phaser.Scene,
		icon_name: string,
		bar_color_name: string,
		bar_backing_name: string,
		position_config: any
	) {
		this.bar_container = scene.add.container(0, 0);
		this.bar_ui_container = scene.add.container(0, 0);

		this.bar_back = scene.add
			.image(0, 0, bar_backing_name)
			.setOrigin(0, 0.5);
		this.bar = scene.add.image(0, 0, bar_color_name).setOrigin(0, 0.5);
		this.bar_icon = scene.add.image(0, 0, icon_name).setOrigin(0, 0.5);

		// Center colored bar to the backing (as asset sizes are different)
		const color_bar_width = this.bar.displayWidth;
		const back_bar_width = this.bar_back.displayWidth;
		const color_bar_offset = (back_bar_width - color_bar_width) / 2;
		this.bar.setX(this.bar.x + color_bar_offset);

		// Wrap the bar
		this.bar_container.add(this.bar_back);
		this.bar_container.add(this.bar);

		this.enableIcon(true);

		// Wrap the Bar and Icon
		this.bar_ui_container.add(this.bar_container);
		this.bar_ui_container.add(this.bar_icon);

		this.infoText = scene.add
			.text(0, 0, '', {
				font: '48px Arial',
				stroke: '#000000',
				strokeThickness: 5,
			})
			.setOrigin(1, 0.5);
		// Align the text to the other end of colored bar
		this.infoText.setX(this.bar.x + this.bar.displayWidth * 0.95);
		this.bar_container.add(this.infoText);

		this.position_config = position_config;

		new Anchor(this.bar_ui_container, this.position_config);
	}

	public updateText() {
		this.infoText.text = (this.bar.scaleX * 100).toFixed(0);
	}

	public updateCustomNumberText(num: number) {
		this.infoText.text = num.toFixed(0);
	}

	public updateCustomStringText(str: string) {
		this.infoText.text = str;
	}

	public updateBar(healthPercent: number): void {
		this.bar.setScale(healthPercent, 1);
		this.updateText();
	}

	public scaleBarLength(scalePercent: number): void {
		this.bar_container.scaleX *= scalePercent;
		this.alignTextToBarEnd();
		// undo change on Text
		this.infoText.scaleX /= scalePercent;
	}

	public scaleEntireBar(scalePercent: number): void {
		this.bar_ui_container.scale *= scalePercent;
		this.alignTextToBarEnd();
	}

	public flipBarOnly(): void {
		this.bar_container.scaleX *= -1;

		// undo change on Text
		this.infoText.scaleX *= -1;
		this.infoText.originX = this.infoText.originX == 0 ? 1 : 0;
	}

	public flipEntireBar(): void {
		this.bar_ui_container.scaleX *= -1;

		// undo change on Text
		this.infoText.scaleX *= -1;
		this.infoText.originX = this.infoText.originX == 0 ? 1 : 0;
	}

	public enableIcon(isEnabled: boolean): void {
		this.bar_icon.setVisible(isEnabled);
		// Offset Bar itself from the Icon
		if (isEnabled) {
			const icon_width = this.bar_icon.displayWidth;
			const bar_offset = (2 * icon_width) / 3;
			this.bar_container.setX(bar_offset);
		} else {
			this.bar_container.setX(0);
		}
	}

	public alignTextToBarEnd(): void {
		// Re-Align the text to the other end of colored bar
		this.infoText.originX = 1;
		let proportion = 1;
		if (this.bar_container.scaleX < 0.5) {
			// Small Size
			proportion = 0.85;
		} else if (this.bar_container.scaleX > 1) {
			// Large Size
			proportion = 0.98;
		} else {
			// Medium Size
			proportion = 0.95;
		}
		this.infoText.setX(this.bar.x + this.bar.displayWidth * proportion);
	}
}
