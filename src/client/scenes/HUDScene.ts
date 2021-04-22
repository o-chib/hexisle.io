import Anchor from 'phaser3-rex-plugins/plugins/anchor.js';

// Text Structure
const info_format = `Health:	%1
Score:	%2
Resource:	%3`;
const timer_format = `%1:%2`;

export default class HUDScene extends Phaser.Scene {
	private mainSceneObj: any;

	// Text/Scoring
	private infoText?: Phaser.GameObjects.Text;
	// Game timer
	private gameTimeText?: Phaser.GameObjects.Text;

	constructor() {
		super({ key: 'HUDScene', active: true });
	}

	create(): void {
		this.infoText = this.add.text(0, 0, '', { font: '48px Arial' });
		new Anchor(this.infoText, {
			left: 'left+10',
			top: 'top+10',
		});

		this.gameTimeText = this.add.text(0, 0, '', {
			font: '48px Arial',
			align: 'center',
		});
		new Anchor(this.gameTimeText, {
			centerX: 'center',
			top: 'top+10',
		});

		//  Grab a reference to the Game Scene
		this.mainSceneObj = this.scene.get('MainScene');

		//  Listen for events from it
		this.mainSceneObj.events.on('updateHUD', this.updateText, this);
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
}
