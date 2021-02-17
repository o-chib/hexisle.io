import Player from './../shared/player';
import { HexTiles, Tile, OffsetPoint, Point } from './../shared/hexTiles';
import e from 'express';
const Constant = require('../shared/constants');

export default class Game {
	sockets: Map<string, SocketIOClient.Socket>;
	players: Map<string, Player>;
	hexTileMap: HexTiles;
	changedTiles: Tile[];

	constructor() {
		this.sockets = new Map();
		this.players = new Map();
		setInterval(this.update.bind(this), 1000 / 60); //TODO lean what bind is, and make it 1000 / 60

		this.hexTileMap = new HexTiles();
		this.hexTileMap.generateMap();
		this.changedTiles = [];
	}

	addPlayer(socket: SocketIOClient.Socket) {
		console.log("Hello: " + socket.id);
		this.sockets.set(socket.id, socket);
		//calc xPos yPos
		let xPos = Math.floor(Math.random() * 50);
		let yPos = Math.floor(Math.random() * 50);
		this.players.set(socket.id, new Player(socket.id, xPos, yPos));
	}

	removePlayer(socket: SocketIOClient.Socket) {
		console.log("Goodbye: " + socket.id);
		this.sockets.delete(socket.id); //TODO dont actually delete, reuse the memory
		this.players.delete(socket.id);
	}

	update() {
		this.sockets.forEach(socket => {
			if (!this.players.has(socket.id)) return;
			const player : Player = this.players.get(socket.id)!;
			socket.emit(Constant.MESSAGE.GAME_UPDATE, this.createUpdate(player));
		});
	}

	createUpdate(player: Player) {
		let nearbyPlayers: Player[] = [];
		for (const aPlayer of this.players.values()) {
			if (aPlayer === player) continue;
			nearbyPlayers.push(aPlayer);
		}
	
		return {
			time: Date.now(),
			currentPlayer: player.serializeForUpdate(),
			otherPlayers: nearbyPlayers.map(p => p.serializeForUpdate()),
			tileMap: this.hexTileMap.tileMap,
			changedTiles: this.changedTiles
		};
	}

	movePlayer(socket: SocketIOClient.Socket, direction: number) {
		if (!this.players.has(socket.id)) return;
		const player : Player = this.players.get(socket.id)!;

		player.xPos = player.xPos + 10*Math.cos(direction);
		player.yPos = player.yPos - 10*Math.sin(direction);
	}

	changeTile(socket: SocketIOClient.Socket, coord: OffsetPoint) {
		if (!this.players.has(socket.id)) return;
		const player : Player = this.players.get(socket.id)!;

		if (!this.hexTileMap.checkIfValidHex(coord)) {
			return;
		}

		console.log('time to change a tile on server');
		console.time();

		this.changedTiles = [];
		let tile: Tile = this.hexTileMap.tileMap[coord.q][coord.r];
		this.hexTileMap.tileMap[coord.q][coord.r] = tile;
		tile.building = 'select';
		console.log(tile.offset_coord.q, tile.offset_coord.r);
		this.changedTiles.push(tile);

		console.timeEnd();
	}
}