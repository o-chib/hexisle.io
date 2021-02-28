import io from 'socket.io-client';
import { HexTiles, OffsetPoint, Tile, Point } from './../../shared/hexTiles';

const Constant = require('./../../shared/constants');

export default class MainScene extends Phaser.Scene {
	private myPlayerSprite: Phaser.GameObjects.Sprite;
	private otherPlayerSprites: Map<string, Phaser.GameObjects.Sprite>;
	private bulletSprites: Map<string, Phaser.GameObjects.Sprite>;
	private wallSprites: Map<string, Phaser.GameObjects.Sprite>;
	private cursors /*:Phaser.Types.Input.Keyboard.CursorKeys*/;
	private socket: SocketIOClient.Socket;
	private alive: boolean;
	private deadObjects;

	private graphic_BG: Phaser.GameObjects.Graphics; // static background
	private graphic_Tex: Phaser.GameObjects.Graphics; // texture data
	private graphic_Map: Phaser.GameObjects.Graphics; // Strokes for hexagons
	private graphic_Front: Phaser.GameObjects.Graphics; // Frontmost sprites = player, buildings, etc

	// HexTile
	private tiles: Tile[]; // Made in offset even-q coordinates
	private hexTiles: HexTiles;

	constructor() {
		super('MainScene');
		this.tiles = [];
		this.hexTiles = new HexTiles(Constant.WALL_RADIUS, Constant.CAMP_RADIUS, Constant.DEFAULT_HEIGHT);
	}

	preload(): void {
		this.load.image('aliem', '../assets/Character.png');
		this.load.image('aliemblue', '../assets/CharacterBlue.png');
		this.load.image('bullet', '../assets/bullet.png');
		this.load.image('bulletblue', '../assets/bulletblue.png');
		this.load.image('wall', '../assets/tempwall.png'); //TODO
		this.load.image('wallblue', '../assets/tempwallblue.png'); //TODO
		this.load.image('tile_tex', '../assets/tile_tex.png');
	}

	init(): void {
		//TODO what should we move from create to init?
	}

	create(): void {
		this.otherPlayerSprites = new Map();
		this.bulletSprites = new Map();
		this.wallSprites = new Map();
		this.deadObjects = new Set();
		this.socket = io();

		// Graphic Handling
		this.graphic_BG = this.add.graphics();
		this.graphic_Tex = this.add.graphics();
		this.graphic_Map = this.add.graphics();
		this.graphic_Front = this.add.graphics();

		this.cursors = this.input.keyboard.addKeys({
			up: Phaser.Input.Keyboard.KeyCodes.W,
			down: Phaser.Input.Keyboard.KeyCodes.S,
			left: Phaser.Input.Keyboard.KeyCodes.A,
			right: Phaser.Input.Keyboard.KeyCodes.D,
			buildWall: Phaser.Input.Keyboard.KeyCodes.E,
		});

		this.input.on('pointerdown', (pointer) => {
			if (!this.alive) return;
			const gamePos = this.cameras.main.getWorldPoint(
				pointer.x,
				pointer.y
			);
			const direction = Math.atan2(
				gamePos.x - this.myPlayerSprite.x,
				gamePos.y - this.myPlayerSprite.y
			);
			this.socket.emit(Constant.MESSAGE.SHOOT, direction);
		});

		setInterval(() => {
			const gamePos = this.cameras.main.getWorldPoint(
				this.input.mousePointer.x,
				this.input.mousePointer.y
			);
			const direction = Math.atan2(
				gamePos.x - this.myPlayerSprite.x,
				gamePos.y - this.myPlayerSprite.y
			);
			this.myPlayerSprite.setRotation(-1 * direction);
			this.socket.emit(Constant.MESSAGE.ROTATE, direction);
		}, 1000 / 60);

		this.socket.on(
			Constant.MESSAGE.GAME_UPDATE,
			this.updateState.bind(this)
		);

		this.socket.on(
			Constant.MESSAGE.INITIALIZE,
			this.initializeGame.bind(this)
		);

		this.socket.emit(Constant.MESSAGE.JOIN);

		this.input.keyboard.on(
			'keydown',
			this.updateMovementDirection.bind(this)
		);
		this.input.keyboard.on(
			'keyup',
			this.updateMovementDirection.bind(this)
		);
	}

	private initializeGame(update: any): void {
		const { player, tileMap } = update;
		if (player == null) return;

		this.createTileMap(tileMap);

		if (player.teamNumber == 0) {
			// Change this when more than 2 teams
			this.myPlayerSprite = this.add.sprite(0, 0, 'aliem');
		} else {
			this.myPlayerSprite = this.add.sprite(0, 0, 'aliemblue');
		}

		this.myPlayerSprite.setVisible(false);
		this.alive = true;
		this.myPlayerSprite.setScale(1);

		this.cameras.main.startFollow(this.myPlayerSprite, true);
		this.cameras.main.setZoom(0.5);
	}

	private createTileMap(tileMap: any) {
		// Init the tileMap and draws all tiles to generate overall masking
		// bakes the tiles after
		// draws the texture file tiled to encompass the game scene
		if (!this.hexTiles.tileMap) {
			this.hexTiles.tileMap = tileMap;

			this.drawAllTiles();
		}
	}

	drawAllTiles(): void {
		// draws every arena/map hex we have in our tilemap

		if (!this.hexTiles.tileMap) {
			return;
		}
		// for each column
		for (let col = 0; col < this.hexTiles.tileMap.length; col++) {
			// for each row
			for (let row = 0; row < this.hexTiles.tileMap[col].length; row++) {
				if (this.hexTiles.tileMap[col][row].tileType != 'empty') {
					// draw tile
					this.graphic_Map.scene.add.image(
						this.hexTiles.tileMap[col][row].cartesian_coord.x,
						this.hexTiles.tileMap[col][row].cartesian_coord.y,
						'tile_tex')
						.setDisplaySize(this.hexTiles.getHexWidth(), this.hexTiles.getHexHeight())
						.setDepth(-100);
				}
			}
		}

	}

	drawTiles(tiles: Tile[]): void {
		// draws every tile we have in our nearby tile list

		for (const tile of tiles) {
			this.drawTile(tile);
		}
	}

	drawTile(tile: Tile): void {
		// takes XY coordinates of center point,
		// generates all required vertices
		// draws individual tile
		let graphics = this.graphic_Map;
		graphics.fillStyle(0x000000, 0);

		const points: Point[] = this.hexTiles.getHexPointsFromCenter(tile.cartesian_coord);

		if (tile.building == 'camp') {
			graphics.lineStyle(4, 0xff0000, 1);
		} else if (tile.building == 'ring') {
			graphics.lineStyle(1, 0x002fff, 1);
		} else if (tile.building == 'select') {
			graphics.lineStyle(2, 0xffb300, 1);
		} else {
			graphics.lineStyle(2, 0xffffff, 1);
		}

		graphics.beginPath();
		graphics.moveTo(points[0].x, points[0].y);
		for (let i = 0; i < 6; i++) {
			graphics.lineTo(points[i].x, points[i].y);
		}
		graphics.closePath();

		graphics.fillPath().setDepth(-100);
		graphics.strokePath().setDepth(-100);

	}

	update(): void {
		//this.updateMovementDirection();
	}

	private updateMovementDirection(): void {
		let direction = NaN;
		//TODO really gross can we clean this?
		if (this.cursors.left.isDown && !this.cursors.right.isDown) {
			if (this.cursors.up.isDown && !this.cursors.down.isDown)
				direction = Constant.DIRECTION.NW;
			else if (this.cursors.down.isDown && !this.cursors.up.isDown)
				direction = Constant.DIRECTION.SW;
			else direction = Constant.DIRECTION.W;
		} else if (this.cursors.right.isDown && !this.cursors.left.isDown) {
			if (this.cursors.up.isDown && !this.cursors.down.isDown)
				direction = Constant.DIRECTION.NE;
			else if (this.cursors.down.isDown && !this.cursors.up.isDown)
				direction = Constant.DIRECTION.SE;
			else direction = Constant.DIRECTION.E;
		} else {
			if (this.cursors.up.isDown && !this.cursors.down.isDown)
				direction = Constant.DIRECTION.N;
			else if (this.cursors.down.isDown && !this.cursors.up.isDown)
				direction = Constant.DIRECTION.S;
		}

		this.socket.emit(Constant.MESSAGE.MOVEMENT, direction);

		if (this.cursors.buildWall.isDown) {
			if (!this.alive) return;
			const gamePos = this.cameras.main.getWorldPoint(
				this.input.mousePointer.x,
				this.input.mousePointer.y
			);
			const coord: OffsetPoint = this.hexTiles.cartesianToOffset(
				new Point(gamePos.x, gamePos.y)
			);
			this.socket.emit(Constant.MESSAGE.TILE_CHANGE, coord);
		}
	}

	updateState(update: any): void {
		//TODO may state type
		const {
			currentPlayer,
			otherPlayers,
			changedTiles,
			bullets,
			walls,
		} = update;
		if (currentPlayer == null) return;

		this.updatePlayer(currentPlayer);

		this.updateBullets(bullets);

		this.updateOpponents(otherPlayers);

		this.updateWalls(walls);

		this.events.emit('updateHUD', currentPlayer);

		// Redraw any updated tiles
		for (const tile of changedTiles) {
			console.log(
				'redrawing tile',
				tile.offset_coord.q,
				tile.offset_coord.r
			);
			this.drawTile(tile);
		}
	}

	private updateWalls(walls: any) {
		this.updateMapOfObjects(
			walls,
			this.wallSprites,
			'wall',
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			(newWall, newWallLiteral) => {
				if (newWallLiteral.teamNumber == 1)
					newWall.setTexture('wallblue');
				return newWall;
			}
		);
	}

	private updatePlayer(currentPlayer: any) {
		this.myPlayerSprite.setPosition(currentPlayer.xPos, currentPlayer.yPos);
		if (this.alive && !this.myPlayerSprite.visible)
			this.myPlayerSprite.setVisible(true);
	}

	private updateBullets(bullets: any) {
		this.updateMapOfObjects(
			bullets,
			this.bulletSprites,
			'bullet',
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			(newBullet, newBulletLiteral) => {
				if (newBulletLiteral.teamNumber == 1)
					newBullet.setTexture('bulletblue');
				return newBullet;
			}
		);
		//TODO may not be necessary for bullets
	}

	private updateOpponents(otherPlayers: any) {
		this.updateMapOfObjects(
			otherPlayers,
			this.otherPlayerSprites,
			'aliem',
			(newPlayer, playerLiteral) => {
				newPlayer.setRotation(-1 * playerLiteral.direction);
				if (playerLiteral.teamNumber == 1)
					newPlayer.setTexture('aliemblue');
				return newPlayer;
			}
		);
	}

	private updateMapOfObjects(
		currentObjects: any,
		oldObjects: Map<string, Phaser.GameObjects.Sprite>,
		sprite: string,
		callback: (arg0: any, arg1: any) => any
	) {
		this.deadObjects.clear();
		currentObjects.forEach((obj) => {
			let newObj;
			if (oldObjects.has(obj.id)) {
				newObj = oldObjects.get(obj.id);
				newObj.setPosition(obj.xPos, obj.yPos);
			} else {
				newObj = this.add.sprite(obj.xPos, obj.yPos, sprite);
				oldObjects.set(obj.id, newObj);
			}
			this.deadObjects.add(obj.id);
			callback(newObj, obj);
		});
		for (const anOldKey of oldObjects.keys()) {
			if (this.deadObjects.has(anOldKey)) continue;
			oldObjects.get(anOldKey)?.destroy();
			oldObjects.delete(anOldKey);
		}
	}

}
