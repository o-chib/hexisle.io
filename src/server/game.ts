import Player from './../shared/player';
import Bullet from './../shared/bullet';
const Constant = require('../shared/constants');
import { HexTiles, Tile, OffsetPoint, Point } from './../shared/hexTiles';

export default class Game {
	players: Map<string, Player>;
	bullets: Set<Bullet>;
	previousUpdateTimestamp: any;
	bulletCount: number;
	hexTileMap: HexTiles;
	changedTiles: Tile[];

	constructor() {
		this.players = new Map();
		this.bullets = new Set();
		setInterval(this.update.bind(this), 1000 / 60); //TODO lean what bind is, and make it 1000 / 60
		this.hexTileMap = new HexTiles();
		this.hexTileMap.generateMap();
		this.changedTiles = [];
		this.previousUpdateTimestamp = Date.now();
		this.bulletCount = 0;
	}

	addPlayer(socket: SocketIOClient.Socket) {
		console.log('Hello: ' + socket.id);
		//calc xPos yPos
		const xPos = Math.floor(Math.random() * 600);
		const yPos = Math.floor(Math.random() * 600);
		const newPlayer = new Player(
			socket,
			xPos,
			yPos,
			Math.floor(Math.random() * 10000) + 1
		);
		this.players.set(socket.id, newPlayer); //TODO rn it has a random team
		socket.emit(Constant.MESSAGE.INITIALIZE, this.hexTileMap.tileMap);
	}

	removePlayer(socket: SocketIOClient.Socket) {
		console.log('Goodbye: ' + socket.id);
		this.players.delete(socket.id);
	}

	update() {
		const currentTimestamp = Date.now();
		const timePassed =
			(currentTimestamp - this.previousUpdateTimestamp) / 1000;
		this.previousUpdateTimestamp = currentTimestamp;

		for (const aBullet of this.bullets) {
			aBullet.updatePosition(timePassed);
			if (aBullet.isExpired(currentTimestamp)) {
				this.bullets.delete(aBullet);
			}
		}

		for (const aPlayer of this.players.values()) {
			aPlayer.updatePosition(currentTimestamp);
		}

		for (const aPlayer of this.players.values()) {
			aPlayer.socket.emit(
				Constant.MESSAGE.GAME_UPDATE,
				this.createUpdate(aPlayer)
			);
		}
	}

	createUpdate(player: Player) {
		const nearbyPlayers: Player[] = [];
		const nearbyBullets: Bullet[] = [];

		for (const aPlayer of this.players.values()) {
			if (aPlayer === player) continue;
			nearbyPlayers.push(aPlayer);
		}

		const changedTiles: Tile[] = this.changedTiles;
		this.changedTiles = [];

		for (const aBullet of this.bullets) {
			nearbyBullets.push(aBullet);
		}

		return {
			time: Date.now(),
			currentPlayer: player.serializeForUpdate(),
			otherPlayers: nearbyPlayers.map((p) => p.serializeForUpdate()),
			changedTiles: changedTiles,
			bullets: nearbyBullets.map((p) => p.serializeForUpdate()),
		};
	}

	movePlayer(socket: SocketIOClient.Socket, direction: number) {
		if (!this.players.has(socket.id)) return;
		const player: Player = this.players.get(socket.id)!;

		player.updateVelocity(direction);
		//player.xPos = player.xPos + 10 * Math.cos(direction);
		//player.yPos = player.yPos - 10 * Math.sin(direction);
	}

	changeTile(socket: SocketIOClient.Socket, coord: OffsetPoint) {
		if (!this.players.has(socket.id)) return;
		const player: Player = this.players.get(socket.id)!;

		if (!this.hexTileMap.checkIfValidHex(coord)) {
			return;
		}

		const tile: Tile = this.hexTileMap.tileMap[coord.q][coord.r];
		this.hexTileMap.tileMap[coord.q][coord.r] = tile;
		if (tile.building != 'select') {
			tile.building = 'select';
			this.changedTiles.push(tile);
		}
	}
	rotatePlayer(socket: SocketIOClient.Socket, direction: number) {
		if (!this.players.has(socket.id)) return;
		const player: Player = this.players.get(socket.id)!;

		player.updateDirection(direction);
	}

	shootBullet(socket: SocketIOClient.Socket, direction: number) {
		if (!this.players.has(socket.id)) return;
		const player: Player = this.players.get(socket.id)!;
		this.bullets.add(
			new Bullet(
				this.bulletCount.toString(),
				player.xPos,
				player.yPos,
				direction,
				player.teamNumber
			)
		);
		this.bulletCount += 1;
	}
}
