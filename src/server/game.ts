/* eslint-disable @typescript-eslint/no-non-null-assertion */
import Player from './../shared/player';
import Bullet from './../shared/bullet';
import Wall from './../shared/wall';
import CollisionDetection from './collision';
const Constant = require('../shared/constants');
import { HexTiles, Tile, OffsetPoint } from './../shared/hexTiles';

export default class Game {
	teams: Map<number, number>;
	players: Map<string, Player>;
	bullets: Set<Bullet>;
	walls: Set<Wall>;
	previousUpdateTimestamp: any;
	bulletCount: number;
	hexTileMap: HexTiles;
	changedTiles: Tile[];
	collisionDetection: CollisionDetection;

	constructor() {
		this.players = new Map();
		this.initTeams(2);
		this.bullets = new Set();
		this.walls = new Set();
		setInterval(this.update.bind(this), 1000 / 60); //TODO lean what bind is, and make it 1000 / 60
		this.hexTileMap = new HexTiles();
		this.hexTileMap.generateMap();
		this.changedTiles = [];
		this.collisionDetection = new CollisionDetection();
		this.previousUpdateTimestamp = Date.now();
		this.bulletCount = 0;
	}

	addPlayer(socket: SocketIOClient.Socket) {
		console.log('Hello: ' + socket.id);

		//calc xPos yPos
		const xPos = 1500 + Math.floor(Math.random() * 1000);
		const yPos = 1500 + Math.floor(Math.random() * 1000);

		// find team number, chooses smallest team
		const team: number = this.getTeamNumber();
		console.log('Assigning to team ' + team);

		const newPlayer = new Player(socket, xPos, yPos, team);

		this.players.set(socket.id, newPlayer);

		this.collisionDetection.insertCollider(newPlayer);
		console.log('inserted', newPlayer.id);

		const initObject = {
			player: newPlayer.serializeForUpdate(),
			tileMap: this.hexTileMap.tileMap,
		};

		socket.emit(Constant.MESSAGE.INITIALIZE, initObject);
	}

	removePlayer(socket: SocketIOClient.Socket) {
		console.log('Goodbye: ' + socket.id);
		if (!this.players.has(socket.id)) return;
		const player: Player = this.players.get(socket.id)!;

		this.collisionDetection.deleteCollider(player);

		this.teams.set(
			player.teamNumber,
			this.teams.get(player.teamNumber)! - 1
		);

		this.players.delete(socket.id);
	}

	respawnPlayer(player: Player) {
		console.log('Respawning: ' + player.socket.id);

		const xPos = 1500 + Math.floor(Math.random() * 1000);
		const yPos = 1500 + Math.floor(Math.random() * 1000);

		player.health = 100;
		player.xPos = xPos;
		player.yPos = yPos;
	}

	update() {
		const currentTimestamp = Date.now();
		const timePassed =
			(currentTimestamp - this.previousUpdateTimestamp) / 1000;
		this.previousUpdateTimestamp = currentTimestamp;

		for (const aBullet of this.bullets) {
			aBullet.updatePosition(timePassed);
			if (aBullet.isExpired(currentTimestamp)) {
				this.collisionDetection.deleteCollider(aBullet);
				this.bullets.delete(aBullet);
				continue;
			}

			this.collisionDetection.updateCollider(aBullet);
		}

		for (const aWall of this.walls) {
			this.collisionDetection.buildingCollision(aWall, this.bullets);
		}

		for (const aPlayer of this.players.values()) {
			aPlayer.updatePosition(currentTimestamp, this.collisionDetection);
		}

		for (const aPlayer of this.players.values()) {
			this.collisionDetection.playerCollision(aPlayer, this.bullets);

			// TODO: check if player's dead

			if (aPlayer.health <= 0) {
				this.respawnPlayer(aPlayer);
			}
			aPlayer.socket.emit(
				Constant.MESSAGE.GAME_UPDATE,
				this.createUpdate(aPlayer)
			);
		}

		this.changedTiles = [];
	}

	createUpdate(player: Player) {
		const nearbyPlayers: Player[] = [];
		const nearbyBullets: Bullet[] = [];
		const nearbyWalls: Wall[] = [];
		const changedTiles: Tile[] = this.changedTiles;

		for (const aPlayer of this.players.values()) {
			if (aPlayer === player) continue;
			nearbyPlayers.push(aPlayer);
		}

		this.changedTiles = [];

		for (const aBullet of this.bullets) {
			nearbyBullets.push(aBullet);
		}

		for (const aWall of this.walls) {
			nearbyWalls.push(aWall);
		}

		return {
			time: Date.now(),
			currentPlayer: player.serializeForUpdate(),
			otherPlayers: nearbyPlayers.map((p) => p.serializeForUpdate()),
			changedTiles: changedTiles,
			bullets: nearbyBullets.map((p) => p.serializeForUpdate()),
			walls: nearbyWalls.map((p) => p.serializeForUpdate()),
		};
	}

	movePlayer(socket: SocketIOClient.Socket, direction: number) {
		if (!this.players.has(socket.id)) return;
		const player: Player = this.players.get(socket.id)!;

		player.updateVelocity(direction);
		player.updatePosition(Date.now(), this.collisionDetection);
		this.collisionDetection.updateCollider(player);
	}

	changeTile(socket: SocketIOClient.Socket, coord: OffsetPoint): void {
		if (!this.players.has(socket.id)) return;
		const player: Player = this.players.get(socket.id)!;

		if (!this.hexTileMap.checkIfValidHex(coord)) {
			return;
		}

		const tile: Tile = this.hexTileMap.tileMap[coord.q][coord.r];
		if (!tile.isEmpty() /*|| tile.team != player.teamNumber*/) return; //TODO

		const wall: Wall = new Wall(
			this.bulletCount.toString(),
			tile.cartesian_coord.x,
			tile.cartesian_coord.y,
			player.teamNumber
		);

		this.walls.add(wall);
		tile.building = 'structure'; //TODO enum this
		this.changedTiles.push(tile); //TODO
		this.bulletCount += 1;

		this.collisionDetection.insertCollider(wall);
	}

	rotatePlayer(socket: SocketIOClient.Socket, direction: number): void {
		if (!this.players.has(socket.id)) return;
		const player = this.players.get(socket.id);

		player?.updateDirection(direction);
	}

	shootBullet(socket: SocketIOClient.Socket, direction: number) {
		if (!this.players.has(socket.id)) return;
		const player: Player = this.players.get(socket.id)!;

		const bullet: Bullet = new Bullet(
			this.bulletCount.toString(),
			player.xPos,
			player.yPos,
			direction,
			player.teamNumber
		);

		this.bullets.add(bullet);
		this.bulletCount += 1;
		this.collisionDetection.insertCollider(bullet);
	}

	initTeams(teamCount: number): void {
		this.teams = new Map();
		for (let x = 0; x < teamCount; x++) {
			this.teams.set(x, 0);
		}
	}

	getTeamNumber(): number {
		let smallestTeam = -1;
		let smallestPlayerCount = 999;
		for (const [team, playerCount] of this.teams) {
			if (playerCount < smallestPlayerCount) {
				smallestTeam = team;
				smallestPlayerCount = playerCount;
			}
		}
		this.teams.set(smallestTeam, smallestPlayerCount + 1);
		return smallestTeam;
	}
}
