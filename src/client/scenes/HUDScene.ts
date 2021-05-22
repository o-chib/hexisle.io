import Anchor from 'phaser3-rex-plugins/plugins/anchor.js';
import { Constant } from './../../shared/constants';
import Utilities from './Utilities';
import ProgressBar from './ProgressBar';

// Text Structure
const info_format = `%1`;
const timer_format = `%1:%2`;
const debug_format = `cursor:
xPos/yPos:%1/%2
hexQ/hexR:%3/%4`;

export default class HUDScene extends Phaser.Scene {
	public static Name = 'HUDScene';
	private mainSceneObj: any;

	// Debug Info
	private debugInfoText?: Phaser.GameObjects.Text;
	// Quit Button
	private quitButton: Phaser.GameObjects.Image;

	private healthbar_player: ProgressBar;
	private healthbar_team_red: ProgressBar;
	private healthbar_team_blue: ProgressBar;

	private ResourcesCounter: ProgressBar;
	private GameTimeCounter: ProgressBar;

	constructor() {
		super('HUDScene');
	}

	create(): void {
		Utilities.LogSceneMethodEntry('HUDScene', 'create');

		// ProgressBars
		this.healthbar_player = new ProgressBar();
		this.healthbar_team_red = new ProgressBar();
		this.healthbar_team_blue = new ProgressBar();

		this.healthbar_player.createBar(
			this.scene.get(HUDScene.Name),
			'heart_icon',
			'healthbar_green',
			{
				top: 'top+50',
				left: 'left+20',
			}
		);
		// Have all team bars be on top of each other in one corner
		this.healthbar_team_red.createBar(
			this.scene.get(HUDScene.Name),
			'flag_icon_red',
			'healthbar_red',
			{
				bottom: 'bottom-130',
				left: 'left+20',
			}
		);
		this.healthbar_team_blue.createBar(
			this.scene.get(HUDScene.Name),
			'flag_icon_blue',
			'healthbar_blue',
			{
				bottom: 'bottom-50',
				left: 'left+20',
			}
		);

		this.healthbar_player.scaleEntireBar(0.4);
		this.healthbar_team_red.scaleEntireBar(0.4);
		this.healthbar_team_blue.scaleEntireBar(0.4);
		this.healthbar_team_red.scaleBarLength(1.8);
		this.healthbar_team_blue.scaleBarLength(1.8);

		// Resources
		this.ResourcesCounter = new ProgressBar();
		this.ResourcesCounter.createBar(
			this.scene.get(HUDScene.Name),
			'coin_icon',
			'healthbar_back',
			{
				left: 'left+20',
				top: 'top+130',
			}
		);
		this.ResourcesCounter.scaleEntireBar(0.4);
		this.ResourcesCounter.scaleBarLength(0.3);

		// Game Timer
		this.GameTimeCounter = new ProgressBar();
		this.GameTimeCounter.createBar(
			this.scene.get(HUDScene.Name),
			'timer_icon',
			'healthbar_back',
			{
				centerX: 'center',
				top: 'top+50',
			}
		);
		this.GameTimeCounter.scaleEntireBar(0.5);
		this.GameTimeCounter.scaleBarLength(0.35);

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
			'updateTeamHealthBar',
			this.updateTeamHealthBar,
			this
		);
	}

	private updateTeamHealthBar(
		teamNumber: number,
		healthPercent: number
	): void {
		switch (teamNumber) {
			case Constant.TEAM.BLUE:
				this.healthbar_team_blue.updateBar(healthPercent);
				break;
			case Constant.TEAM.RED:
				this.healthbar_team_red.updateBar(healthPercent);
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

		this.healthbar_player.updateBar(playerHealth / Constant.HP.PLAYER);
		this.ResourcesCounter.updateCustomNumberText(currentPlayer.resources);

		if (time < 0) time = 0;
		const dateTime = new Date(time);
		const minutes = dateTime.getMinutes();
		const seconds = dateTime.getSeconds();

		const gameTimeText = Phaser.Utils.String.Format(timer_format, [
			this.addLeadingZeros(minutes),
			this.addLeadingZeros(seconds),
		]);
		this.GameTimeCounter.updateCustomStringText(gameTimeText);
	}

	private updateDebugInfo(
		xPos: number,
		yPos: number,
		hexQ: any,
		hexR: any
	): void {
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
