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
		this.load.image('aliem', '../assets/Character.png');
		this.load.image('bullet', '../assets/bullet.png');
		this.load.image('forest', '../assets/ForestGlade.jpg');
	}

	init() {
		//TODO what should we move from create to init?
	}

	create(): void {
		this.otherPlayerSprites = new Map(); 
		this.bulletSprites = new Map(); 
		this.socket = io();

		this.add.image(0, 0, 'forest');

		this.myPlayerSprite = this.add.sprite(0, 0, 'aliem');
		this.myPlayerSprite.setVisible(false);
		this.myPlayerSprite.setScale(0.25);

		this.cameras.main.startFollow(this.myPlayerSprite, true);
		this.cameras.main.setZoom(0.5);
		//this.cameras.main.setBounds(0,0,1920, 1080);

		this.cursors = this.input.keyboard.addKeys({
			up:		Phaser.Input.Keyboard.KeyCodes.W,
			down:	Phaser.Input.Keyboard.KeyCodes.S,
			left:	Phaser.Input.Keyboard.KeyCodes.A,
			right:	Phaser.Input.Keyboard.KeyCodes.D
		});

		this.input.on('pointerdown', (pointer) => {
			const gamePos = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
			const direction = Math.atan2(gamePos.x - this.myPlayerSprite.x, gamePos.y - this.myPlayerSprite.y);
			this.socket.emit(Constant.MESSAGE.SHOOT, direction);
		});
		
		this.socket.on(Constant.MESSAGE.GAME_UPDATE, this.updateState.bind(this));
		this.socket.emit(Constant.MESSAGE.JOIN);
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

		if (!isNaN(direction))
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
		this.bulletSprites = this.updateMapOfObjects(bullets, this.bulletSprites, 'bullet');
		//TODO may not be necessary for bullets
	}

	private updateMapOfObjects(currentObjects: any, oldObjects: Map<string, Phaser.GameObjects.Sprite>, sprite: string) {
		let updatedObjects = new Map();
		currentObjects.forEach(bullet => {
			let newBullet;
			if (oldObjects.has(bullet.id)) {
				newBullet = oldObjects.get(bullet.id);
				oldObjects.delete(bullet.id);
				newBullet.setPosition(bullet.xPos, bullet.yPos);
			} else {
				newBullet = this.add.sprite(bullet.xPos, bullet.yPos, sprite);
			}
			updatedObjects.set(bullet.id, newBullet);
		});
		for (const anOldBullet of oldObjects.values()) {
			anOldBullet.destroy();
		}
		return updatedObjects;
	}

	private updateOpponents(otherPlayers: any) {
		this.otherPlayerSprites = this.updateMapOfObjects(otherPlayers, this.otherPlayerSprites, 'aliem');
	}
}



