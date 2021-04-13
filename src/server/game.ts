/* eslint-disable @typescript-eslint/no-non-null-assertion */

import Player from './../shared/player';
import Teams from '../shared/teams';
import Bullet from './../shared/bullet';
import Wall from './../shared/wall';
import Campfire from './../shared/campfire';
import CollisionDetection from './collision';
import { HexTiles, Tile, OffsetPoint, Point } from './../shared/hexTiles';
import IDgenerator from './idGenerator';
import { Constant } from '../shared/constants';
import Territory from './../shared/territory';

export default class Game {
	teams: Teams;
	players: Map<string, Player>;
	bullets: Set<Bullet>;
	walls: Set<Wall>;
	campfires: Set<Campfire>;
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
		this.hexTileMap = new HexTiles();
		this.hexTileMap.generateMap();
		this.teams = new Teams(2, this.hexTileMap.baseCoords);
		this.collision = new CollisionDetection();
		this.previousUpdateTimestamp = Date.now();
		this.initCampfires();
		this.territories = new Set();
		this.addBaseTerritories();
		this.idGenerator = new IDgenerator();
		this.changedTiles = []; // delete

		setInterval(this.update.bind(this), 1000 / 60);
	}

	calculateTimePassed(): [number, number]{
		const currentTimestamp = Date.now();
		const timePassed =
			(currentTimestamp - this.previousUpdateTimestamp) / 1000;
		this.previousUpdateTimestamp = currentTimestamp;

		return [currentTimestamp, timePassed];
	}

	updateBullets(currentTimestamp, timePassed) {
		for (const aBullet of this.bullets) {
			aBullet.updatePosition(timePassed);

			if (aBullet.isExpired(currentTimestamp)) {
				this.collision.deleteCollider(aBullet, Constant.BULLET_RADIUS);
				this.bullets.delete(aBullet);
				continue;
			}

			this.collision.updateCollider(aBullet, Constant.BULLET_RADIUS);
		}
	}

	updateTerritories() {
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
	}

	updateWalls() {
		for (const aWall of this.walls) {
			this.collision.buildingBulletCollision(aWall, this.bullets);
			if (!aWall.isAlive()) {
				this.collision.deleteCollider(aWall, Constant.WALL_RADIUS);
				aWall.tile.setEmpty();
				this.walls.delete(aWall);
			}
			//this.changedTiles.push(aWall.tile);
		}
	}

	updatePlayers(currentTimestamp) {
		this.updatePlayerPosition(currentTimestamp);

		// Send updates to player
		for (const aPlayer of this.players.values()) {
			aPlayer.socket.emit(
				Constant.MESSAGE.GAME_UPDATE,
				this.createUpdate(aPlayer)
			);
		}
	}

	updatePlayerPosition(currentTimestamp) {
		for (const aPlayer of this.players.values()) {
			aPlayer.updatePosition(currentTimestamp, this.collision);
			this.collision.playerBulletCollision(aPlayer, this.bullets);
			if (aPlayer.health <= 0) {
				this.respawnPlayer(aPlayer);
			}
		}
	}

	update() {
		const [currentTimestamp, timePassed] = this.calculateTimePassed();

		//this.changedTiles = [];

		this.updateBullets(currentTimestamp, timePassed);

		this.updateTerritories();

		this.updateWalls();

		this.updatePlayers(currentTimestamp);
	}

	createPlayerUpdate(player: Player){
		const nearbyPlayers: Player[] = [];

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

		return nearbyPlayers;
	}

	createBulletUpdate(player: Player) {
		const nearbyBullets: Bullet[] = [];

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

		return nearbyBullets;
	}

	createWallUpdate(player: Player) {
		const nearbyWalls: Wall[] = [];

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

		return nearbyWalls;
	}

	createCampfireUpdate(player: Player) {
		const nearbyCampfires: Campfire[] = [];

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

		return nearbyCampfires;
	}

	createTerritoryUpdate(player: Player) {
		const nearbyTerritories: Territory[] = [];

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

		return nearbyTerritories;
	}

	createUpdate(player: Player) {
		const nearbyPlayers: Player[] = this.createPlayerUpdate(player);
		const nearbyBullets: Bullet[] = this.createBulletUpdate(player);;
		const nearbyWalls: Wall[] = this.createWallUpdate(player);
		const nearbyCampfires: Campfire[] = this.createCampfireUpdate(player);
		const nearbyTerritories: Territory[] = this.createTerritoryUpdate(player);
		//const changedTiles: Tile[] = this.changedTiles;

		return {
			time: Date.now(),
			currentPlayer: player.serializeForUpdate(),
			otherPlayers: nearbyPlayers.map((p) => p.serializeForUpdate()),
			bullets: nearbyBullets.map((p) => p.serializeForUpdate()),
			walls: nearbyWalls.map((p) => p.serializeForUpdate()),
			campfires: nearbyCampfires.map((p) => p.serializeForUpdate()),
			territories: nearbyTerritories.map((p) => p.serializeForUpdate()),
 			//changedTiles: changedTiles, // delete
		};
	}

	generateNewPlayer(socket) {
		console.log('Hello: ' + socket.id); // delete
		const team: number = this.teams.addNewPlayer(socket.id);

		console.log('Assigning to team ' + team); // delete
		const newPlayer = new Player(socket, 0, 0, team);

		return newPlayer;
	}

	initiateGame(newPlayer, socket) {
		const initObject = {
			player: newPlayer.serializeForUpdate(),
			tileMap: this.hexTileMap.tileMap,
		};

		socket.emit(Constant.MESSAGE.INITIALIZE, initObject);
	}

	addPlayer(socket: SocketIOClient.Socket) {
		const newPlayer = this.generateNewPlayer(socket);

		this.respawnPlayer(newPlayer);

		this.players.set(socket.id, newPlayer);

		this.collision.insertCollider(newPlayer, Constant.PLAYER_RADIUS);
		console.log('inserted', newPlayer.id); // delete

		this.initiateGame(newPlayer, socket);
	}

	removePlayer(socket: SocketIOClient.Socket) {
		console.log('Goodbye: ' + socket.id); // delete
		if (!this.players.has(socket.id)) return;

		const player: Player = this.getPlayer(socket.id);

		this.collision.deleteCollider(player, Constant.PLAYER_RADIUS);

		this.teams.removePlayer(socket.id, player.teamNumber);

		this.players.delete(socket.id);
	}

	private getPlayer(socketID): Player {
		return this.players.get(socketID)!;
	}

	respawnPlayer(player: Player) {
		console.log('Respawning: ' + player.socket.id);

		this.collision.deleteCollider(player, Constant.PLAYER_RADIUS);

		const respawnPoint: Point = this.hexTileMap.offsetToCartesian(
			this.teams.getTeamBaseCoord(player.teamNumber)
		);

		player.health = 100;
		player.xPos = respawnPoint.xPos;
		player.yPos = respawnPoint.yPos;

		this.collision.insertCollider(player, Constant.PLAYER_RADIUS);
	}

	movePlayer(socket: SocketIOClient.Socket, direction: number) {
		if (!this.players.has(socket.id)) return;
		const player: Player = this.getPlayer(socket.id)!;

		player.updateVelocity(direction);
		player.updatePosition(Date.now(), this.collision);
		this.collision.updateCollider(player, Constant.PLAYER_RADIUS);
	}

	rotatePlayer(socket: SocketIOClient.Socket, direction: number): void {
		if (!this.players.has(socket.id)) return;
		const player = this.getPlayer(socket.id);

		player?.updateDirection(direction);
	}

	shootBullet(socket: SocketIOClient.Socket, direction: number) {
		if (!this.players.has(socket.id)) return;
		const player: Player = this.getPlayer(socket.id)!;

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

	isAValidWall(socket: SocketIOClient.Socket, coord: OffsetPoint): boolean {
		if (!this.players.has(socket.id)) return false;
		if (!this.hexTileMap.checkIfValidHex(coord)) return false;

		const player: Player = this.getPlayer(socket.id)!;
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
			return false; //TODO
		
		return true;
	}

	buildWall(socket: SocketIOClient.Socket, coord: OffsetPoint): void {
		if(!this.isAValidWall(socket, coord)) return;

		const player: Player = this.getPlayer(socket.id)!;
		const tile: Tile = this.hexTileMap.tileMap[coord.q][coord.r];

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

		this.collision.insertCollider(wall, Constant.WALL_RADIUS);
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

	initCampfires(): void {
		this.campfires = new Set();

		const tilemap = this.hexTileMap.tileMap;
		for (let i = 0; i < tilemap.length; i++) {
			for (let j = 0; j < tilemap[i].length; j++) {
				if (tilemap[i][j].building == Constant.BUILDING.CAMP) {
					this.buildCampfire(tilemap[i][j].offset_coord);
				}
			}
		}
	}

	setBaseTerritory(teamNumber, points) {
		for (const pt of points) {
			const tempTile = this.hexTileMap.tileMap[pt.q][pt.r];
			if (tempTile.building == Constant.BUILDING.OUT_OF_BOUNDS) {
				continue;
			}
			tempTile.team = teamNumber;
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

	addBaseTerritories() {
		// Add permanent territory from bases
		for (let i = 0; i < Constant.TEAM_COUNT; i++) {
			const teamBaseCoord = this.teams.getTeamBaseCoord(i);
			const points = this.hexTileMap.getHexRadiusPoints(
				this.hexTileMap.tileMap[teamBaseCoord.q][teamBaseCoord.r],
				Constant.CAMP_RADIUS
			);
			this.setBaseTerritory(i, points);
		}
	}
}
