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
	private deadObjects: Set<unknown>;
	private territorySprites: Map<string, Phaser.GameObjects.Sprite>;

	private hexTiles: HexTiles;

	constructor() {
		super('MainScene');
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
		this.initializeKeys();

		this.hexTiles = new HexTiles();
		this.otherPlayerSprites = new Map();
		this.bulletSprites = new Map();
		this.wallSprites = new Map();
		this.campfireSprites = new Map();
		this.deadObjects = new Set();
		this.territorySprites = new Map();
		this.socket = io();
	}

	create(): void {
		this.registerListeners();
		this.registerIntervals();

		this.socket.emit(Constant.MESSAGE.JOIN);
	}

	private registerListeners(): void {
		this.registerSocketListeners();
		this.registerInputListeners();
	}

	private registerSocketListeners(): void {
		this.socket.on(
			Constant.MESSAGE.INITIALIZE,
			this.initializeGame.bind(this)
		);

		this.socket.on(
			Constant.MESSAGE.GAME_UPDATE,
			this.updateState.bind(this)
		);
	}

	private registerInputListeners(): void {
		this.input.on('pointerdown', (pointer) => {
			if (!this.alive) return;
			const direction = this.getMouseDirection(pointer);

			this.socket.emit(Constant.MESSAGE.SHOOT, direction);
		});

		this.input.keyboard.on(
			'keydown',
			this.updateMovementDirection.bind(this)
		);

		this.input.keyboard.on(
			'keyup',
			this.updateMovementDirection.bind(this)
		);
	}

	private registerIntervals(): void {
		setInterval(() => {
			const direction = this.getMouseDirection(this.input.mousePointer);

			this.myPlayerSprite.setRotation(-1 * direction);
			this.socket.emit(Constant.MESSAGE.ROTATE, direction);
		}, 1000 / 60);
	}

	private getMouseDirection(pointer: any): any {
		const gamePos = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

		return Math.atan2(
			gamePos.x - this.myPlayerSprite.x,
			gamePos.y - this.myPlayerSprite.y
		);
	}

	private initializeGame(update: any): void {
		const { player, tileMap } = update;
		if (player == null) return;

		this.createTileMap(tileMap);

		this.initializePlayer(player);

		this.setCamera();
	}

	private initializePlayer(player: any): void {
		// Change this when more than 2 teams
		if (player.teamNumber == 0) {
			this.generatePlayerSprite('aliem');
		} else {
			this.generatePlayerSprite('aliemblue');
		}
	}

	private generatePlayerSprite(spriteName: string): void {
		this.myPlayerSprite = this.add.sprite(0, 0, spriteName).setDepth(1000);
		this.myPlayerSprite.setVisible(false);
		this.myPlayerSprite.setScale(1);
		this.alive = true;
	}

	private setCamera(): void {
		this.cameras.main.startFollow(this.myPlayerSprite, true);
		this.cameras.main.setZoom(0.5);
	}

	private initializeKeys(): void {
		this.cursors = this.input.keyboard.addKeys({
			up: Phaser.Input.Keyboard.KeyCodes.W,
			down: Phaser.Input.Keyboard.KeyCodes.S,
			left: Phaser.Input.Keyboard.KeyCodes.A,
			right: Phaser.Input.Keyboard.KeyCodes.D,
			buildWall: Phaser.Input.Keyboard.KeyCodes.E,
		});
	}

	private createTileMap(tileMap: any) {
		this.hexTiles.tileMap = tileMap;
		const graphic_Map = this.add.graphics();

		// masking logic
		this.add
			.image(0, 0, 'texture')
			.setOrigin(0, 0)
			.setDepth(-1)
			.setScale(3);

		this.drawAllTiles(graphic_Map);

		this.generateTerritoryTexture(this.hexTiles.tileMap[0][0]);
		graphic_Map.generateTexture(
			'hexMap',
			Constant.DEFAULT_WIDTH,
			Constant.DEFAULT_HEIGHT
		);

		this.add.sprite(0, 0, 'hexMap').setOrigin(0, 0).setDepth(-1);
		graphic_Map.destroy();
	}

	// draws every arena/map hex we have in our tilemap
	drawAllTiles(graphic_Map): void {
		if (!this.hexTiles.tileMap) return;

		for (let col = 0; col < this.hexTiles.tileMap.length; col++) {
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

	// takes XY coordinates of center point, generates all required vertices, draws individual tile
	drawTile(tile: Tile, graphics: Phaser.GameObjects.Graphics): void {
		if (tile.building == Constant.BUILDING.OUT_OF_BOUNDS) return;

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

		this.drawGraphics(points, graphics);

		graphics.fillPath();
		graphics.strokePath();
	}

	drawGraphics(points: Point[], graphics: Phaser.GameObjects.Graphics) {
		graphics.beginPath();
		graphics.moveTo(points[0].xPos, points[0].yPos);
		for (let i = 0; i < 6; i++) {
			graphics.lineTo(points[i].xPos, points[i].yPos);
		}
		graphics.closePath();
	}

	// takes XY coordinates of center point, generates all required vertices, draws individual tile
	generateTerritoryTexture(tile: Tile): void {
		const points: Point[] = this.hexTiles.getHexPointsFromCenter(
			tile.cartesian_coord
		);

		let colorName = '';
		for (let i = 0; i < Constant.TEAM_COUNT; i++) {
			const graphics = this.add.graphics();

			this.drawGraphics(points, graphics);

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
	}

	// Masking, Alpha Mask
	// Masks the texture image using the total hexagonal tile map
	setMapMask(
		reveal: Phaser.GameObjects.Image,
		graphic_Map: Phaser.GameObjects.Graphics
	): void {
		const hexBrush = graphic_Map.createGeometryMask();
		reveal.setMask(hexBrush);
	}

	update(): void {
		//this.updateMovementDirection();
	}

	calculateDirection() {
		let direction = NaN;
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
		return direction;
	}

	private updateMovementDirection(): void {
		const direction = this.calculateDirection();

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
			//changedTiles,
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

		this.updateTerritories(territories);

		//this.updateChangedTiles(changedTiles);

		this.events.emit('updateHUD', currentPlayer);
	}

	private updatePlayer(currentPlayer: any) {
		this.myPlayerSprite.setPosition(currentPlayer.xPos, currentPlayer.yPos);

		if (this.alive && !this.myPlayerSprite.visible)
			this.myPlayerSprite.setVisible(true);
	}

	//TODO may not be necessary for bullets
	private updateBullets(bullets: any) {
		this.updateMapOfObjects(
			bullets,
			this.bulletSprites,
			'bullet',
			(newBullet, newBulletLiteral) => {
				if (newBulletLiteral.teamNumber == 1)
					newBullet.setTexture('bulletblue');
				return newBullet;
			}
		);
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

	private updateWalls(walls: any) {
		this.updateMapOfObjects(
			walls,
			this.wallSprites,
			'wall',
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
