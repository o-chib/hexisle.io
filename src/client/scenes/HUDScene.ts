import Anchor from 'phaser3-rex-plugins/plugins/anchor.js';

// Text Structure
const info_format = `Health:	%1
Score:	%2
Resource:	%3`;

export default class HUDScene extends Phaser.Scene {
	private mainSceneObj: any;

	// Text/Scoring
	private infoText?: Phaser.GameObjects.Text;

	constructor() {
		super({ key: 'HUDScene', active: true });
	}

	create(): void {
		this.infoText = this.add.text(0, 0, '', { font: '48px Arial' });
		new Anchor(this.infoText, {
			left: 'left+10',
			top: 'top+10',
		});

		//  Grab a reference to the Game Scene
		this.mainSceneObj = this.scene.get('MainScene');

		//  Listen for events from it
		this.mainSceneObj.events.on('updateHUD', this.updateText, this);
	}

	private updateText(currentPlayer: any): void {
		let playerHealth: number;
		if (currentPlayer.health < 0) {
			playerHealth = 0;
		} else {
			playerHealth = currentPlayer.health;
		}

		const text = Phaser.Utils.String.Format(info_format, [
			playerHealth,
			currentPlayer.score,
			currentPlayer.resources,
		]);
		this.infoText?.setText(text);
	}
}
