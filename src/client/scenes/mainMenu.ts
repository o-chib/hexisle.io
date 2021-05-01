import mainScene from './mainScene';
import Utilities from './Utilities';
import { Constant } from './../../shared/constants';
import Anchor from 'phaser3-rex-plugins/plugins/anchor.js';

export default class MainMenu extends Phaser.Scene {
	public static Name = 'MainMenu';
	private socket: SocketIOClient.Socket;
	private playerName = '';

	constructor() {
		super('MainMenu');
	}

	init(data) {
		this.socket = data.socket;
	}

	public preload(): void {
		//preload things here
	}

	// On create
	public create(): void {
		Utilities.LogSceneMethodEntry('MainMenu', 'create');
		const titleText = this.add.text(0, 0, 'Please enter your name', {
			color: 'white',
			fontSize: '20px ',
		});

		new Anchor(titleText, {
			centerX: 'center',
			top: 'top+10',
		});

		const newGameText = this.add.text(0, 0, 'HexIsle', {
			font: 'bold 32px Open-Sans',
		});

		new Anchor(newGameText, {
			centerX: 'center',
			top: '10%',
		});

		const playButton = this.add.text(0, 0, 'Play', {
			font: 'bold 32px Open-Sans',
		});

		new Anchor(playButton, {
			centerX: 'center',
			top: '50%',
		});

		playButton
			.setFontFamily('monospace')
			.setFontSize(40)
			.setFill('#fff')
			.setAlign('center')
			.setOrigin(0.5);
		playButton.setInteractive();

		playButton.on(
			'pointerdown',
			() => {
				this.loadMainScene();
			},
			this
		);

		// Todo maybe remove?
		// this.time.addEvent({
		// 	// Run after ten seconds.
		// 	delay: 10000,
		// 	callback: this.loadMainScene,
		// 	callbackScope: this,
		// 	loop: false,
		// });
	}

	private loadMainScene(): void {
		this.socket.emit(Constant.MESSAGE.JOIN_GAME, this.playerName);

		this.scene.start(mainScene.Name, {
			socket: this.socket,
		});
	}
}
