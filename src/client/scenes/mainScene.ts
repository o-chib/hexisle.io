import io from 'socket.io-client';
import { HexTiles, OffsetPoint, Tile, Point } from './../../shared/hexTiles';

const Constant = require('./../../shared/constants');

export default class MainScene extends Phaser.Scene {
	private myPlayerSprite: Phaser.GameObjects.Sprite;
	private otherPlayerSprites: Map<string, Phaser.GameObjects.Sprite>;
	private bulletSprites: Map<string, Phaser.GameObjects.Sprite>;
	private wallSprites: Map<string, Phaser.GameObjects.Sprite>;
	private campfireSprites: Map<string, Phaser.GameObjects.Sprite>;
	private cursors /*:Phaser.Types.Input.Keyboard.CursorKeys*/;
	private socket: SocketIOClient.Socket;
	private alive: boolean;
	private deadObjects;
	private territorySprites: Map<string, Phaser.GameObjects.Sprite>;
	private globalGraphics: Phaser.GameObjects.Graphics;

	//private graphics: Phaser.GameObjects.Graphics; // OLD, will remove later

	private graphic_BG: Phaser.GameObjects.Graphics; // static background
	//private graphic_Tex: Phaser.GameObjects.Graphics; // texture data
	//private graphic_Map: Phaser.GameObjects.Graphics; // Strokes for hexagons
	private graphic_Front: Phaser.GameObjects.Graphics; // Frontmost sprites = player, buildings, etc

	private tiles: Tile[]; // Made in offset even-q coordinates
	private hexTiles: HexTiles;

	// HexTile

	constructor() {
		super('MainScene');
		this.tiles = [];
		this.hexTiles = new HexTiles();
	}

	preload(): void {
		this.load.image('aliem', '../assets/Character.png');
		this.load.image('aliemblue', '../assets/CharacterBlue.png');
		this.load.image('bullet', '../assets/bullet.png');
		this.load.image('bulletblue', '../assets/bulletblue.png');
		this.load.image('wall', '../assets/tempwall.png'); //TODO
		this.load.image('wallblue', '../assets/tempwallblue.png'); //TODO
		this.load.image('campfire_unlit', '../assets/campfire_unlit.png');
		this.load.image('campfire_lit', '../assets/campfire_lit.png');
		this.load.image(
			'texture',
			'../assets/Texture - Mossy Floor - Green 2.jpg'
		);
	}

	init(): void {
		//TODO what should we move from create to init?
	}

	create(): void {
		this.otherPlayerSprites = new Map();
		this.bulletSprites = new Map();
		this.wallSprites = new Map();
		this.campfireSprites = new Map();
		this.deadObjects = new Set();
		this.territorySprites = new Map();
		this.socket = io();

		this.socket.on(
			Constant.MESSAGE.INITIALIZE,
			this.initializeGame.bind(this)
		);

		this.socket.emit(Constant.MESSAGE.JOIN);

		// Graphic Handling
		this.graphic_BG = this.add.graphics();
		//this.graphic_Tex = this.add.graphics();
		//this.graphic_Map = this.add.graphics();
		this.graphic_Front = this.add.graphics();
	}

	private initializeGame(update: any): void {
		const { player, tileMap } = update;
		if (player == null) return;

		this.createTileMap(tileMap);

		if (player.teamNumber == 0) {
			// Change this when more than 2 teams
			this.myPlayerSprite = this.add.sprite(0, 0, 'aliem').setDepth(1000);
		} else {
			this.myPlayerSprite = this.add
				.sprite(0, 0, 'aliemblue')
				.setDepth(1000);
		}

		this.myPlayerSprite.setVisible(false);
		this.alive = true;
		this.myPlayerSprite.setScale(1);

		this.cameras.main.startFollow(this.myPlayerSprite, true);
		this.cameras.main.setZoom(0.5);

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

		this.input.keyboard.on(
			'keydown',
			this.updateMovementDirection.bind(this)
		);
		this.input.keyboard.on(
			'keyup',
			this.updateMovementDirection.bind(this)
		);
	}

	private createTileMap(tileMap: any) {
		this.hexTiles.tileMap = tileMap;
		const graphic_Map = this.add.graphics();
		// masking logic
		const reveal = this.add
			.image(0, 0, 'texture')
			.setOrigin(0, 0)
			.setDepth(-1)
			.setScale(3);
		this.drawAllTiles(graphic_Map);
		//this.setMapMask(reveal, graphic_Map);

		this.generateTerritoryTexture(this.hexTiles.tileMap[0][0]);

		// for (let col = 0; col < this.hexTiles.tileMap.length; col++) {
		// 	for (let row = 0; row < this.hexTiles.tileMap[col].length; row++) {
		// 		let spr = this.add.sprite(this.hexTiles.tileMap[col][row].cartesian_coord.x, this.hexTiles.tileMap[col][row].cartesian_coord.y, 'white-tile');
		// 		//spr.setVisible(false);
		// 		this.territorySprites.set(this.hexTiles.tileMap[col][row], spr);
		// 	}
		// }

		graphic_Map.generateTexture(
			'hexMap',
			Constant.DEFAULT_WIDTH,
			Constant.DEFAULT_HEIGHT
		);
		this.add.sprite(0, 0, 'hexMap').setOrigin(0, 0).setDepth(-1);
		graphic_Map.destroy();
	}

	drawAllTiles(graphic_Map): void {
		// draws every arena/map hex we have in our tilemap

		if (!this.hexTiles.tileMap) return;

		// for each column
		for (let col = 0; col < this.hexTiles.tileMap.length; col++) {
			// for each row
			for (let row = 0; row < this.hexTiles.tileMap[col].length; row++) {
				if (
					this.hexTiles.tileMap[col][row].building !=
						Constant.BUILDING.OUT_OF_BOUNDS &&
					this.hexTiles.tileMap[col][row].building !=
						Constant.BUILDING.BOUNDARY
				) {
					//TODO cannot put isInBounds here?
					this.drawTile(this.hexTiles.tileMap[col][row], graphic_Map);
				}
			}
		}
	}

	drawTiles(tiles: Tile[]): void {
		// draws every tile we have in our nearby tile list
		for (const tile of tiles) {
			//this.drawTile(tile);
		}
	}

	drawTile(tile: Tile, graphics: Phaser.GameObjects.Graphics): void {
		// takes XY coordinates of center point,
		// generates all required vertices
		// draws individual tile
		if (tile.building == Constant.BUILDING.OUT_OF_BOUNDS) {
			return;
		}

		graphics.fillStyle(0x000000, 0);

		const points: Point[] = this.hexTiles.getHexPointsFromCenter(
			tile.cartesian_coord
		);

		if (tile.building == Constant.BUILDING.CAMP) {
			graphics.lineStyle(4, 0xff0000, 1);
		} else if (tile.building == Constant.BUILDING.BASE) {
			graphics.lineStyle(6, 0x00ffcc, 1);
		} else {
			graphics.lineStyle(2, 0xffffff, 1);
		}

		graphics.beginPath();
		graphics.moveTo(points[0].xPos, points[0].yPos);
		for (let i = 0; i < 6; i++) {
			graphics.lineTo(points[i].xPos, points[i].yPos);
		}
		graphics.closePath();

		graphics.fillPath();
		graphics.strokePath();
	}

	generateTerritoryTexture(tile: Tile): void {
		// takes XY coordinates of center point,
		// generates all required vertices
		// draws individual tile

		const points: Point[] = this.hexTiles.getHexPointsFromCenter(
			tile.cartesian_coord
		);

		let colorName = '';
		for (let i = 0; i < Constant.TEAM_COUNT; i++) {
			const graphics = this.add.graphics();

			graphics.beginPath();
			graphics.moveTo(points[0].xPos, points[0].yPos);

			for (let i = 0; i < 6; i++) {
				graphics.lineTo(points[i].xPos, points[i].yPos);
			}
			graphics.closePath();

			if (i == 0) {
				graphics.fillStyle(0xff0000, 0.2);
				graphics.lineStyle(4, 0xff0000, 0.2);
				colorName = 'red-territory';
			} else if (i == 1) {
				graphics.fillStyle(0x3333ff, 0.2);
				graphics.lineStyle(4, 0x3333ff, 0.2);
				colorName = 'blue-territory';
			}

			graphics.fillPath();

			graphics.generateTexture(
				colorName,
				this.hexTiles.getHexWidth(),
				this.hexTiles.getHexHeight()
			);

			graphics.destroy();
		}

		// graphics.fillStyle(0xffffff, 0.2);
		// graphics.fillPath();
		// graphics.generateTexture('white-tile',
		// 	this.hexTiles.getHexWidth(),
		// 	this.hexTiles.getHexHeight());

		// graphics.destroy();
	}

	// Masking
	// Alpha Mask
	setMapMask(
		reveal: Phaser.GameObjects.Image,
		graphic_Map: Phaser.GameObjects.Graphics
	): void {
		// Masks the texture image using the total hexagonal tile map
		const hexBrush = graphic_Map.createGeometryMask();
		reveal.setMask(hexBrush);
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
			//		changedTiles,
			bullets,
			walls,
			campfires,
			territories,
		} = update;
		if (currentPlayer == null) return;

		this.updatePlayer(currentPlayer);

		this.updateBullets(bullets);

		this.updateOpponents(otherPlayers);

		this.updateWalls(walls);

		this.updateCampfires(campfires);

		// this.updateChangedTiles(changedTiles);

		this.updateTerritories(territories);

		this.events.emit('updateHUD', currentPlayer);

		//this.globalGraphics.destroy();
		//this.globalGraphics = this.add.graphics();
		// Redraw any updated tiles
		//		for (const tile of changedTiles) {
		//			this.hexTiles.tileMap[tile.offset_coord.q][tile.offset_coord.r] = tile;
		//		}
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
	private updateCampfires(campfires: any) {
		this.updateMapOfObjects(
			campfires,
			this.campfireSprites,
			'campfire_unlit',
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			(newCampfire, newCampfireLiteral) => {
				if (newCampfireLiteral.teamNumber != -1)
					newCampfire.setTexture('campfire_lit').setDepth(0);
				else newCampfire.setTexture('campfire_unlit').setDepth(0);
				return newCampfire;
			}
		);
	}

	private updateTerritories(territories: any) {
		this.updateMapOfObjects(
			territories,
			this.territorySprites,
			'red-territory',
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			(changedTilesNewTile, changedTilesCurrentTile) => {
				if (changedTilesCurrentTile.teamNumber == 0) {
					changedTilesNewTile.setTexture('red-territory');
					changedTilesNewTile.setVisible(true).setDepth(-1);
				} else if (changedTilesCurrentTile.teamNumber == 1) {
					changedTilesNewTile.setTexture('blue-territory');
					changedTilesNewTile.setVisible(true).setDepth(-1);
				}
				return changedTilesNewTile;
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
					newPlayer.setTexture('aliemblue').setDepth(1000);
				if (playerLiteral.teamNumber == 0) newPlayer.setDepth(1000);
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
