import Anchor from 'phaser3-rex-plugins/plugins/anchor.js';
import { Constant } from './../../shared/constants';
import Utilities from './Utilities';
import Healthbar from './Healthbar';

// Text Structure
const info_format = `%1`;
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

	private healthbar_player: Healthbar;
	private healthbar_team_red: Healthbar;
	private healthbar_team_blue: Healthbar;

	private ResourcesCounter: Phaser.GameObjects.Container;

	constructor() {
		super('HUDScene');
	}

	create(): void {
		Utilities.LogSceneMethodEntry('HUDScene', 'create');

		// Healthbars
		this.healthbar_player = new Healthbar();
		this.healthbar_team_red = new Healthbar();
		this.healthbar_team_blue = new Healthbar();

		this.healthbar_player.createHealthBar(
			this.scene.get(HUDScene.Name),
			'heart_icon',
			'healthbar_green',
			{
				top: 'top+50',
				left: 'left+20',
			}
		);
		// Have all team bars be on top of each other in one corner
		this.healthbar_team_red.createHealthBar(
			this.scene.get(HUDScene.Name),
			'flag_icon_red',
			'healthbar_red',
			{
				bottom: 'bottom-130',
				left: 'left+20',
			}
		);
		this.healthbar_team_blue.createHealthBar(
			this.scene.get(HUDScene.Name),
			'flag_icon_blue',
			'healthbar_blue',
			{
				bottom: 'bottom-50',
				left: 'left+20',
			}
		);

		// // Flip the oppsosing bar and position to the other corner of map
		// this.healthbar_team_red.createHealthBar(this.scene.get(HUDScene.Name),'flag_icon_red','healthbar_red',{
		// 	bottom:'bottom-50',
		// 	right:'right-20'
		// });
		// this.healthbar_team_red.flipEntireHealthBar();

		this.healthbar_player.scaleEntireHealthBar(0.4);
		this.healthbar_team_red.scaleEntireHealthBar(0.4);
		this.healthbar_team_blue.scaleEntireHealthBar(0.4);
		this.healthbar_team_red.scaleHealthBarLength(1.8);
		this.healthbar_team_blue.scaleHealthBarLength(1.8);

		// HUD: Left
		this.ResourcesCounter = this.add.container(0, 0);
		const resourcesIcon = this.add
			.image(0, 0, 'coin_icon')
			.setOrigin(0, 0.5);
		this.infoText = this.add
			.text(0, 0, '', {
				font: '48px Arial',
				stroke: '#000000',
				strokeThickness: 5,
			})
			.setOrigin(0, 0.5)
			.setScale(2);
		this.infoText.setX(resourcesIcon.displayWidth + 5);

		this.ResourcesCounter.add([resourcesIcon, this.infoText]);
		this.ResourcesCounter.setScale(0.4);
		new Anchor(this.ResourcesCounter, {
			left: 'left+20',
			top: 'top+130',
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
				this.healthbar_team_blue.updateHealthBar(healthPercent);
				break;
			case Constant.TEAM.RED:
				this.healthbar_team_red.updateHealthBar(healthPercent);
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

		this.healthbar_player.updateHealthBar(
			playerHealth / Constant.HP.PLAYER
		);

		const playerText = Phaser.Utils.String.Format(info_format, [
			currentPlayer.resources,
		]);
		this.infoText?.setText(playerText);
		// this.infoText?.setVisible(false);

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
