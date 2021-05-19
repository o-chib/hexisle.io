import { Constant } from '../../shared/constants';
import FormUtilities from './FormUtilities';
import mainMenu from './mainMenu';
import Utilities from './Utilities';

export default class gameOver extends Phaser.Scene {
	public static Name = 'gameOver';
	private socket: SocketIOClient.Socket;
	private endState;
	private messageBox;

	constructor() {
		super('gameOver');
	}

	init(data): void {
		this.socket = data.socket;
		this.endState = data.endState;
	}

	create(): void {
		Utilities.LogSceneMethodEntry('gameOver', 'create');

		const renderWidth = this.game.renderer.width;
		const renderHeight = this.game.renderer.height;

		// Background image
		this.add.image(0, 0, 'lobby_bg').setOrigin(0).setDepth(0);

		// Container
		const menuContainer = this.add.container(renderWidth / 2, 0);

		// Form Box
		this.messageBox = this.add
			.dom(0, renderHeight * 0.45)
			.createFromCache('form_gameover')
			.setDepth(1);
		menuContainer.add(this.messageBox);

		// Message
		let textMessage = '';

		textMessage +=
			this.endState.winner == Constant.TEAM.BLUE ? 'Blue' : 'Red';
		textMessage += ' team wins!';
		textMessage += '\n' + this.endState.message;

		//message.setVisible(false);

		const MessageArea = document.getElementById('message') as HTMLElement;
		MessageArea.innerText = textMessage;

		// Interactions
		const returnButton = document.getElementById(
			'returnButton'
		) as HTMLLinkElement;
		returnButton.addEventListener('click', () => this.loadMainMenu());

		returnButton.addEventListener('mouseover', () => {
			FormUtilities.setButtonTextureOnMouseIn(returnButton);
		});
		returnButton.addEventListener('mouseout', () =>
			FormUtilities.setButtonTextureOnMouseOut(returnButton)
		);

		this.time.addEvent({
			// Run after ten seconds.
			delay: 5000,
			callback: this.loadMainMenu,
			callbackScope: this,
			loop: false,
		});
	}

	private loadMainMenu() {
		this.scene.start(mainMenu.Name, {
			socket: this.socket,
		});
	}
}
