/* eslint-disable @typescript-eslint/no-non-null-assertion */

import Player from './../shared/player';
import Bullet from './../shared/bullet';
import Wall from './../shared/wall';
import Campfire from './../shared/campfire';
import CollisionDetection from './collision';
import { HexTiles, Tile, OffsetPoint } from './../shared/hexTiles';
import IDgenerator from './idGenerator';
const Constant = require('../shared/constants');

export default class Game {
	teams: Map<number, number>;
	players: Map<string, Player>;
	bullets: Set<Bullet>;
	walls: Set<Wall>;
	campfires: Set<Campfire>;
	previousUpdateTimestamp: any;
	hexTileMap: HexTiles;
	idGenerator: IDgenerator;
	changedTiles: Tile[];
	collision: CollisionDetection;

	constructor() {
		this.players = new Map();
		this.initTeams(2);
		this.bullets = new Set();
		this.walls = new Set();
		this.campfires = new Set();
		setInterval(this.update.bind(this), 1000 / 60); //TODO lean what bind is, and make it 1000 / 60
		this.hexTileMap = new HexTiles();
		this.hexTileMap.generateMap();
		this.changedTiles = [];
		this.collision = new CollisionDetection();
		this.previousUpdateTimestamp = Date.now();
		this.idGenerator = new IDgenerator();
		this.initCampfires();
	}

	addPlayer(socket: SocketIOClient.Socket) {
		console.log('Hello: ' + socket.id);

		// find team number, chooses smallest team
		const team: number = this.getTeamNumber();
		console.log('Assigning to team ' + team);

		const newPlayer = new Player(socket, 0, 0, team);
		this.respawnPlayer(newPlayer);

		this.players.set(socket.id, newPlayer);

		this.collision.insertCollider(newPlayer, Constant.PLAYER_RADIUS);
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

		this.collision.deleteCollider(player, Constant.PLAYER_RADIUS);

		this.teams.set(
			player.teamNumber,
			this.teams.get(player.teamNumber)! - 1
		);

		this.players.delete(socket.id);
	}

	respawnPlayer(player: Player) {
		console.log('Respawning: ' + player.socket.id);
		let xPos: number;
		let yPos: number;

		this.collision.deleteCollider(player, Constant.PLAYER_RADIUS);

		do {
			xPos = 1500 + Math.floor(Math.random() * 1000);
			yPos = 1500 + Math.floor(Math.random() * 1000);
		} while (
			this.collision.doesObjCollideWithWall(
				xPos,
				yPos,
				Constant.PLAYER_RADIUS
			)
		);

		player.health = 100;
		player.xPos = xPos;
		player.yPos = yPos;

		this.collision.insertCollider(player, Constant.PLAYER_RADIUS);
	}

	update() {
		const currentTimestamp = Date.now();
		const timePassed =
			(currentTimestamp - this.previousUpdateTimestamp) / 1000;
		this.previousUpdateTimestamp = currentTimestamp;

		for (const aBullet of this.bullets) {
			aBullet.updatePosition(timePassed);
			if (aBullet.isExpired(currentTimestamp)) {
				this.collision.deleteCollider(aBullet, Constant.BULLET_RADIUS);
				this.bullets.delete(aBullet);
				continue;
			}

			this.collision.updateCollider(aBullet, Constant.BULLET_RADIUS);
		}

		for (const aWall of this.walls) {
			this.collision.buildingBulletCollision(aWall, this.bullets);
			if (!aWall.isAlive()) {
				this.collision.deleteCollider(aWall, Constant.WALL_RADIUS);
				aWall.tile.setEmpty();
				this.walls.delete(aWall);
			}
		}

		for (const aPlayer of this.players.values()) {
			aPlayer.updatePosition(currentTimestamp, this.collision);
			this.collision.playerBulletCollision(aPlayer, this.bullets);
			if (aPlayer.health <= 0) {
				this.respawnPlayer(aPlayer);
			}
		}

		for (const aPlayer of this.players.values()) {
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
		const nearbyCampfires: Campfire[] = [];
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

		for (const aCampfire of this.campfires) {
			nearbyCampfires.push(aCampfire);
		}

		return {
			time: Date.now(),
			currentPlayer: player.serializeForUpdate(),
			otherPlayers: nearbyPlayers.map((p) => p.serializeForUpdate()),
			changedTiles: changedTiles,
			bullets: nearbyBullets.map((p) => p.serializeForUpdate()),
			walls: nearbyWalls.map((p) => p.serializeForUpdate()),
			campfires: nearbyCampfires.map((p) => p.serializeForUpdate()),
		};
	}

	movePlayer(socket: SocketIOClient.Socket, direction: number) {
		if (!this.players.has(socket.id)) return;
		const player: Player = this.players.get(socket.id)!;

		player.updateVelocity(direction);
		player.updatePosition(Date.now(), this.collision);
		this.collision.updateCollider(player, Constant.PLAYER_RADIUS);
	}

	buildWall(socket: SocketIOClient.Socket, coord: OffsetPoint): void {
		if (!this.players.has(socket.id)) return;
		const player: Player = this.players.get(socket.id)!;

		if (!this.hexTileMap.checkIfValidHex(coord)) {
			return;
		}

		const tile: Tile = this.hexTileMap.tileMap[coord.q][coord.r];
		if (
			!tile.isEmpty() ||
			this.collision.doesObjCollideWithPlayers(
				tile.cartesian_coord.x,
				tile.cartesian_coord.y,
				Constant.WALL_RADIUS
			) ||
			tile.team != player.teamNumber ||
			!player.buyWall()
		)
			return; //TODO

		const wall: Wall = new Wall(
			this.idGenerator.newID(),
			tile.cartesian_coord.x,
			tile.cartesian_coord.y,
			player.teamNumber,
			tile
		);

		this.walls.add(wall);
		tile.building = Constant.BUILDING.STRUCTURE;
		this.changedTiles.push(tile); //TODO

		this.collision.insertCollider(wall, Constant.WALL_RADIUS);
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
			this.idGenerator.newID(),
			player.xPos,
			player.yPos,
			direction,
			player.teamNumber
		);

		this.bullets.add(bullet);
		this.collision.insertCollider(bullet, Constant.BULLET_RADIUS);
	}

	buildCampfire(coord: OffsetPoint): void {
		if (!this.hexTileMap.checkIfValidHex(coord)) {
			return;
		}

		const tile: Tile = this.hexTileMap.tileMap[coord.q][coord.r];

		const campfire: Campfire = new Campfire(
			this.idGenerator.newID(),
			tile.cartesian_coord.x,
			tile.cartesian_coord.y,
		);

		this.campfires.add(campfire);
		tile.building = Constant.BUILDING.CAMP;
		this.changedTiles.push(tile); //TODO

		this.collision.insertCollider(campfire, Constant.WALL_RADIUS);
	}

	initCampfires(): void{
		this.campfires = new Set();

		let tilemap = this.hexTileMap.tileMap;
		for(let i = 0; i < tilemap.length ; i++) {
			for(let j = 0; j < tilemap[i].length ; j++) {
				if(tilemap[i][j].building == Constant.BUILDING.CAMP){
					this.buildCampfire(tilemap[i][j].offset_coord);
				}
			}
		}
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
