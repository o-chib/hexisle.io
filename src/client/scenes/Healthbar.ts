import Anchor from 'phaser3-rex-plugins/plugins/anchor.js';

export default class Healthbar {
	private healthbar_ui_container: Phaser.GameObjects.Container;
	private healthbar_container: Phaser.GameObjects.Container;
	private healthbar_back: Phaser.GameObjects.Image;
	private healthbar: Phaser.GameObjects.Image;
	private healthbar_icon: Phaser.GameObjects.Image;
	private position_config: any;
	private infoText: Phaser.GameObjects.Text;

	constructor() {
		return;
	}

	public createHealthBar(
		scene: Phaser.Scene,
		icon_name: string,
		healthbar_color_name: string,
		position_config: any
	) {
		this.healthbar_container = scene.add.container(0, 0);
		this.healthbar_ui_container = scene.add.container(0, 0);

		this.healthbar_back = scene.add
			.image(0, 0, 'healthbar_back')
			.setOrigin(0, 0.5);
		this.healthbar = scene.add
			.image(0, 0, healthbar_color_name)
			.setOrigin(0, 0.5);
		this.healthbar_icon = scene.add
			.image(0, 0, icon_name)
			.setOrigin(0, 0.5);

		// Center colored healthbar to the backing (as asset sizes are different)
		const color_bar_width = this.healthbar.displayWidth;
		const back_bar_width = this.healthbar_back.displayWidth;
		const color_bar_offset = (back_bar_width - color_bar_width) / 2;
		this.healthbar.setX(this.healthbar.x + color_bar_offset);

		// Wrap the bar
		this.healthbar_container.add(this.healthbar_back);
		this.healthbar_container.add(this.healthbar);

		// Offset Bar itself from the Icon
		const icon_width = this.healthbar_icon.displayWidth;
		const bar_offset = (2 * icon_width) / 3;
		this.healthbar_container.setX(this.healthbar_container.x + bar_offset);

		// Wrap the Bar and Icon
		this.healthbar_ui_container.add(this.healthbar_container);
		this.healthbar_ui_container.add(this.healthbar_icon);

		this.infoText = scene.add
			.text(0, 0, '', {
				font: '48px Arial',
				stroke: '#000000',
				strokeThickness: 5,
			})
			.setOrigin(1, 0.5);
		// Align the text to the other end of colored healthbar
		this.infoText.setX(
			this.healthbar.x + this.healthbar.displayWidth * 0.95
		);
		this.healthbar_container.add(this.infoText);

		this.position_config = position_config;

		new Anchor(this.healthbar_ui_container, this.position_config);
	}
	public updateText() {
		this.infoText.text = (this.healthbar.scaleX * 100).toFixed(0);
	}
	public updateCustomNumberText(num: number) {
		this.infoText.text = num.toFixed(0);
	}

	public updateHealthBar(healthPercent: number): void {
		this.healthbar.setScale(healthPercent, 1);
		this.updateText();
	}

	public scaleHealthBarLength(scalePercent: number): void {
		this.healthbar_container.scaleX *= scalePercent;
		this.AlignTextToBar();
		// undo change on Text
		this.infoText.scaleX /= scalePercent;
	}
	public scaleEntireHealthBar(scalePercent: number): void {
		this.healthbar_ui_container.scale *= scalePercent;
	}
	public flipHealthBarOnly(): void {
		this.healthbar_container.scaleX *= -1;

		// undo change on Text
		this.infoText.scaleX *= -1;
		this.infoText.originX = this.infoText.originX == 0 ? 1 : 0;
	}
	public flipEntireHealthBar(): void {
		this.healthbar_ui_container.scaleX *= -1;

		// undo change on Text
		this.infoText.scaleX *= -1;
		this.infoText.originX = this.infoText.originX == 0 ? 1 : 0;
	}
	private AlignTextToBar(): void {
		// Re-Align the text to the other end of colored healthbar
		this.infoText.setX(
			this.healthbar.x + this.healthbar.displayWidth * 0.95
		);
	}
}
