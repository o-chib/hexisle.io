import io from 'socket.io-client'
//import playerData from '../../shared/playerData';

const Constant = require('./../../shared/constants');

export default class MainScene extends Phaser.Scene {	
	private myPlayerSprite: Phaser.GameObjects.Sprite;
	private otherPlayerSprites: Map<string, Phaser.GameObjects.Sprite>;
	private cursors;
	private socket: SocketIOClient.Socket;

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
        this.cursors = this.input.keyboard.createCursorKeys();

		/*this.input.keyboard.on('keydown', (event) => {
			let direction: number; //TODO make movement smoother
			switch(event.key) {
				case "w": direction = Math.PI / 2; break;
				case "d": direction = 0; break;   // Up, Angle = -90??
				case "s": direction = 1.5 * Math.PI; break; // Down, Angle = 90??
				case "a": direction = Math.PI; break;
				default: return;
			} 
			this.socket.emit(Constant.MESSAGE.MOVEMENT, direction);
		});*/

  	}

	update () {
		let direction: number = -1;
		//TODO really gross can we clean this?
		if (this.cursors.left.isDown && !this.cursors.right.isDown) {
			if (this.cursors.up.isDown && !this.cursors.down.isDown)
				direction = Constant.DIRECTION.NW;
			else if (this.cursors.down.isDown && !this.cursors.up.isDown)
				direction = Constant.DIRECTION.SW;
			else
				direction = Constant.DIRECTION.W;
		} else if (this.cursors.right.isDown && !this.cursors.left.isDown) {
			if (this.cursors.up.isDown && !this.cursors.down.isDown)
				direction = Constant.DIRECTION.NE;
			else if (this.cursors.down.isDown && !this.cursors.up.isDown)
				direction = Constant.DIRECTION.SE;
			else
				direction = Constant.DIRECTION.E;
		} else {
			if (this.cursors.up.isDown && !this.cursors.down.isDown)
				direction = Constant.DIRECTION.N;
			else if (this.cursors.down.isDown && !this.cursors.up.isDown)
				direction = Constant.DIRECTION.S;
		}

		if (direction != -1) {
			this.socket.emit(Constant.MESSAGE.MOVEMENT, direction);
		}
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
			if (this.otherPlayerSprites.has(opp.id)) {
				this.otherPlayerSprites.get(opp.id)!.setPosition(opp.xPos, opp.yPos);
			} else {
				let newPlayer = this.add.sprite(opp.xPos, opp.yPos, 'aliem');
				this.otherPlayerSprites.set(opp.id, newPlayer);
				console.log("new opponent")
			}
			//TODO memory leak where old sprites dont get removed
		});
	}
}



