import mainScene from './mainScene';
import Utilities from './Utilities';
import FormUtilities from './FormUtilities';
import { Constant } from './../../shared/constants';

export default class MainMenu extends Phaser.Scene {
	public static Name = 'MainMenu';
	private socket: SocketIOClient.Socket;
	private playerName = '';
	private gameid: string | undefined = '';
	private inputBox;
	private nextUpdateTime: number;

	constructor() {
		super('MainMenu');
	}

	init(data) {
		this.socket = data.socket;

		this.socket.on(
			Constant.MESSAGE.GIVE_GAME_LIST,
			this.initializeLobbyList.bind(this)
		);
	}

	public preload(): void {
		//preload things here
	}

	public create(): void {
		Utilities.LogSceneMethodEntry('MainMenu', 'create');
		this.askForUpdatedGameList();

		const renderWidth = this.game.renderer.width;
		const renderHeight = this.game.renderer.height;

		// Background image
		this.add.image(0, 0, 'lobby_bg').setOrigin(0).setDepth(0);

		// Container
		const menuContainer = this.add.container(renderWidth / 2, 0);

		// Logo and Title
		const logoImg = this.add
			.image(0, renderHeight * 0.2, 'campfire_lit')
			.setDepth(1);
		menuContainer.add(logoImg);
		const newGameText = this.add
			.image(0, logoImg.y + 50, 'lobby_logo')
			.setDepth(2)
			.setScale(0.5);
		menuContainer.add(newGameText);

		// Form Box
		this.inputBox = this.add
			.dom(0, renderHeight * 0.45)
			.createFromCache('form')
			.setDepth(1);
		menuContainer.add(this.inputBox);
		const submitKey = this.input.keyboard.addKey(
			Phaser.Input.Keyboard.KeyCodes.ENTER
		);

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
			.image(renderWidth / 2, renderHeight / 2, 'help_menu')
			.setDepth(2)
			.setVisible(false);

		// Interactions
		submitKey.on('down', () => {
			this.joinGame();
		});

		playButton.addEventListener('click', () => this.joinGame());
		playButton.addEventListener('mouseover', () =>
			FormUtilities.setButtonTextureOnMouseIn(playButton)
		);
		playButton.addEventListener('mouseout', () =>
			FormUtilities.setButtonTextureOnMouseOut(playButton)
		);

		optionButton.addEventListener('click', () => this.loadOptions());
		optionButton.addEventListener('mouseover', () =>
			FormUtilities.setButtonTextureOnMouseIn(optionButton)
		);
		optionButton.addEventListener('mouseout', () =>
			FormUtilities.setButtonTextureOnMouseOut(optionButton)
		);

		helpButton.addEventListener('click', () => {
			menuContainer.setVisible(false);
			helpMenu.setVisible(true);
		});
		helpButton.addEventListener('mouseover', () =>
			FormUtilities.setButtonTextureOnMouseIn(helpButton)
		);
		helpButton.addEventListener('mouseout', () =>
			FormUtilities.setButtonTextureOnMouseOut(helpButton)
		);

		helpMenu.setInteractive();
		helpMenu.on(
			'pointerdown',
			() => {
				helpMenu.setVisible(false);
				menuContainer.setVisible(true);
			},
			this
		);
	}

	private askForUpdatedGameList() {
		this.socket.emit(Constant.MESSAGE.ASK_GAME_LIST);
		this.nextUpdateTime = Date.now() + 1000;
	}

	public update(): void {
		//if (Date.now() >= this.nextUpdateTime) this.askForUpdatedGameList();
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

	private joinGame(): void {
		this.playerName = this.inputBox.getChildByName('name').value;
		this.gameid = this.inputBox.getChildByName('dropdownList').value;

		if (this.gameid == '') this.gameid = undefined;

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

		this.scene.start(mainScene.Name, {
			socket: this.socket,
		});
	}

	private failedToJoinGame(message: string) {
		this.socket.off(Constant.MESSAGE.JOIN_GAME_SUCCESS);
		console.log(message);
		//TODO make error message fancier
	}

	private loadOptions(): void {
		//TODO remove options?
	}
}
