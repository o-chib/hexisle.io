import io from 'socket.io-client'
//import playerData from '../../shared/playerData';

const Constant = require('./../../shared/constants');

export default class MainScene extends Phaser.Scene {	
	private myPlayerSprite: Phaser.GameObjects.Sprite;
	private otherPlayerSprites: Map<string, Phaser.GameObjects.Sprite>;
	socket: SocketIOClient.Socket;

	constructor() {
		super('MainScene');
	}

	preload(): void {
		this.load.image('aliem', '../assets/Alien-thumb.jpg');
		this.load.image('rainbow', '../assets/rainbow.bmp');
		this.load.image('background', '../assets/background.jpg');
	}

	create(): void {
		this.otherPlayerSprites = new Map(); 
		this.socket = io();
		this.socket.emit(Constant.MESSAGE.JOIN);
		this.socket.on(Constant.MESSAGE.GAME_UPDATE, this.updateState.bind(this));
		this.add.sprite(200, 200, 'rainbow');
		this.myPlayerSprite = this.add.sprite(0, 0, 'aliem');
		this.myPlayerSprite.setVisible(false);

		this.cameras.main.startFollow(this.myPlayerSprite, true);

		this.input.keyboard.on('keydown', (event) => {
			let direction: number; //TODO make movement smoother
			switch(event.key) {
				case "w": direction = Math.PI / 2; break;
				case "d": direction = 0; break;   // Up, Angle = -90??
				case "s": direction = 1.5 * Math.PI; break; // Down, Angle = 90??
				case "a": direction = Math.PI; break;
				default: return;
			} 
			this.socket.emit(Constant.MESSAGE.MOVEMENT, direction);
		});

  	}

	updateState(update: any): void { //TODO may state type
		const { time, currentPlayer, otherPlayers } = update;
		if (!currentPlayer) {
			return;
		}
		
		// Draw background
		// Draw all players
		this.myPlayerSprite.setPosition(currentPlayer.xPos, currentPlayer.yPos);
		if (!this.myPlayerSprite.visible)
			this.myPlayerSprite.setVisible(true);

		
		otherPlayers.forEach( opp => {
			if (this.otherPlayerSprites.has(opp.socketID)) {
				this.otherPlayerSprites.get(opp.socketID)!.setPosition(opp.xPos, opp.yPos);
			} else {
				let newPlayer = this.add.sprite(opp.xPos, opp.yPos, 'aliem');
				this.otherPlayerSprites.set(opp.socketID, newPlayer);
			}
			//TODO memory leak where old sprites dont get removed
		});
	}
}



