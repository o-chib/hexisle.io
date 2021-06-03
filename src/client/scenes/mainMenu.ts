import mainScene from './mainScene';
import Utilities from './Utilities';
import FormUtilities from './FormUtilities';
import { Constant } from './../../shared/constants';

export default class MainMenu extends Phaser.Scene {
	public static Name = 'MainMenu';
	private socket: SocketIOClient.Socket;
	private playerName: string | undefined = '';
	private gameid: string | undefined = '';
	private inputBox;
	private menuMusic: Phaser.Sound.BaseSound;
	private nextUpdateTime: number;
	private submitKey: Phaser.Input.Keyboard.Key;
	private muteButton?: Phaser.GameObjects.Image;

	constructor() {
		super('MainMenu');
	}

	init(data) {
		this.socket = data.socket;

		this.socket.on(
			Constant.MESSAGE.GIVE_GAME_LIST,
			this.initializeLobbyList.bind(this)
		);

		// Menu Music
		if (!this.sound.get('menuMusic')) {
			this.menuMusic = this.sound.add('menuMusic', {
				volume: Constant.VOLUME.MENU_MUSIC,
				loop: true,
			});
		}
		if (!this.menuMusic.isPlaying) {
			this.menuMusic.play();
		}
	}

	public create(): void {
		Utilities.LogSceneMethodEntry('MainMenu', 'create');
		this.askForUpdatedGameList();

		const renderWidth = this.game.renderer.width;
		const renderHeight = this.game.renderer.height;

		// Background image
		this.add.image(0, 0, 'lobby_bg').setOrigin(0).setDepth(0);

		// Containers
		const menuContainer = this.add.container(renderWidth / 2, 0);
		const optionsContainer = this.add
			.container(menuContainer.x + 230, renderHeight / 2)
			.setVisible(false);

		// Form Box
		this.inputBox = this.add
			.dom(0, renderHeight * 0.45)
			.createFromCache('form_mainmenu')
			.setDepth(1);
		menuContainer.add(this.inputBox);

		// Menu Buttons from form
		const playButton = document.getElementById(
			'playButton'
		) as HTMLLinkElement;
		const optionButton = document.getElementById(
			'optionButton'
		) as HTMLLinkElement;
		const helpButton = document.getElementById(
			'helpButton'
		) as HTMLLinkElement;

		// Help Panel
		const helpMenu = this.add
			.image(menuContainer.x - 380, renderHeight / 2 + 100, 'help_menu')
			.setDepth(2)
			.setVisible(false);

		// Options menu/buttons
		this.muteButton = this.add
			.image(0, 0, '')
			.setDepth(3)
			.setDisplayOrigin(0.5, 0.5)
			.setScale(0.7);
		Utilities.setToggleMuteButtonIcon(this.muteButton, this.sound);

		this.muteButton.removeAllListeners();
		this.muteButton.setInteractive();
		this.muteButton.on(
			'pointerdown',
			Utilities.toggleMuteButton.bind(this, this.muteButton, this.sound)
		);

		optionsContainer.add(this.muteButton);

		// Interactions
		this.submitKey = this.input.keyboard.addKey(
			Phaser.Input.Keyboard.KeyCodes.ENTER,
			false
		);
		this.submitKey.on('down', () => {
			this.joinGame();
		});

		playButton.addEventListener('click', () => this.joinGame());
		playButton.addEventListener('mouseover', () =>
			FormUtilities.setButtonTextureOnMouseIn(playButton)
		);
		playButton.addEventListener('mouseout', () =>
			FormUtilities.setButtonTextureOnMouseOut(playButton)
		);

		optionButton.addEventListener('click', () =>
			optionsContainer.setVisible(!optionsContainer.visible)
		);
		optionButton.addEventListener('mouseover', () =>
			FormUtilities.setButtonTextureOnMouseIn(optionButton)
		);
		optionButton.addEventListener('mouseout', () =>
			FormUtilities.setButtonTextureOnMouseOut(optionButton)
		);

		helpButton.addEventListener('click', () => {
			helpMenu.setVisible(!helpMenu.visible);
		});
		helpButton.addEventListener('mouseover', () =>
			FormUtilities.setButtonTextureOnMouseIn(helpButton)
		);
		helpButton.addEventListener('mouseout', () =>
			FormUtilities.setButtonTextureOnMouseOut(helpButton)
		);
	}

	private askForUpdatedGameList() {
		this.socket.emit(Constant.MESSAGE.ASK_GAME_LIST);
		this.nextUpdateTime = Date.now() + 1000;
	}

	public update(): void {
		// Main Menu doesn't update, interactions are listener-based
	}

	private initializeLobbyList(lobbyList): void {
		const dropdownList = document.getElementById('dropdownList');
		if (!dropdownList) return;

		this.clearDropdownList(dropdownList);
		this.addAutoselectOption(dropdownList);

		for (let i = 0; i < lobbyList.length; i++) {
			this.addGameToDropdownList(lobbyList[i], dropdownList);
		}
	}

	private addGameToDropdownList(gameInfo: any, dropdownList: HTMLElement) {
		const option = document.createElement('option');
		option.value = gameInfo.gameid;
		option.text = gameInfo.gameid + ' (' + gameInfo.info.playerCount + ')';
		dropdownList.appendChild(option);
	}

	private addAutoselectOption(dropdownList: HTMLElement) {
		const autoselect = document.createElement('option');
		autoselect.value = '';
		autoselect.text = 'Choose Server (Auto)';
		dropdownList.appendChild(autoselect);
	}

	private clearDropdownList(dropdownList: HTMLElement) {
		while (dropdownList.firstChild) {
			dropdownList.removeChild(dropdownList.firstChild);
		}
	}
	private showErrorMessage(message: string): void {
		const errorMessageHolder = document.getElementById(
			'invalid-message-holder'
		);
		const errorMessage = document.getElementById('error-message');
		if (!errorMessageHolder) return;
		if (!errorMessage) return;

		errorMessageHolder.setAttribute('style', 'display:flex');
		errorMessage.innerText = message;
	}

	private joinGame(): void {
		this.playerName = this.inputBox.getChildByName('name').value;
		this.gameid = this.inputBox.getChildByName('dropdownList').value;

		if (this.gameid == '') this.gameid = undefined;
		if (this.playerName == '') this.playerName = undefined;

		this.socket.emit(
			Constant.MESSAGE.JOIN_GAME,
			this.playerName,
			this.gameid
		);

		this.socket.once(
			Constant.MESSAGE.JOIN_GAME_SUCCESS,
			this.loadMainScene.bind(this)
		);
		this.socket.once(
			Constant.MESSAGE.JOIN_GAME_FAIL,
			this.failedToJoinGame.bind(this)
		);
	}

	private loadMainScene() {
		this.socket.off(Constant.MESSAGE.JOIN_GAME_FAIL);
		this.socket.off(Constant.MESSAGE.GIVE_GAME_LIST);
		this.submitKey.removeAllListeners();

		this.menuMusic.pause();

		this.scene.start(mainScene.Name, {
			socket: this.socket,
		});
	}

	private failedToJoinGame(message: string) {
		this.socket.off(Constant.MESSAGE.JOIN_GAME_SUCCESS);
		this.showErrorMessage(message);
	}
}
