import Anchor from 'phaser3-rex-plugins/plugins/anchor.js';

export default class Healthbar {
	private healthbar_ui_container: Phaser.GameObjects.Container;
	private healthbar_container: Phaser.GameObjects.Container;
	private healthbar_back: Phaser.GameObjects.Image;
	private healthbar: Phaser.GameObjects.Image;
	private healthbar_icon: Phaser.GameObjects.Image;
	private position_config: any;
	private x: number;

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

		// this.healthbar_ui_container.setScale(0.5);
		// this.healthbar_container.setScale(2,1);

		this.position_config = position_config;
		new Anchor(this.healthbar_ui_container, this.position_config);

		// this.healthbar_icon.setVisible(false);
	}

	public updateHealthBar(healthPercent: number): void {
		this.healthbar.setScale(healthPercent, 1);
	}

	public scaleHealthBarLength(scalePercent: number): void {
		this.healthbar_container.setScale(
			scalePercent,
			this.healthbar_container.scaleY
		);
	}
	public scaleEntireHealthBar(scalePercent: number): void {
		this.healthbar_ui_container.setScale(scalePercent);
	}
	public flipHealthBarOnly(): void {
		this.healthbar_container.setScale(
			this.healthbar_container.scaleX * -1,
			this.healthbar_container.scaleY
		);
	}
	public flipEntireHealthBar(): void {
		this.healthbar_ui_container.setScale(
			this.healthbar_ui_container.scaleX * -1,
			this.healthbar_ui_container.scaleY
		);
	}
}
