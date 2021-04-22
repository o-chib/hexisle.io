/* eslint-disable @typescript-eslint/no-non-null-assertion */

import Player from './../shared/player';
import Teams from '../shared/teams';
import Bullet from './../shared/bullet';
import Wall from './../shared/wall';
import Turret from '../shared/turret';
import Campfire from './../shared/campfire';
import Base from './../shared/base';
import CollisionDetection from './collision';
import { HexTiles, Tile, OffsetPoint, Point } from './../shared/hexTiles';
import IDgenerator from './idGenerator';
import { Constant } from '../shared/constants';
import Territory from './../shared/territory';

export default class Game {
	teams: Teams;
	players: Map<string, Player>;
	bullets: Set<Bullet>;
	walls: Map<string, Wall>;
	turrets: Map<string, Turret>;
	campfires: Set<Campfire>;
	bases: Set<Base>;
	territories: Set<Territory>;
	hexTileMap: HexTiles;
	idGenerator: IDgenerator;
	changedTiles: Tile[];
	collision: CollisionDetection;
	gameInterval: NodeJS.Timeout;
	resourceInterval: NodeJS.Timeout;
	gameOverCallback: () => void;
	previousUpdateTimestamp: any;
	endGameTimestamp: number;
	gameTimeRemaining: number;

	constructor(gameOverCallback) {
		this.gameOverCallback = gameOverCallback;

		this.endGameTimestamp = Date.now() + Constant.TIMING.GAME_TIME_LIMIT;
		this.players = new Map();
		this.bullets = new Set();
		this.walls = new Map();
		this.turrets = new Map();
		this.campfires = new Set();
		this.bases = new Set();
		this.territories = new Set();

		this.idGenerator = new IDgenerator();

		this.hexTileMap = new HexTiles();
		this.hexTileMap.generateMap();

		this.teams = new Teams(2, this.hexTileMap.baseCoords);

		this.collision = new CollisionDetection();
		this.generateBoundaryColliders();

		this.initCampfires();
		this.addBaseTerritories();
		this.initBases();

		this.previousUpdateTimestamp = Date.now();
		this.gameInterval = setInterval(
			this.update.bind(this),
			Constant.TIMING.SERVER_GAME_UPDATE
		);
		this.resourceInterval = setInterval(
			this.updatePlayerResource.bind(this),
			Constant.INCOME.UPDATE_RATE
		);
	}

	update() {
		const [currentTimestamp, timePassed] = this.calculateTimePassed();
		this.gameTimeRemaining = this.endGameTimestamp - currentTimestamp;

		this.updateBullets(currentTimestamp, timePassed);

		this.updateTerritories();

		this.updateWalls();

		this.updateTurrets();

		this.updateBases();

		this.updatePlayers(currentTimestamp);

		if (this.isGameOver()) this.endGame();

		this.sendStateToPlayers();
	}

	calculateTimePassed(): [number, number] {
		const currentTimestamp = Date.now();
		const timePassed =
			(currentTimestamp - this.previousUpdateTimestamp) / 1000;
		this.previousUpdateTimestamp = currentTimestamp;

		return [currentTimestamp, timePassed];
	}

	updatePlayerResource() {
		for (const aPlayer of this.players.values()) {
			const newResourceValue: number =
				this.teams.getTeam(aPlayer.teamNumber).numCapturedCamps *
				Constant.INCOME.INCOME_PER_CAMP;
			aPlayer.updateResource(newResourceValue);
		}
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

				if (isCaptured) {
					// If captured, updated numCapturedCamps
					this.teams.getTeam(aCampfire.teamNumber).numCapturedCamps++;
				} else {
					// If uncaptured, updated numCapturedCamps
					this.teams.getTeam(aCampfire.teamNumber).numCapturedCamps--;
				}

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
		for (const aWall of this.walls.values()) {
			this.collision.buildingBulletCollision(aWall, this.bullets);
			if (!aWall.isAlive()) {
				this.collision.deleteCollider(aWall, Constant.WALL_RADIUS);
				aWall.tile.removeBuilding();
				this.walls.delete(aWall.id);
			}
		}
	}

	updateTurrets() {
		for (const aTurret of this.turrets.values()) {
			this.collision.buildingBulletCollision(aTurret, this.bullets);
			if (!aTurret.isAlive()) {
				this.collision.deleteCollider(aTurret, Constant.TURRET_RADIUS);
				aTurret.tile.removeBuilding();
				this.turrets.delete(aTurret.id);
				continue;
			}

			if (aTurret.canShoot()) {
				this.turretShootBullet(aTurret);
				aTurret.reloadTimer = Constant.TIMING.TURRET_RELOAD_TIME;
			} else if (aTurret.reloadTimer > 0) {
				aTurret.reloadTimer -= 1;
			}
		}
	}

	updateBases() {
		for (const aBase of this.bases) {
			this.collision.buildingBulletCollision(aBase, this.bullets);
			if (!aBase.isAlive()) {
				this.collision.deleteCollider(aBase, Constant.BASE_COL_RADIUS);

				// empty all the nearby tiles (respawn points to center base tile)
				this.hexTileMap
					.getHexRadiusPoints(aBase.tile, 2)
					.forEach((coord) => {
						this.hexTileMap.tileMap[coord.q][
							coord.r
						].removeBuilding();
					});

				this.bases.delete(aBase);
			}
		}
	}

	updatePlayers(currentTimestamp) {
		this.updatePlayerPosition(currentTimestamp);
	}

	sendStateToPlayers() {
		// Send updates to player
		for (const aPlayer of this.players.values()) {
			aPlayer.socket.emit(
				Constant.MESSAGE.GAME_UPDATE,
				this.createUpdate(aPlayer)
			);
		}
	}

	isGameOver(): boolean {
		if (this.bases.size == 1 || this.gameTimeRemaining <= 0) {
			return true;
		}
		return false;
	}

	endGame(): void {
		for (const aPlayer of this.players.values()) {
			aPlayer.socket.emit(
				Constant.MESSAGE.GAME_END,
				this.createGameEndRecap()
			);
		}
		this.stopAllIntervals();
		setTimeout(this.gameOverCallback, Constant.TIMING.GAME_END_SCREEN); //TODO remove timeout later?
	}

	createGameEndRecap() {
		let redCamps = 0;
		let blueCamps = 0;
		for (const camp of this.campfires) {
			if (camp.teamNumber == Constant.TEAM.RED) redCamps++;
			else if (camp.teamNumber == Constant.TEAM.RED) blueCamps++;
		}

		let winner = Constant.TEAM.NONE;
		let message: string;

		if (this.bases.size == 1) {
			for (const base of this.bases) {
				//TODO do we need to do a loop?
				winner = base.teamNumber;
			}
			message = 'All other team bases eliminated!';
		} else {
			if (redCamps > blueCamps) winner = Constant.TEAM.RED;
			else if (redCamps < blueCamps) winner = Constant.TEAM.BLUE;

			message = 'Time Up!';
		}

		return {
			winner: winner,
			message: message,
			campCount: {
				red: redCamps,
				blue: blueCamps,
			},
		};
	}

	stopAllIntervals(): void {
		clearInterval(this.gameInterval);
		clearInterval(this.resourceInterval);
	}

	updatePlayerPosition(currentTimestamp) {
		for (const aPlayer of this.players.values()) {
			aPlayer.updatePosition(currentTimestamp, this.collision);
			this.collision.playerBulletCollision(aPlayer, this.bullets);
			if (aPlayer.health == 0) {
				// Give time for player to play death animation
				// Only call timeout once
				this.collision.deleteCollider(aPlayer, Constant.PLAYER_RADIUS);
				aPlayer.health = -1;
				setTimeout(() => {
					this.respawnPlayer(aPlayer);
				}, 3000);
			}
		}
	}

	createPlayerUpdate(player: Player) {
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

		for (const aWall of this.walls.values()) {
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

	createTurretUpdate(player: Player) {
		const nearbyTurrets: Turret[] = [];

		for (const aTurret of this.turrets.values()) {
			if (
				this.collision.doCirclesCollide(
					aTurret,
					Constant.TURRET_RADIUS,
					player,
					Constant.VIEW_RADIUS
				)
			)
				nearbyTurrets.push(aTurret);
		}

		return nearbyTurrets;
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

	createBaseUpdate(player: Player) {
		const nearbyBases: Base[] = [];

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

		return nearbyBases;
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
		const nearbyBullets: Bullet[] = this.createBulletUpdate(player);
		const nearbyWalls: Wall[] = this.createWallUpdate(player);
		const nearbyTurrets: Turret[] = this.createTurretUpdate(player);
		const nearbyCampfires: Campfire[] = this.createCampfireUpdate(player);
		const nearbyBases: Base[] = this.createBaseUpdate(player);
		const nearbyTerritories: Territory[] = this.createTerritoryUpdate(
			player
		);

		return {
			time: this.gameTimeRemaining,
			currentPlayer: player.serializeForUpdate(),
			otherPlayers: nearbyPlayers.map((p) => p.serializeForUpdate()),
			bullets: nearbyBullets.map((p) => p.serializeForUpdate()),
			walls: nearbyWalls.map((p) => p.serializeForUpdate()),
			turrets: nearbyTurrets.map((p) => p.serializeForUpdate()),
			campfires: nearbyCampfires.map((p) => p.serializeForUpdate()),
			bases: nearbyBases.map((p) => p.serializeForUpdate()),
			territories: nearbyTerritories.map((p) => p.serializeForUpdate()),
		};
	}

	initiateGame(newPlayer, socket) {
		const initObject = {
			player: newPlayer.serializeForUpdate(),
			tileMap: this.hexTileMap.tileMap,
		};

		socket.emit(Constant.MESSAGE.INITIALIZE, initObject);
	}

	generateNewPlayer(socket) {
		const team: number = this.teams.addNewPlayer(socket.id);
		const newPlayer = new Player(socket, 0, 0, team);
		this.players.set(socket.id, newPlayer);
		return newPlayer;
	}

	addPlayer(socket: SocketIOClient.Socket) {
		const newPlayer = this.generateNewPlayer(socket);

		const respawnPoint: Point = this.getRespawnPoint(newPlayer.teamNumber);
		newPlayer.xPos = respawnPoint.xPos;
		newPlayer.yPos = respawnPoint.yPos;

		this.collision.insertCollider(newPlayer, Constant.PLAYER_RADIUS);

		this.initiateGame(newPlayer, socket);
	}

	removePlayer(socket: SocketIOClient.Socket) {
		if (!this.players.has(socket.id)) return;

		const player: Player = this.getPlayer(socket.id);

		this.collision.deleteCollider(player, Constant.PLAYER_RADIUS);

		this.teams.removePlayer(socket.id, player.teamNumber);

		this.players.delete(socket.id);
	}

	respawnPlayer(player: Player) {
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

	playerShootBullet(socket: SocketIOClient.Socket, direction: number) {
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

	turretShootBullet(turret: Turret) {
		const direction: number = this.collision.findTurretClosestEnemyDirection(
			turret,
			Constant.TURRET_RANGE_RADIUS
		);

		if (direction == -1) {
			return;
		}

		const bullet: Bullet = new Bullet(
			this.idGenerator.newID(),
			turret.xPos,
			turret.yPos,
			direction,
			turret.teamNumber
		);

		this.bullets.add(bullet);
		this.collision.insertCollider(bullet, Constant.BULLET_RADIUS);
	}

	canBuildWall(socket: SocketIOClient.Socket, coord: OffsetPoint): boolean {
		if (!this.players.has(socket.id)) return false;
		if (!this.hexTileMap.checkIfValidHex(coord)) return false;

		const player: Player = this.getPlayer(socket.id)!;
		const tile: Tile = this.hexTileMap.tileMap[coord.q][coord.r];

		if (
			!tile.hasNoBuilding() ||
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
		if (!this.canBuildWall(socket, coord)) return;

		const player: Player = this.getPlayer(socket.id)!;
		const tile: Tile = this.hexTileMap.tileMap[coord.q][coord.r];

		const wall: Wall = new Wall(
			this.idGenerator.newID(),
			tile.cartesian_coord.xPos,
			tile.cartesian_coord.yPos,
			player.teamNumber,
			tile
		);

		this.walls.set(wall.id, wall);
		tile.building = Constant.BUILDING.WALL;
		tile.buildingId = wall.id;
		this.collision.insertCollider(wall, Constant.WALL_RADIUS);
	}

	canDemolishWall(
		socket: SocketIOClient.Socket,
		coord: OffsetPoint
	): boolean {
		if (!this.players.has(socket.id)) return false;
		if (!this.hexTileMap.checkIfValidHex(coord)) return false;

		const player: Player = this.getPlayer(socket.id)!;
		const tile: Tile = this.hexTileMap.tileMap[coord.q][coord.r];

		if (
			tile.hasNoBuilding() ||
			tile.building != Constant.BUILDING.WALL ||
			tile.team != player.teamNumber
		)
			return false; //TODO

		player.refundWall();
		return true;
	}

	canBuildTurret(socket: SocketIOClient.Socket, coord: OffsetPoint): boolean {
		if (!this.players.has(socket.id)) return false;
		if (!this.hexTileMap.checkIfValidHex(coord)) return false;

		const player: Player = this.getPlayer(socket.id)!;
		const tile: Tile = this.hexTileMap.tileMap[coord.q][coord.r];

		if (
			!tile.hasNoBuilding() ||
			this.collision.doesObjCollideWithPlayers(
				tile.cartesian_coord.xPos,
				tile.cartesian_coord.yPos,
				Constant.TURRET_RADIUS
			) ||
			tile.team != player.teamNumber ||
			!player.buyTurret()
		)
			return false; //TODO

		return true;
	}

	buildTurret(socket: SocketIOClient.Socket, coord: OffsetPoint): void {
		if (!this.canBuildTurret(socket, coord)) return;

		const player: Player = this.getPlayer(socket.id)!;
		const tile: Tile = this.hexTileMap.tileMap[coord.q][coord.r];

		const turret: Turret = new Turret(
			this.idGenerator.newID(),
			tile.cartesian_coord.xPos,
			tile.cartesian_coord.yPos,
			player.teamNumber,
			tile
		);

		this.turrets.set(turret.id, turret);
		tile.building = Constant.BUILDING.TURRET;
		tile.buildingId = turret.id;
		this.collision.insertCollider(turret, Constant.TURRET_RADIUS);
	}

	canDemolishTurret(
		socket: SocketIOClient.Socket,
		coord: OffsetPoint
	): boolean {
		if (!this.players.has(socket.id)) return false;
		if (!this.hexTileMap.checkIfValidHex(coord)) return false;

		const player: Player = this.getPlayer(socket.id)!;
		const tile: Tile = this.hexTileMap.tileMap[coord.q][coord.r];

		if (
			tile.hasNoBuilding() ||
			tile.building != Constant.BUILDING.TURRET ||
			tile.team != player.teamNumber
		)
			return false; //TODO

		player.refundTurret();
		return true;
	}

	demolishStructure(socket: SocketIOClient.Socket, coord: OffsetPoint): void {
		const tile: Tile = this.hexTileMap.tileMap[coord.q][coord.r];
		const structure: string = tile.building;

		if (structure == Constant.BUILDING.WALL) {
			if (!this.canDemolishWall(socket, coord)) return;

			this.collision.deleteCollider(
				this.walls.get(tile.buildingId),
				Constant.WALL_RADIUS
			);
			this.walls.delete(tile.buildingId);
			tile.removeBuilding();

		} else if (structure == Constant.BUILDING.TURRET) {
			if (!this.canDemolishTurret(socket, coord)) return;

			this.collision.deleteCollider(
				this.turrets.get(tile.buildingId),
				Constant.TURRET_RADIUS
			);
			this.turrets.delete(tile.buildingId);
			tile.removeBuilding();
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

		this.collision.insertCollider(campfire, Constant.WALL_RADIUS);
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

	initBases(): void {
		for (let teamNum = 0; teamNum < Constant.TEAM_COUNT; teamNum++) {
			this.buildBase(teamNum, this.teams.getTeamBaseCoord(teamNum));
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

	generateBoundaryColliders(): void {
		for (const boundaryHex of this.hexTileMap.boundaryCoords) {
			this.collision.insertCollider(
				this.hexTileMap.tileMap[boundaryHex.q][boundaryHex.r]
					.cartesian_coord,
				Constant.WALL_COL_RADIUS
			);
		}
	}

	private getPlayer(socketID): Player {
		return this.players.get(socketID)!;
	}
}
