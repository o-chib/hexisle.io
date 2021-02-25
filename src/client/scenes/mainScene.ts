import io from 'socket.io-client';
import { HexTiles, Tile, OffsetPoint, Point } from './../../shared/hexTiles';
//import playerData from '../../shared/playerData';

const Constant = require('./../../shared/constants');

export default class MainScene extends Phaser.Scene {
	private myPlayerSprite: Phaser.GameObjects.Sprite;
	private otherPlayerSprites: Map<string, Phaser.GameObjects.Sprite>;
	private bulletSprites: Map<string, Phaser.GameObjects.Sprite>;
	private cursors /*:Phaser.Types.Input.Keyboard.CursorKeys*/;
	private socket: SocketIOClient.Socket;
	private alive: boolean;

	//private graphics: Phaser.GameObjects.Graphics; // OLD, will remove later

	private graphic_BG: Phaser.GameObjects.Graphics; // static background
	private graphic_Tex: Phaser.GameObjects.Graphics; // texture data
	private graphic_Map: Phaser.GameObjects.Graphics; // Strokes for hexagons
	private graphic_Front: Phaser.GameObjects.Graphics; // Frontmost sprites = player, buildings, etc

	private tiles: Tile[]; // Made in offset even-q coordinates
	private hexTiles: HexTiles;

	constructor() {
		super('MainScene');
		this.tiles = [];
		this.hexTiles = new HexTiles();
	}

	preload(): void {
		this.load.image('aliem', '../assets/Character.png');
		this.load.image('bullet', '../assets/bullet.png');
		this.load.image(
			'texture',
			'../assets/Texture - Mossy Floor - Green 2.jpg'
		);
	}

	init() {
		//TODO what should we move from create to init?
	}

	create(): void {
		this.otherPlayerSprites = new Map();
		this.bulletSprites = new Map();
		this.socket = io();

		// Graphic Handling
		this.graphic_BG = this.add.graphics();
		this.graphic_Tex = this.add.graphics();
		this.graphic_Map = this.add.graphics();
		this.graphic_Front = this.add.graphics();

		this.myPlayerSprite = this.add.sprite(0, 0, 'aliem');
		this.myPlayerSprite.setVisible(false);
		this.alive = true;
		this.myPlayerSprite.setScale(1);

		this.cameras.main.startFollow(this.myPlayerSprite, true);
		this.cameras.main.setZoom(0.5);
		//this.cameras.main.setBounds(0,0,1920, 1080);

		this.cursors = this.input.keyboard.addKeys({
			up: Phaser.Input.Keyboard.KeyCodes.W,
			down: Phaser.Input.Keyboard.KeyCodes.S,
			left: Phaser.Input.Keyboard.KeyCodes.A,
			right: Phaser.Input.Keyboard.KeyCodes.D,
            select: Phaser.Input.Keyboard.KeyCodes.E
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
		this.socket.emit(Constant.MESSAGE.JOIN);
	}

	update() {
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

		if (!isNaN(direction))
			this.socket.emit(Constant.MESSAGE.MOVEMENT, direction);

        if (this.cursors.select.isDown) {
            if (!this.alive) return;
			let mouseX: number = this.input.mousePointer.worldX;
			let mouseY: number = this.input.mousePointer.worldY;
			let coord: OffsetPoint = this.hexTiles.cartesianToOffset(new Point(mouseX, mouseY));
			this.socket.emit(Constant.MESSAGE.TILE_CHANGE, coord);
        }
	}

	updateState(update: any): void {
		//TODO may state type
		const {
			time,
			currentPlayer,
			otherPlayers,
			tileMap,
			changedTiles,
			bullets,
		} = update;
		if (currentPlayer == null) return;

		this.updatePlayer(currentPlayer);

		this.updateBullets(bullets);

		this.updateOpponents(otherPlayers);

		//this.updateText(currentPlayer);

		this.events.emit('updateHUD', currentPlayer);
		
        // Draw whole background on startup
		// Startup: Draw tilemap
		if (!this.hexTiles.tileMap) {
			console.log('time to draw all tiles on startup');
			console.time();

			this.hexTiles.tileMap = tileMap;
			// masking logic
			const reveal = this.graphic_Tex.scene.add
				.image(0, 0, 'texture')
				.setDepth(-500)
				.setScale(3);
			this.drawAllTiles();
			this.setMapMask(reveal);

			console.timeEnd();
		}

		// Redraw any updated tiles
		for (let tile of changedTiles) {
            console.log('redrawing tile', tile.offset_coord.q, tile.offset_coord.r)
			this.drawTile(tile);
		}
	}

	private updatePlayer(currentPlayer: any) {
		this.myPlayerSprite.setPosition(currentPlayer.xPos, currentPlayer.yPos);
		if (this.alive && !this.myPlayerSprite.visible)
			this.myPlayerSprite.setVisible(true);
	}

	private updateBullets(bullets: any) {
		this.bulletSprites = this.updateMapOfObjects(
			bullets,
			this.bulletSprites,
			'bullet',
			(newBullet, newBulletLiteral) => {
				return newBullet;
			}
		);
		//TODO may not be necessary for bullets
	}

	private updateOpponents(otherPlayers: any) {
		this.otherPlayerSprites = this.updateMapOfObjects(
			otherPlayers,
			this.otherPlayerSprites,
			'aliem',
			(newPlayer, playerLiteral) => {
				newPlayer.setScale(0.25);
				newPlayer.setRotation(-1 * playerLiteral.direction);
				return newPlayer;
			}
		);
	}

	// private updateText(currentPlayer: any) {
	// const text = Phaser.Utils.String.Format(
	// info_format,
	// [
	// currentPlayer.health,
	// currentPlayer.score
	// ]
	// )

	// this.infoText?.setText(text).setScrollFactor(0);
	// this.infoText?.setFontSize(48);
	// this.infoText?.setScale(1/this.cameras.main.zoom, 1/this.cameras.main.zoom);
	// }

	private updateMapOfObjects(
		currentObjects: any,
		oldObjects: Map<string, Phaser.GameObjects.Sprite>,
		sprite: string,
		callback: (arg0: any, arg1: any) => any
	) {
		const updatedObjects = new Map();
		currentObjects.forEach((bullet) => {
			let newBullet;
			if (oldObjects.has(bullet.id)) {
				newBullet = oldObjects.get(bullet.id);
				oldObjects.delete(bullet.id);
				newBullet.setPosition(bullet.xPos, bullet.yPos);
			} else {
				newBullet = this.add.sprite(bullet.xPos, bullet.yPos, sprite);
			}
			updatedObjects.set(bullet.id, callback(newBullet, bullet));
		});
		for (const anOldBullet of oldObjects.values()) {
			anOldBullet.destroy();
		}
		return updatedObjects;
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
				if (this.hexTiles.tileMap[col][row].tileType != 'empty')
					this.drawTile(this.hexTiles.tileMap[col][row]);
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
		const graphics = this.graphic_Map;
		graphics.fillStyle(0x000000, 0);

		const points: Point[] = this.hexTiles.getHexPointsFromCenter(
			tile.cartesian_coord
		);

		if (tile.building == 'camp') {
			graphics.lineStyle(4, 0xff0000, 1);
		} else if (tile.building == 'ring') {
			graphics.lineStyle(1, 0x002fff, 1);
		} else if (tile.building == 'select') {
			graphics.lineStyle(2, 0xffb300, 1);
		} else {
			graphics.lineStyle(1, 0xffffff, 1);
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

	// Masking
	// Alpha Mask
	setMapMask(reveal: Phaser.GameObjects.Image) {
		// Masks the texture image using the total hexagonal tile map
		const hexBrush = this.graphic_Map.createGeometryMask();
		reveal.setMask(hexBrush);
	}

	applyColorTint() {
		/*
	    const redTint = 0xcc0000;

	    let centerTile = new Tile();
	    centerTile.offset_coord = new OffsetPoint(10,10);
	    this.getHexRadiusPoints(centerTile,2);

	    let currTile = new Tile();
	    for(let i = 0 ; i < offsetCoords.length ; ++i) {
	        currTile.offset_coord = offsetCoords[i];
	        currTile.cartesian_coord = this.axialToCartesian(offsetCoords[i]);
	        let areaMask = this.add.graphics();
	        this.createTile(currTile);
	    }*/
		/*
	    const redTint = 0xcc0000;
	    const x = 400;
	    const y = 300;
	    const height = MAP_HEIGHT;
	    const width = MAP_HEIGHT;

	    let reveal = this.graphics.scene.add.image(x,y,'aliem');
	    let circle = this.graphics.fillCircle(x,y,100);

	    let rt = this.graphics.scene.add.renderTexture(x,y,width,height);
	    rt.setOrigin(0.5,0.5);
	    rt.draw(reveal,width*0.5, height * 0.5);
	    rt.setTint(redTint);
	    */
	}
	getTileMask(tile: Tile, graphic: Phaser.GameObjects.Graphics) {
		// returns the graphic object of a singular tile
		// WIP
		const points: Point[] = this.hexTiles.getHexPointsFromCenter(
			tile.cartesian_coord
		);
		graphic.fillStyle(0xaa0000, 0);
		graphic.beginPath();
		graphic.moveTo(points[0].x, points[0].y);
		for (let i = 0; i < 6; i++) {
			graphic.lineTo(points[i].x, points[i].y);
		}
		graphic.closePath();
		graphic.fillPath();
	}
}
