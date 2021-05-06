import Anchor from 'phaser3-rex-plugins/plugins/anchor.js';

// Text Structure
const info_format = `Health:	%1
Score:	%2
Resource:	%3`;
const timer_format = `%1:%2`;

export default class HUDScene extends Phaser.Scene {
	public static Name = 'HuDScene';
	private mainSceneObj: any;
	private socket: SocketIOClient.Socket;

	// Text/Scoring
	private infoText?: Phaser.GameObjects.Text;
	// Game timer
	private gameTimeText?: Phaser.GameObjects.Text;
	// Quit Button
	private quitButton?: Phaser.GameObjects.Image;

	constructor() {
		super({ key: 'HUDScene', active: true });
	}

	create(): void {
		this.scene.setVisible(false);
		// HUD: Left
		this.infoText = this.add.text(0, 0, '', { font: '48px Arial' });
		new Anchor(this.infoText, {
			left: 'left+10',
			top: 'top+10',
		});

		// HUD: Center
		this.gameTimeText = this.add.text(0, 0, '', {
			font: '48px Arial',
			align: 'center',
		});
		new Anchor(this.gameTimeText, {
			centerX: 'center',
			top: 'top+10',
		});

		// HUD: Right
		this.quitButton = this.add.image(0, 0, 'quitButton').setDepth(99);
		new Anchor(this.quitButton, {
			centerX: 'right-100',
			top: 'top+10',
		});

		// Set quitButton Interaction
		this.quitButton.setInteractive();
		this.quitButton.on('pointerdown', this.quitCurrentGame.bind(this));

		//  Grab a reference to the Game Scene
		this.mainSceneObj = this.scene.get('MainScene');

		//  Listen for events from it
		this.mainSceneObj.events.on('startHUD', this.startHUD, this);
		this.mainSceneObj.events.on('updateHUD', this.updateText, this);
		this.mainSceneObj.events.on('stopHUD', this.stopHUD, this);
	}

	private updateText(currentPlayer: any, time: number): void {
		let playerHealth: number;
		if (currentPlayer.health < 0) {
			playerHealth = 0;
		} else {
			playerHealth = currentPlayer.health;
		}

		const playerText = Phaser.Utils.String.Format(info_format, [
			playerHealth,
			currentPlayer.score,
			currentPlayer.resources,
		]);
		this.infoText?.setText(playerText);

		if (time < 0) time = 0;
		const dateTime = new Date(time);
		const minutes = dateTime.getMinutes();
		const seconds = dateTime.getSeconds();
		//console.log(dateTime.format("mm:ss"));

		const gameTimeText = Phaser.Utils.String.Format(timer_format, [
			this.addLeadingZeros(minutes),
			this.addLeadingZeros(seconds),
		]);
		this.gameTimeText?.setText(gameTimeText);
	}

	private addLeadingZeros(time: number): string {
		const timeStr = time.toString();
		if (time > 9) return timeStr;
		return '0' + timeStr;
	}

	private startHUD(socket): void {
		this.socket = socket;
		this.infoText?.setText('');
		this.gameTimeText?.setText('');
		this.scene.setVisible(true);
	}

	private stopHUD(): void {
		this.scene.setVisible(false);
	}

	private quitCurrentGame(): void {
		this.events.emit('leaveGame');
	}
}
