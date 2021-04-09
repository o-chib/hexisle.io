/* eslint-disable @typescript-eslint/no-non-null-assertion */

import Player from './../shared/player';
import Teams from '../shared/teams';
import Bullet from './../shared/bullet';
import Wall from './../shared/wall';
import Campfire from './../shared/campfire';
import Base from './../shared/base';
import CollisionDetection from './collision';
import { HexTiles, Tile, OffsetPoint, Point } from './../shared/hexTiles';
import IDgenerator from './idGenerator';
import Territory from './../shared/territory';
import { CollisionObject, Rect } from './quadtree';
const Constant = require('../shared/constants');

export default class Game {
	teams: Teams;
	players: Map<string, Player>;
	bullets: Set<Bullet>;
	walls: Set<Wall>;
	campfires: Set<Campfire>;
	bases: Set<Base>;
	previousUpdateTimestamp: any;
	hexTileMap: HexTiles;
	idGenerator: IDgenerator;
	changedTiles: Tile[];
	collision: CollisionDetection;
	territories: Set<Territory>;

	constructor() {
		this.players = new Map();
		this.bullets = new Set();
		this.walls = new Set();
		this.bases = new Set();
		this.campfires = new Set();
		this.territories = new Set();

		this.idGenerator = new IDgenerator();

		this.hexTileMap = new HexTiles();
		this.hexTileMap.generateMap();

		this.teams = new Teams(2, this.hexTileMap.baseCoords);

		this.changedTiles = [];

		this.collision = new CollisionDetection();
		//this.generateBoundaryColliders();

		this.previousUpdateTimestamp = Date.now();

		//this.initCampfires();

		this.addBaseTerritories();
		this.initBases();
		
		setInterval(this.update.bind(this), 1000 / 60); //TODO lean what bind is, and make it 1000 / 60
	}

	update() {
		const currentTimestamp = Date.now();
		const timePassed =
			(currentTimestamp - this.previousUpdateTimestamp) / 1000;
		this.previousUpdateTimestamp = currentTimestamp;

		//this.changedTiles = [];

		for (const aBullet of this.bullets) {
			aBullet.updatePosition(timePassed);
			if (aBullet.isExpired(currentTimestamp)) {
				this.collision.deleteCollider(aBullet, Constant.BULLET_RADIUS);
				this.bullets.delete(aBullet);
				continue;
			}

			this.collision.updateCollider(aBullet, Constant.BULLET_RADIUS);
		}

		// Add captured territory of campfire, and camfire itself
		for (const aCampfire of this.campfires) {
			this.collision.campfirePlayerCollision(aCampfire);

			if (aCampfire.captureProgress == 100) {
				aCampfire.checkForCapture();
				const isCaptured = aCampfire.isCaptured;
				const points = aCampfire.territoryPoints;

				// TODO: Update to iterate only chunck of tiles surround the campsite.
				for (const pt of points) {
					// TODO OUT OF BOUNDS INDEXING
					if (!this.hexTileMap.checkIfValidHex(pt)) {
						continue;
					}
					const tempTile = this.hexTileMap.tileMap[pt.q][pt.r];
					if (tempTile.building == Constant.BUILDING.OUT_OF_BOUNDS) {
						continue;
					}

					tempTile.team = aCampfire.teamNumber;
					this.hexTileMap.tileMap[pt.q][pt.r] = tempTile;
					//this.changedTiles.push(tempTile);

					const xPosition = tempTile.cartesian_coord.xPos.toString();
					const yPosition = tempTile.cartesian_coord.yPos.toString();
					const stringID = xPosition + ', ' + yPosition;

					if (isCaptured) {
						// If captured, add to list
						const tempTerritory = new Territory(
							stringID,
							tempTile.cartesian_coord.xPos,
							tempTile.cartesian_coord.yPos,
							tempTile.team
						);
						this.territories.add(tempTerritory);
					} else {
						// If non captured, remove from list
						for (const aTerritory of this.territories) {
							if (aTerritory.id == stringID) {
								this.territories.delete(aTerritory);
								break;
							}
						}
					}
				}
			}
		}

		for (const aWall of this.walls) {
			this.collision.buildingBulletCollision(aWall, this.bullets);
			if (!aWall.isAlive()) {
				this.collision.deleteCollider(aWall, Constant.WALL_RADIUS);
				aWall.tile.setEmpty();
				this.walls.delete(aWall);
			}

			//this.changedTiles.push(aWall.tile);
		}

		for (const aBase of this.bases) {
			this.collision.buildingBulletCollision(aBase, this.bullets);
			if (!aBase.isAlive()) {
				this.collision.deleteCollider(aBase, Constant.BASE_COL_RADIUS);

				// empty all the nearby tiles (respawn points to center base tile)
				this.hexTileMap
					.getHexRadiusPoints(aBase.tile, 2)
					.forEach((coord) => {
						this.hexTileMap.tileMap[coord.q][coord.r].setEmpty();
					});

				this.bases.delete(aBase);
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
	}

	createUpdate(player: Player) {
		const nearbyPlayers: Player[] = [];
		const nearbyBullets: Bullet[] = [];
		const nearbyWalls: Wall[] = [];
		const nearbyCampfires: Campfire[] = [];
		const nearbyBases: Base[] = [];
		const changedTiles: Tile[] = this.changedTiles;
		const nearbyTerritories: Territory[] = [];

		for (const aPlayer of this.players.values()) {
			if (aPlayer === player) continue;
			if (
				this.collision.doCirclesCollide(
					aPlayer,
					Constant.PLAYER_RADIUS,
					player,
					Constant.VIEW_RADIUS
				)
			)
				nearbyPlayers.push(aPlayer);
		}

		for (const aBullet of this.bullets) {
			if (
				this.collision.doCirclesCollide(
					aBullet,
					Constant.BULLET_RADIUS,
					player,
					Constant.VIEW_RADIUS
				)
			)
				nearbyBullets.push(aBullet);
		}

		for (const aWall of this.walls) {
			if (
				this.collision.doCirclesCollide(
					aWall,
					Constant.WALL_RADIUS,
					player,
					Constant.VIEW_RADIUS
				)
			)
				nearbyWalls.push(aWall);
		}

		for (const aCampfire of this.campfires) {
			if (
				this.collision.doCirclesCollide(
					aCampfire,
					Constant.WALL_RADIUS,
					player,
					Constant.VIEW_RADIUS
				)
			)
				nearbyCampfires.push(aCampfire);
		}

		for (const aBase of this.bases) {
			if (
				this.collision.doCirclesCollide(
					aBase,
					Constant.BASE_RADIUS,
					player,
					Constant.VIEW_RADIUS
				)
			)
				nearbyBases.push(aBase);
		}

		for (const aTerritory of this.territories) {
			if (
				this.collision.doCirclesCollide(
					aTerritory,
					Constant.WALL_RADIUS,
					player,
					Constant.VIEW_RADIUS
				)
			)
				nearbyTerritories.push(aTerritory);
		}

		return {
			time: Date.now(),
			currentPlayer: player.serializeForUpdate(),
			otherPlayers: nearbyPlayers.map((p) => p.serializeForUpdate()),
			//		changedTiles: changedTiles,
			bullets: nearbyBullets.map((p) => p.serializeForUpdate()),
			walls: nearbyWalls.map((p) => p.serializeForUpdate()),
			campfires: nearbyCampfires.map((p) => p.serializeForUpdate()),
			bases: nearbyBases.map((p) => p.serializeForUpdate()),
			territories: nearbyTerritories.map((p) => p.serializeForUpdate()),
		};
	}

	addPlayer(socket: SocketIOClient.Socket) {
		console.log('Hello: ' + socket.id);

		const team: number = this.teams.addNewPlayer(socket.id);

		const newPlayer = new Player(socket, 0, 0, team);

		const respawnPoint: Point = this.getRespawnPoint(newPlayer.teamNumber);
		newPlayer.xPos = respawnPoint.xPos;
		newPlayer.yPos = respawnPoint.yPos;

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

		this.teams.removePlayer(socket.id, player.teamNumber);

		this.players.delete(socket.id);
	}

	respawnPlayer(player: Player) {
		console.log('Respawning: ' + player.socket.id);

		this.collision.deleteCollider(player, Constant.PLAYER_RADIUS);

		const respawnPoint: Point = this.getRespawnPoint(player.teamNumber);

		player.health = 100;
		player.xPos = respawnPoint.xPos;
		player.yPos = respawnPoint.yPos;

		this.collision.insertCollider(player, Constant.PLAYER_RADIUS);
	}

	getRespawnPoint(teamNum: number): Point {
		const coords: OffsetPoint[] = this.teams.getRespawnCoords(teamNum);
		const index = Math.floor(Math.random() * coords.length);
		return this.hexTileMap.offsetToCartesian(coords[index]);
	}

	movePlayer(socket: SocketIOClient.Socket, direction: number) {
		if (!this.players.has(socket.id)) return;
		const player: Player = this.players.get(socket.id)!;

		player.updateVelocity(direction);
		player.updatePosition(Date.now(), this.collision);
		this.collision.updateCollider(player, Constant.PLAYER_RADIUS);
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
				tile.cartesian_coord.xPos,
				tile.cartesian_coord.yPos,
				Constant.WALL_RADIUS
			) ||
			tile.team != player.teamNumber ||
			!player.buyWall()
		)
			return; //TODO

		const wall: Wall = new Wall(
			this.idGenerator.newID(),
			tile.cartesian_coord.xPos,
			tile.cartesian_coord.yPos,
			player.teamNumber,
			tile
		);

		this.walls.add(wall);
		tile.building = Constant.BUILDING.STRUCTURE;
		// this.changedTiles.push(tile); //TODO

		this.collision.insertCollider(wall, Constant.WALL_COL_RADIUS);
	}

	initCampfires(): void {
		const tilemap = this.hexTileMap.tileMap;
		for (let i = 0; i < tilemap.length; i++) {
			for (let j = 0; j < tilemap[i].length; j++) {
				if (tilemap[i][j].building == Constant.BUILDING.CAMP) {
					this.buildCampfire(tilemap[i][j].offset_coord);
				}
			}
		}
	}

	buildCampfire(coord: OffsetPoint): void {
		if (!this.hexTileMap.checkIfValidHex(coord)) {
			return;
		}

		const tile: Tile = this.hexTileMap.tileMap[coord.q][coord.r];

		const campfire: Campfire = new Campfire(
			this.idGenerator.newID(),
			tile.cartesian_coord.xPos,
			tile.cartesian_coord.yPos
		);

		campfire.setTerritoryPoints(
			this.hexTileMap.getHexRadiusPoints(tile, Constant.CAMP_RADIUS)
		);

		this.campfires.add(campfire);
		tile.building = Constant.BUILDING.CAMP;
		//this.changedTiles.push(tile); //TODO
		this.collision.insertCollider(campfire, Constant.WALL_RADIUS);
	}

	initBases(): void {
		for (let teamNum = 0; teamNum < Constant.TEAM_COUNT; teamNum++) {
			this.buildBase(teamNum, this.teams.getTeamBaseCoord(teamNum));
		}
	}

	buildBase(teamNum: number, coord: OffsetPoint): void {
		if (!this.hexTileMap.checkIfValidHex(coord)) {
			return;
		}

		const tile: Tile = this.hexTileMap.tileMap[coord.q][coord.r];
		tile.team = teamNum;
		tile.building = Constant.BUILDING.BASE;

		const base: Base = new Base(
			this.idGenerator.newID(),
			tile.cartesian_coord.xPos,
			tile.cartesian_coord.yPos,
			teamNum,
			tile
		);

		this.bases.add(base);
		this.collision.insertCollider(base, Constant.BASE_COL_RADIUS);

		this.teams.getTeam(
			teamNum
		).respawnCoords = this.hexTileMap.getHexRingPoints(tile, 2);

		// make it so you cant build on and around the base
		for (let i = 0; i <= 2; i++) {
			this.hexTileMap.getHexRingPoints(tile, i).forEach((coord) => {
				this.hexTileMap.tileMap[coord.q][coord.r].building =
					Constant.BUILDING.CANT_BUILD;
			});
		}
	}

	generateBoundaryColliders(): void {
		for (const boundaryHex of this.hexTileMap.boundaryCoords) {
			this.collision.insertCollider(
				this.hexTileMap.tileMap[boundaryHex.q][boundaryHex.r]
					.cartesian_coord,
				Constant.WALL_COL_RADIUS
			);
		}
	}

	addBaseTerritories() {
		// Add permanent territory from bases
		for (let i = 0; i < Constant.TEAM_COUNT; i++) {
			const teamBaseCoord = this.teams.getTeamBaseCoord(i);
			const points = this.hexTileMap.getHexRadiusPoints(
				this.hexTileMap.tileMap[teamBaseCoord.q][teamBaseCoord.r],
				Constant.CAMP_RADIUS
			);
			for (const pt of points) {
				const tempTile = this.hexTileMap.tileMap[pt.q][pt.r];
				if (tempTile.building == Constant.BUILDING.OUT_OF_BOUNDS) {
					continue;
				}
				tempTile.team = i;
				this.hexTileMap.tileMap[pt.q][pt.r] = tempTile;

				//this.changedTiles.push(tempTile);
				const xPosition = tempTile.cartesian_coord.xPos.toString();
				const yPosition = tempTile.cartesian_coord.yPos.toString();
				const tempTerritory = new Territory(
					xPosition + ', ' + yPosition,
					tempTile.cartesian_coord.xPos,
					tempTile.cartesian_coord.yPos,
					tempTile.team
				);

				this.territories.add(tempTerritory);
			}
		}
	}
}
