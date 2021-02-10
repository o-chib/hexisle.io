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
		this.socket.on(Constant.MESSAGE.GAME_UPDATE, this.updateState);
  	}

	updateState(update: any): void { //TODO may state type
		const { time, me, others } = update;
		if (!me) {
			return;
		}
		
		// Draw background
		console.log("Im here");
		// Draw all players
		this.mySprite = this.add.sprite(me.xPos, me.yPos, 'aliem');
		others.forEach( opp => {
			this.add.sprite(opp.xPos, opp.yPos, 'aliem');
		});
	}
}
