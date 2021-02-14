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

	init() {
		//TODO what should we move from create to init?
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
		this.cameras.main.setZoom(0.5);

		this.cursors = this.input.keyboard.addKeys({
			up:		Phaser.Input.Keyboard.KeyCodes.W,
			down:	Phaser.Input.Keyboard.KeyCodes.S,
			left:	Phaser.Input.Keyboard.KeyCodes.A,
			right:	Phaser.Input.Keyboard.KeyCodes.D
		});

		this.input.on('pointerdown', (pointer) => {
			const gamePos = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
			const direction = Math.atan2(gamePos.x - this.myPlayerSprite.x, gamePos.y- this.myPlayerSprite.y);
			this.socket.emit(Constant.MESSAGE.SHOOT, direction);
		});
  	}

	update () {
		let direction: number = NaN;
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

		if (direction != NaN)
			this.socket.emit(Constant.MESSAGE.MOVEMENT, direction);
	}

	updateState(update: any): void { //TODO may state type
		const { time, currentPlayer, otherPlayers, bullets } = update;
		if (currentPlayer == null)
			return;

		this.updatePlayer(currentPlayer);

		this.updateBullets(bullets);

		this.updateOpponents(otherPlayers);
	}

	private updatePlayer(currentPlayer: any) {
		this.myPlayerSprite.setPosition(currentPlayer.xPos, currentPlayer.yPos);
		if (!this.myPlayerSprite.visible)
			this.myPlayerSprite.setVisible(true);
	}

	private updateBullets(bullets: any) {
		bullets.forEach(bullet => {
			if (this.bulletSprites.has(bullet.id)) {
				this.bulletSprites.get(bullet.id)!.setPosition(bullet.xPos, bullet.yPos);
			} else {
				let newBullet = this.add.sprite(bullet.xPos, bullet.yPos, 'bullet');
				this.bulletSprites.set(bullet.id, newBullet);
			}
			//TODO has a memmory leak
			//TODO may not be necessary
		});
	}

	private updateOpponents(otherPlayers: any) {
		otherPlayers.forEach(opp => {
			if (this.otherPlayerSprites.has(opp.id)) {
				this.otherPlayerSprites.get(opp.id)!.setPosition(opp.xPos, opp.yPos);
			} else {
				let newPlayer = this.add.sprite(opp.xPos, opp.yPos, 'aliem');
				this.otherPlayerSprites.set(opp.id, newPlayer);
			}
			//TODO has a memmory leak
		});
	}
}



