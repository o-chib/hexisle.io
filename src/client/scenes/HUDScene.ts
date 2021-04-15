//import mainScene from './scenes/mainScene'

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
		this.infoText = this.add.text(10, 10, '', { font: '48px Arial' });

		//  Our Text object to display the Score
		//let info = this.add.text(10, 10, 'Score: 0', { font: '48px Arial', fill: '#000000' });

		//  Grab a reference to the Game Scene
		this.mainSceneObj = this.scene.get('MainScene');

		//  Listen for events from it
		this.mainSceneObj.events.on('updateHUD', this.updateText, this);
	}

	private updateText(currentPlayer: any): void {
		const text = Phaser.Utils.String.Format(info_format, [
			currentPlayer.health,
			currentPlayer.score,
			currentPlayer.resources,
		]);
		this.infoText?.setText(text);
	}
}
