import mainScene from './mainScene';
import Utilities from './Utilities';
import { Constant } from './../../shared/constants';

export default class MainMenu extends Phaser.Scene {
	public static Name = 'MainMenu';
	private socket: SocketIOClient.Socket;
	private playerName = '';
	private gameid = '';
	private inputBox;

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
		this.socket.emit(Constant.MESSAGE.ASK_GAME_LIST);

		const renderWidth = this.game.renderer.width;
		const renderHeight = this.game.renderer.height;

		// Background image
		this.add.image(0,0, "lobby_bg").setOrigin(0).setDepth(0);

		// Container
		const menuContainer = this.add.container(renderWidth/2, 0);

		// Logo and Title
		const logoImg = this.add.image(0, renderHeight*0.20, "campfire_lit").setDepth(1);
		menuContainer.add(logoImg);
		const newGameText = this.add.image(0, logoImg.y+50, 'lobby_logo').setDepth(2).setScale(0.5);
		menuContainer.add(newGameText);

		// Form Box
		this.inputBox = this.add.dom(0, renderHeight*0.45).createFromCache("form").setDepth(1);
		menuContainer.add(this.inputBox);
		const submitKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

		// Buttons in a Container
		const playButton = this.add.image(0, renderHeight*0.55, "lobby_play").setDepth(1).setScale(0.75);
		menuContainer.add(playButton);
		const optionButton = this.add.image(0, renderHeight*0.65, "lobby_options").setDepth(1).setScale(0.75);
		menuContainer.add(optionButton);
		const helpButton = this.add.image(0, renderHeight*0.75, "lobby_help").setDepth(1).setScale(0.75);
		menuContainer.add(helpButton);
		const helpMenu = this.add.image(renderWidth/2, renderHeight/2, 'help_menu').setDepth(2).setVisible(false);

		// Interactions
		submitKey.on("down", event => {
			this.loadMainScene();
		});

		playButton.setInteractive();
		playButton.on(
			'pointerdown',
			() => {
				this.loadMainScene();
			},
			this
		);

		optionButton.setInteractive();
		optionButton.on(
			'pointerdown',
			() => {
				this.loadOptions();
			},
			this
		);

		helpButton.setInteractive();
		helpButton.on(
			'pointerdown',
			() => {
				menuContainer.setVisible(false);
				helpMenu.setVisible(true);
			},
			this
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

	private initializeLobbyList(lobbyList): void {
		let dropdownList = document.getElementById("dropdownList");

		for(let i=0; i<lobbyList.length; i++) {
			let option = document.createElement('option');
			option.value = lobbyList[i].gameid;
    		option.text = lobbyList[i].gameid + ' | ' + lobbyList[i].info.playerCount;
			dropdownList!.appendChild(option);
		}

		console.log(lobbyList);
	}

	private loadMainScene(): void {
		this.playerName = this.inputBox.getChildByName("name").value;
		this.gameid = this.inputBox.getChildByName("dropdownList").value;

		this.socket.emit(Constant.MESSAGE.JOIN_GAME, this.gameid, this.playerName);

		this.scene.start(mainScene.Name, {
			socket: this.socket,
		});
	}

	private loadOptions(): void {

	}
}
