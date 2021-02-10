import io from 'socket.io-client'
//import playerData from '../../shared/playerData';

const Constant = require('./../../shared/constants');

export default class MainScene extends Phaser.Scene {	
	private mySprite: Phaser.GameObjects.Sprite;
	socket: SocketIOClient.Socket;

	constructor() {
		super('MainScene');
	}

	preload(): void {
		this.load.image('aliem', '../assets/Alien-thumb.jpg');
	}

	create(): void {
		this.socket = io();
		this.socket.emit(Constant.MESSAGE.JOIN);
		this.socket.on(Constant.MESSAGE.GAME_UPDATE, this.updateState.bind(this));
  	}

	updateState(update: any): void { //TODO may state type
		console.log(update);
		const { time, currentPlayer, otherPlayers } = update;
		if (!currentPlayer) {
			return;
		}
		
		// Draw background
		// Draw all players
		this.mySprite = this.add.sprite(currentPlayer.xPos, currentPlayer.yPos, 'aliem');
		otherPlayers.forEach( opp => {
			this.add.sprite(opp.xPos, opp.yPos, 'aliem');
		});
	}
}
