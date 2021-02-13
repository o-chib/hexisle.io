import io from 'socket.io-client'
//import playerData from '../../shared/playerData';

const Constant = require('./../../shared/constants');

export default class MainScene extends Phaser.Scene {	
	private myPlayerSprite: Phaser.GameObjects.Sprite;
	private otherPlayerSprites: Map<string, Phaser.GameObjects.Sprite>;
	private bulletSprites: Map<string, Phaser.GameObjects.Sprite>;
	private cursors /*:Phaser.Types.Input.Keyboard.CursorKeys*/;
	private socket: SocketIOClient.Socket;

	constructor() {
		super('MainScene');
	}

	preload(): void {
		this.load.image('aliem', '../assets/Alien-thumb.jpg');
		this.load.image('rainbow', '../assets/rainbow.bmp');
		this.load.image('bullet', '../assets/bullet.png');
	}

	create(): void {
		this.otherPlayerSprites = new Map(); 
		this.bulletSprites = new Map(); 
		this.socket = io();
		this.socket.emit(Constant.MESSAGE.JOIN);
		this.socket.on(Constant.MESSAGE.GAME_UPDATE, this.updateState.bind(this));
		this.add.sprite(200, 200, 'rainbow');
		this.myPlayerSprite = this.add.sprite(0, 0, 'aliem');
		this.myPlayerSprite.setVisible(false);

		this.cameras.main.startFollow(this.myPlayerSprite, true);
        // this.cursors = this.input.keyboard.createCursorKeys();
		this.cursors = this.input.keyboard.addKeys({
			up:		Phaser.Input.Keyboard.KeyCodes.W,
			down:	Phaser.Input.Keyboard.KeyCodes.S,
			left:	Phaser.Input.Keyboard.KeyCodes.A,
			right:	Phaser.Input.Keyboard.KeyCodes.D
		});

		this.input.on('pointerdown', (pointer) => {
			const direction = Math.atan2(window.innerHeight / 2 - pointer.y, pointer.x - window.innerWidth / 2);
			this.socket.emit(Constant.MESSAGE.SHOOT, direction);
		});

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
		const { time, currentPlayer, otherPlayers, bullets } = update;
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
			}
			//TODO memory leak where old sprites dont get removed
		});

		bullets.forEach( bullet => {
			if (this.bulletSprites.has(bullet.id)) {
				this.bulletSprites.get(bullet.id)!.setPosition(bullet.xPos, bullet.yPos);
			} else {
				let newBullet = this.add.sprite(bullet.xPos, bullet.yPos, 'bullet');
				this.bulletSprites.set(bullet.id, newBullet);
			}
			//TODO memory leak where old sprites dont get removed
			//TODO prob dont need to update position as bullets cannot change trajectory, just check if it still exits
		});
	}
}



