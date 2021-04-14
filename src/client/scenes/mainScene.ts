import io from 'socket.io-client';
import { HexTiles, OffsetPoint, Tile, Point } from './../../shared/hexTiles';

import { Constant } from './../../shared/constants';

export default class MainScene extends Phaser.Scene {
	private myPlayerSprite: Phaser.GameObjects.Sprite;
	private otherPlayerSprites: Map<string, Phaser.GameObjects.Sprite>;
	private bulletSprites: Map<string, Phaser.GameObjects.Sprite>;
	private wallSprites: Map<string, Phaser.GameObjects.Sprite>;
	private campfireSprites: Map<string, Phaser.GameObjects.Sprite>;
	private baseSprites: Map<string, Phaser.GameObjects.Sprite>;
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
		this.load.spritesheet('player_red', '../assets/Char_Red.png', {
			frameWidth: 94,
			frameHeight: 120,
		});
		this.load.spritesheet('player_blue', '../assets/Char_Blue.png', {
			frameWidth: 94,
			frameHeight: 120,
		});
		this.load.image('bullet', '../assets/bullet.png');
		this.load.image('bulletblue', '../assets/bulletblue.png');
		this.load.image('wall', '../assets/tempwall.png'); //TODO
		this.load.image('wallblue', '../assets/tempwallblue.png'); //TODO
		this.load.image('campfire_unlit', '../assets/campfire_unlit.png');
		this.load.image('campfire_lit', '../assets/campfire_lit.png');
		this.load.image('base', '../assets/base.png');
		this.load.image(
			'texture',
			'../assets/Texture - Mossy Floor - Green 2.jpg'
		);
	}

	init(): void {
		this.initializeKeys();
		this.generatePlayerSprite();

		this.hexTiles = new HexTiles();
		this.otherPlayerSprites = new Map();
		this.bulletSprites = new Map();
		this.wallSprites = new Map();
		this.campfireSprites = new Map();
		this.baseSprites = new Map();
		this.territorySprites = new Map();
		this.deadObjects = new Set();

		this.socket = io();
	}

	create(): void {
		this.registerListeners();
		this.registerIntervals();

		this.socket.emit(Constant.MESSAGE.JOIN);
	}

	update(): void {
		this.updateDirection();
		//this.updateMovementDirection();
	}

	private generatePlayerSprite(): void {
		this.myPlayerSprite = this.add.sprite(0, 0, 'player_red');
		this.myPlayerSprite.setDepth(1000);
		this.myPlayerSprite.setVisible(false);
		this.myPlayerSprite.setScale(1);
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
		//setInterval(() => {
		//	this.updateDirection();
		//}, 1000 / 60);
	}

	private updateDirection() {
		const direction =
			this.getMouseDirection(this.input.mousePointer) - Math.PI * 0.5;

		this.myPlayerSprite.setRotation(direction);
		this.socket.emit(Constant.MESSAGE.ROTATE, direction);
	}

	private getMouseDirection(pointer: any): any {
		const gamePos = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

		return Math.atan2(
			gamePos.y - this.myPlayerSprite.y,
			gamePos.x - this.myPlayerSprite.x
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
		if (player.teamNumber == Constant.TEAM.RED)
			this.myPlayerSprite.setTexture('player_red');
		else if (player.teamNumber == Constant.TEAM.BLUE)
			this.myPlayerSprite.setTexture('player_blue');

		this.alive = true;
	}

	private setCamera(): void {
		this.cameras.main.startFollow(this.myPlayerSprite, true);
		this.cameras.main.setZoom(0.5);
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

		graphics.lineStyle(2, 0xffffff, 1);
		if (tile.building == Constant.BUILDING.CAMP)
			graphics.lineStyle(5, 0xffffff, 1);

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

	// Animation control
	private handleWalkAnimation(
		player: Phaser.GameObjects.Sprite,
		playerTextureName: string,
		xVel: number,
		yVel: number
	) {
		// Create local animation on each sprite if it doesn't exist
		// player texture name refers to 'player_red', 'player_blue', etc which is the loaded spritesheet key
		if (!player.anims.get(playerTextureName + '_walk')) {
			player.anims.create({
				key: playerTextureName + '_walk',
				frames: this.anims.generateFrameNames(playerTextureName, {
					start: 0,
					end: 3,
				}),
				frameRate: 8,
				repeat: -1,
			});

			// Update anims internal isPlaying/isPaused variables.
			player.anims.play(playerTextureName + '_walk');
			player.anims.pause();
		}

		// Use overall player velocity to continue animation
		if (xVel != 0 || yVel != 0) {
			if (player.anims.isPaused) {
				player.anims.resume();
			}
		} else {
			if (player.anims.isPlaying) {
				player.anims.pause();
			}
		}

		return player;
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
			bullets,
			walls,
			campfires,
			bases,
			territories,
		} = update;
		if (currentPlayer == null) return;

		this.updatePlayer(currentPlayer);

		this.updateBullets(bullets);

		this.updateOpponents(otherPlayers);

		this.updateWalls(walls);

		this.updateCampfires(campfires);

		this.updateBases(bases);

		this.updateTerritories(territories);

		this.events.emit('updateHUD', currentPlayer);
	}

	private updatePlayer(currentPlayer: any) {
		this.myPlayerSprite.setPosition(currentPlayer.xPos, currentPlayer.yPos);
		if (this.alive && !this.myPlayerSprite.visible) {
			this.myPlayerSprite.setVisible(true);
		}

		//  Local Animation control
		this.myPlayerSprite = this.handleWalkAnimation(
			this.myPlayerSprite,
			this.myPlayerSprite.texture.key,
			currentPlayer.xVel,
			currentPlayer.yVel
		);
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
			'',
			(newPlayer, playerLiteral) => {
				newPlayer.setRotation(playerLiteral.direction);

				// Set Walk/Standing textures based on team
				let playerTexture = '';
				if (playerLiteral.teamNumber == Constant.TEAM.RED)
					playerTexture = 'player_red';
				else if (playerLiteral.teamNumber == Constant.TEAM.BLUE)
					playerTexture = 'player_blue';

				if (newPlayer.texture.key != playerTexture)
					//TODO faster lookup somehow? check null?
					newPlayer.setTexture(playerTexture).setDepth(1000);

				// Opponent Animation Control
				newPlayer = this.handleWalkAnimation(
					newPlayer,
					playerTexture,
					playerLiteral.xVel,
					playerLiteral.yVel
				);

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

	private updateBases(bases: any) {
		this.updateMapOfObjects(
			bases,
			this.baseSprites,
			'base',
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			(newBase, newBaseLiteral) => {
				if (newBaseLiteral.teamNumber == 1) newBase.setTexture('base');
				return newBase;
			}
		);
	}

	private updateTerritories(territories: any) {
		this.updateMapOfObjects(
			territories,
			this.territorySprites,
			'red-territory',
			(changedTilesNewTile, changedTilesCurrentTile) => {
				if (changedTilesCurrentTile.teamNumber == Constant.TEAM.RED) {
					changedTilesNewTile.setTexture('red-territory');
					changedTilesNewTile.setVisible(true).setDepth(-1);
				} else if (
					changedTilesCurrentTile.teamNumber == Constant.TEAM.BLUE
				) {
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
