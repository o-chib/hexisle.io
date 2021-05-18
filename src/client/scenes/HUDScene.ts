import Anchor from 'phaser3-rex-plugins/plugins/anchor.js';
import { Constant } from './../../shared/constants';
import Utilities from './Utilities';

// Text Structure
const info_format = `Health:	%1
Resources:	%2`;
const timer_format = `%1:%2`;
const debug_format = `cursor:
xPos/yPos:%1/%2
hexQ/hexR:%3/%4`;

export default class HUDScene extends Phaser.Scene {
	public static Name = 'HUDScene';
	private mainSceneObj: any;

	// Text/Scoring
	private infoText?: Phaser.GameObjects.Text;
	// Game timer
	private gameTimeText?: Phaser.GameObjects.Text;
	// Debug Info
	private debugInfoText?: Phaser.GameObjects.Text;
	// Quit Button
	private quitButton: Phaser.GameObjects.Image;

	private healthbar_blue: Phaser.GameObjects.Image;
	private x_blue: number;

	private healthbar_red: Phaser.GameObjects.Image;
	private x_red: number;

	constructor() {
		super('HUDScene');
	}

	create(): void {
		Utilities.LogSceneMethodEntry('HUDScene', 'create');
		//this.scene.setVisible(false

		this.createHealthBar();

		// HUD: Left
		this.infoText = this.add.text(0, 0, '', {
			font: '48px Arial',
			stroke: '#000000',
			strokeThickness: 5,
		});
		new Anchor(this.infoText, {
			left: 'left+10',
			top: 'top+10',
		});

		// HUD: Center
		this.gameTimeText = this.add.text(0, 0, '', {
			font: '48px Arial',
			align: 'center',
			stroke: '#000000',
			strokeThickness: 5,
		});
		new Anchor(this.gameTimeText, {
			centerX: 'center',
			top: 'top+10',
		});

		this.debugInfoText = this.add.text(0, 0, '', {
			font: '48px Arial',
			align: 'left',
			stroke: '#000000',
			strokeThickness: 5,
		});
		new Anchor(this.debugInfoText, {
			centerX: 'left+10',
			bottom: 'bottom-118',
		});

		// Grab a reference to the Game Scene
		this.mainSceneObj = this.scene.get('MainScene');

		// Listen for events from it
		this.mainSceneObj.events.on('updateHUD', this.updateText, this);

		// Listen for debug info update events
		this.mainSceneObj.events.on(
			'updateDebugInfo',
			this.updateDebugInfo,
			this
		);

		// Listen for clear debug info event
		this.mainSceneObj.events.on(
			'clearDebugInfo',
			this.clearDebugInfo,
			this
		);

		// HUD: Right
		this.quitButton = this.add
			.image(0, 0, 'quit_button_unpressed')
			.setDepth(99)
			.setDisplayOrigin(0.5, 0.5)
			.setScale(0.35);

		new Anchor(this.quitButton, {
			right: 'right-10',
			top: 'top+10',
		});

		// Set quitButton Interaction
		this.quitButton.setInteractive();
		this.quitButton.on('pointerdown', this.quitCurrentGame.bind(this));
		this.quitButton.on('pointerover', () => {
			this.quitButton.setTexture('quit_button_pressed');
		});
		this.quitButton.on('pointerout', () => {
			this.quitButton.setTexture('quit_button_unpressed');
		});

		//  Grab a reference to the Game Scene
		this.mainSceneObj = this.scene.get('MainScene');

		//  Listen for events from it
		this.mainSceneObj.events.off('startHUD');
		this.mainSceneObj.events.off('updateHUD');
		this.mainSceneObj.events.off('stopHUD');

		this.mainSceneObj.events.on('startHUD', this.startHUD, this);
		this.mainSceneObj.events.on('updateHUD', this.updateText, this);
		this.mainSceneObj.events.on('stopHUD', this.stopHUD, this);

		this.mainSceneObj.events.on(
			'updateHealthBar',
			this.updateHealthBar,
			this
		);
	}

	private createHealthBar() {
		for (let i = 0; i < Constant.TEAM_COUNT; ++i) {
			let healthbar_shadow: Phaser.GameObjects.Image;
			let healthbar_outline: Phaser.GameObjects.Image;

			let centerString = 'center';
			const bottomString = 'bottom-20';

			switch (i) {
				case Constant.TEAM.BLUE:
					centerString += '+155';
					healthbar_shadow = this.add.image(0, 0, 'healthbar_shadow');
					this.healthbar_blue = this.add.image(
						0,
						0,
						'healthbar_blue'
					);
					healthbar_outline = this.add.image(
						0,
						0,
						'healthbar_outline'
					);

					const config_blue = {
						centerX: centerString,
						bottom: bottomString,
					};

					new Anchor(healthbar_shadow, config_blue);
					new Anchor(this.healthbar_blue, config_blue);
					new Anchor(healthbar_outline, config_blue);

					this.x_blue = this.healthbar_blue.x;

					break;

				case Constant.TEAM.RED:
					centerString += '-155';

					healthbar_shadow = this.add.image(0, 0, 'healthbar_shadow');
					this.healthbar_red = this.add.image(0, 0, 'healthbar_red');
					healthbar_outline = this.add.image(
						0,
						0,
						'healthbar_outline'
					);

					const config_red = {
						centerX: centerString,
						bottom: bottomString,
					};

					new Anchor(healthbar_shadow, config_red);
					new Anchor(this.healthbar_red, config_red);
					new Anchor(healthbar_outline, config_red);

					this.x_red = this.healthbar_red.x;
					break;
			}
		}
	}

	private updateHealthBar(teamNumber: number, healthPercent: number): void {
		let offset: number;
		switch (teamNumber) {
			case Constant.TEAM.BLUE:
				this.healthbar_blue.setScale(healthPercent, 1);
				offset =
					this.x_blue -
					(this.healthbar_blue.width -
						this.healthbar_blue.displayWidth) /
						2;
				this.healthbar_blue.setX(offset);
				break;
			case Constant.TEAM.RED:
				this.healthbar_red.setScale(healthPercent, 1);
				offset =
					this.x_red +
					(this.healthbar_red.width -
						this.healthbar_red.displayWidth) /
						2;
				this.healthbar_red.setX(offset);
				break;
		}
	}

	private updateText(currentPlayer: any, time: number): void {
		let playerHealth: number;
		if (currentPlayer.hp < 0) {
			playerHealth = 0;
		} else {
			playerHealth = currentPlayer.hp;
		}

		const playerText = Phaser.Utils.String.Format(info_format, [
			playerHealth,
			currentPlayer.resources,
		]);
		this.infoText?.setText(playerText);

		if (time < 0) time = 0;
		const dateTime = new Date(time);
		const minutes = dateTime.getMinutes();
		const seconds = dateTime.getSeconds();

		const gameTimeText = Phaser.Utils.String.Format(timer_format, [
			this.addLeadingZeros(minutes),
			this.addLeadingZeros(seconds),
		]);
		this.gameTimeText?.setText(gameTimeText);
	}

	private updateDebugInfo(xPos, yPos, hexQ, hexR): void {
		const debugInfoText = Phaser.Utils.String.Format(debug_format, [
			Math.round(xPos * 100) / 100,
			Math.round(yPos * 100) / 100,
			hexQ,
			hexR,
		]);
		this.debugInfoText?.setText(debugInfoText);
	}

	private clearDebugInfo(): void {
		this.debugInfoText?.setText('');
	}

	private addLeadingZeros(time: number): string {
		const timeStr = time.toString();
		if (time > 9) return timeStr;
		return '0' + timeStr;
	}

	private startHUD(): void {
		this.infoText?.setText('');
		this.gameTimeText?.setText('');
		this.scene.setVisible(true);
	}

	private stopHUD(): void {
		this.scene.setVisible(false);
		this.scene.pause();
	}

	private quitCurrentGame(): void {
		this.events.emit('leaveGame');
	}
}
