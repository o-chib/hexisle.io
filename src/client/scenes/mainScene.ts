import io from 'socket.io-client';
import { HexTiles, Tile, OffsetPoint, Point } from './../../shared/hexTiles';
//import playerData from '../../shared/playerData';

const Constant = require('./../../shared/constants');

export default class MainScene extends Phaser.Scene {
	private myPlayerSprite: Phaser.GameObjects.Sprite;
	private otherPlayerSprites: Map<string, Phaser.GameObjects.Sprite>;
	private cursors;
	private socket: SocketIOClient.Socket;

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
		this.load.image('character', '../assets/character.png');
		this.load.image('texture', '../assets/Texture - Mossy Floor - Green 2.jpg');
	}

	create(): void {
		this.otherPlayerSprites = new Map();
		this.socket = io();
		this.socket.emit(Constant.MESSAGE.JOIN);
		this.socket.on(Constant.MESSAGE.GAME_UPDATE, this.updateState.bind(this));

		//this.graphics = this.add.graphics();
    	//this.graphics.scene.add.text(0, -30, String(['hex radius', this.hexTiles.hexRadius]));
    	//this.graphics.scene.add.text(0, -10, String(['map diameter', 4000]));

		// Graphic Handling
		this.graphic_BG = this.add.graphics();
		this.graphic_Tex = this.add.graphics();
		this.graphic_Map = this.add.graphics();
		this.graphic_Front = this.add.graphics();

		this.myPlayerSprite = this.add.sprite(0, 0, 'character');
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

		if (this.input.mousePointer.isDown) {
			let mouseX: number = this.input.mousePointer.worldX;
			let mouseY: number = this.input.mousePointer.worldY;
			let coord: OffsetPoint = this.hexTiles.cartesianToOffset(new Point(mouseX, mouseY));
			this.socket.emit(Constant.MESSAGE.TILE_CHANGE, coord);
		}
	}

	updateState(update: any): void { //TODO may state type
		const { time, currentPlayer, otherPlayers, tileMap, changedTiles } = update;
		if (!currentPlayer) {
			return;
		}

		// Draw whole background on startup
		// Startup: Draw tilemap
		if (!this.hexTiles.tileMap) {
			console.log('time to draw all tiles on startup');
			console.time();

			this.hexTiles.tileMap = tileMap;
			let reveal = this.graphic_Tex.scene.add.image(0,0,'texture').setDepth(-500).setScale(3);
			this.drawAllTiles();
			this.setMapMask(reveal);

			console.timeEnd();
		}

		// Redraw any updated tiles
		for (let tile of changedTiles) {
			this.drawTile(tile);
		}

		// Draw all players
		this.myPlayerSprite.setPosition(currentPlayer.xPos, currentPlayer.yPos);
		if (!this.myPlayerSprite.visible)
			this.myPlayerSprite.setVisible(true);

		otherPlayers.forEach( opp => {
			if (this.otherPlayerSprites.has(opp.id)) {
				this.otherPlayerSprites.get(opp.id)!.setPosition(opp.xPos, opp.yPos);
			} else {
				let newPlayer = this.add.sprite(opp.xPos, opp.yPos, 'character');
				this.otherPlayerSprites.set(opp.id, newPlayer);
				console.log("new opponent")
			}
			//TODO memory leak where old sprites dont get removed
		});
	}

/*
	drawMap(): void {
		let centerTile = this.tiles[this.hexTiles.hexRadius][this.hexTiles.hexRadius];

		let offsetCoords = this.hexTiles.getHexRadiusPoints(centerTile, this.hexTiles.hexRadius);
		let currTile = new Tile();
		for(let i = 0 ; i < offsetCoords.length ; ++i) {
			currTile.offset_coord = offsetCoords[i];
			currTile.cartesian_coord = this.hexTiles.offsetToCartesian(offsetCoords[i]);
			this.drawTile(currTile);
		}
	}
*/
	drawAllTiles(): void {
		// draws every arena/map hex we have in our tilemap

		if (!this.hexTiles.tileMap) {
			return;
		}

		// for each column
		for (let col = 0; col < this.hexTiles.tileMap.length; col++) {

		  // for each row
		  for (let row = 0; row < this.hexTiles.tileMap[col].length; row++) {
			  if(this.hexTiles.tileMap[col][row].tileType != 'empty')
				this.drawTile(this.hexTiles.tileMap[col][row]);
		  }
		}
	}

	drawTiles(tiles: Tile[]): void {
	  // draws every tile we have in our nearby tile list

	  for (let tile of tiles) {
		  this.drawTile(tile);
	  }
	}

	drawTile(tile: Tile): void {
	  // takes XY coordinates of center point,
	  // generates all required vertices
	  // draws individual tile
	  let graphics = this.graphic_Map;
	  graphics.fillStyle(0x000000, 0);

	  let points: Point[] = this.hexTiles.getHexPointsFromCenter(tile.cartesian_coord);

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
		graphics.lineTo(points[i].x, points[i].y)
	  }
	  graphics.closePath();

	  graphics.fillPath().setDepth(-100);
	  graphics.strokePath().setDepth(-100);
	}

	// Masking
	// Alpha Mask
	setMapMask(reveal : Phaser.GameObjects.Image) {
	   // Masks the texture image using the total hexagonal tile map
	   let hexBrush = this.graphic_Map.createGeometryMask();
	   reveal.setMask(hexBrush);
	}

	applyColorTint(){
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
	getTileMask(tile: Tile, graphic : Phaser.GameObjects.Graphics){
		// returns the graphic object of a singular tile
		// WIP
		let points: Point[] = this.hexTiles.getHexPointsFromCenter(tile.cartesian_coord);
		graphic.fillStyle(0xaa0000,0);
		graphic.beginPath();
		graphic.moveTo(points[0].x, points[0].y);
		for (let i = 0; i < 6; i++) {
		  graphic.lineTo(points[i].x, points[i].y)
		}
		graphic.closePath();
		graphic.fillPath();
	}

}
