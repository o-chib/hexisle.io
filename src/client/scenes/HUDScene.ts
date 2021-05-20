import Anchor from 'phaser3-rex-plugins/plugins/anchor.js';
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
	private infoText?: Phaser.GameObjects.Text;
	private gameTimeText?: Phaser.GameObjects.Text;
	private debugInfoText?: Phaser.GameObjects.Text;
	private quitButton?: Phaser.GameObjects.Image;
	private muteButton?: Phaser.GameObjects.Image;d

	constructor() {
		super('HUDScene');
	}

	create(): void {
		Utilities.LogSceneMethodEntry('HUDScene', 'create');
		//this.scene.setVisible(false);

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
			.image(0, 0, 'quitButton')
			.setDepth(99)
			.setDisplayOrigin(0.5, 0.5)
			.setScale(0.35);
		new Anchor(this.quitButton, {
			right: 'right-10',
			top: 'top+10',
		});

		this.muteButton = this.add
			.image(0, 0, 'quitButton')
			.setDepth(99)
			.setDisplayOrigin(0.5, 0.5)
			.setScale(0.35);
		new Anchor(this.muteButton, {
			right: 'right-90',
			top: 'top+10',
		});

		// Set button Interaction
		this.quitButton.setInteractive();
		this.quitButton.on('pointerdown', this.quitCurrentGame.bind(this));

		this.muteButton.setInteractive();
		this.muteButton.on('pointerdown', this.toggleSounds.bind(this));

		//  Grab a reference to the Game Scene
		this.mainSceneObj = this.scene.get('MainScene');

		//  Listen for events from it
		this.mainSceneObj.events.off('startHUD');
		this.mainSceneObj.events.off('updateHUD');
		this.mainSceneObj.events.off('stopHUD');

		this.mainSceneObj.events.on('startHUD', this.startHUD, this);
		this.mainSceneObj.events.on('updateHUD', this.updateText, this);
		this.mainSceneObj.events.on('stopHUD', this.stopHUD, this);
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

	private toggleSounds(): void {
		this.mainSceneObj.sound.setMute(!this.mainSceneObj.sound.mute);
	}
}
