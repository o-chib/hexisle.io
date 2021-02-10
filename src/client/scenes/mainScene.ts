import io from 'socket.io-client'
//import playerData from '../../shared/playerData';

const Constant = require('./../../shared/constants');

export default class MainScene extends Phaser.Scene {	
	private myPlayerSprite: Phaser.GameObjects.Sprite;
	socket: SocketIOClient.Socket;

	constructor() {
		super('MainScene');
	}

	preload(): void {
		this.load.image('aliem', '../assets/Alien-thumb.jpg');
		this.load.image('rainbow', '../assets/rainbow.bmp');
	}

	create(): void {
		this.socket = io();
		this.socket.emit(Constant.MESSAGE.JOIN);
		this.socket.on(Constant.MESSAGE.GAME_UPDATE, this.updateState.bind(this));
		this.add.sprite(200, 200, 'rainbow');
		this.myPlayerSprite = this.add.sprite(0, 0, 'aliem');
		this.myPlayerSprite.setVisible(false);
		this.cameras.main.startFollow(this.myPlayerSprite, true);
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
			this.add.sprite(opp.xPos, opp.yPos, 'aliem');
		});
	}
}
