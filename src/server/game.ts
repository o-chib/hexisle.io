/* eslint-disable @typescript-eslint/no-non-null-assertion */

import Player from './objects/player';
import Teams from './teams';
import Bullet from './objects/bullet';
import Wall from './objects/wall';
import Turret from './objects/turret';
import Campfire from './objects/campfire';
import Base from './objects/base';
import CollisionDetection from './collision';
import { HexTiles, Tile, OffsetPoint, Point } from './../shared/hexTiles';
import IDgenerator from './idGenerator';
import { Constant } from '../shared/constants';
import Territory from './objects/territory';
import { MapResources } from './mapResources';
import { PassiveIncome } from './passiveIncome';
import * as SocketIO from 'socket.io';
import { Resource } from './objects/resource';

export default class Game {
	hexTileMap: HexTiles;
	collision: CollisionDetection;
	teams: Teams;
	mapResources: MapResources;
	passiveIncome: PassiveIncome;
	idGenerator: IDgenerator;
	players: Map<string, Player>;
	bullets: Set<Bullet>;
	walls: Map<string, Wall>;
	turrets: Map<string, Turret>;
	campfires: Set<Campfire>;
	bases: Set<Base>;
	territories: Set<Territory>;
	gameInterval: NodeJS.Timeout;
	gameOverCallback: () => void;
	previousUpdateTimestamp: number;
	endGameTimestamp: number;
	gameTimeRemaining: number;

	constructor(gameOverCallback: () => any) {
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

		this.teams = new Teams(Constant.TEAM_COUNT, this.hexTileMap.baseCoords);

		this.collision = new CollisionDetection();
		this.generateBoundaryColliders();

		this.initCampfires();
		this.addBaseTerritories();
		this.initBases();

		this.mapResources = new MapResources(this.addResource.bind(this));
		this.mapResources.addInitialResources();

		this.passiveIncome = new PassiveIncome(this.teams);

		this.gameOverCallback = gameOverCallback;
		this.endGameTimestamp = Date.now() + Constant.GAME_TIMING.TIME_LIMIT;
		this.gameTimeRemaining = Constant.GAME_TIMING.TIME_LIMIT;

		this.previousUpdateTimestamp = Date.now();
		this.gameInterval = setInterval(
			this.update.bind(this),
			Constant.GAME_TIMING.UPDATE_RATE
		);
	}

	update() {
		const [currentTimestamp, timePassed] = this.calculateTimePassed();
		this.gameTimeRemaining = this.endGameTimestamp - currentTimestamp;

		if (timePassed > 24)
			console.log('WARNING : Update took ', timePassed, 'ms');

		this.updateBullets(currentTimestamp, timePassed);

		this.updateTerritories();

		this.updateWalls();

		this.updateTurrets(timePassed);

		this.updateBases();

		this.updatePlayers(currentTimestamp, timePassed);

		this.updateMapResources(timePassed);

		if (this.isGameOver()) this.endGame();

		this.sendStateToPlayers();
	}

	calculateTimePassed(): [number, number] {
		const currentTimestamp = Date.now();
		const timePassed = currentTimestamp - this.previousUpdateTimestamp;
		this.previousUpdateTimestamp = currentTimestamp;

		return [currentTimestamp, timePassed];
	}

	updateBullets(currentTimestamp, timePassed) {
		for (const aBullet of this.bullets) {
			aBullet.updatePosition(timePassed);

			if (aBullet.isExpired(currentTimestamp)) {
				this.collision.deleteCollider(
					aBullet,
					Constant.RADIUS.COLLISION.BULLET
				);
				this.bullets.delete(aBullet);
				continue;
			}

			this.collision.updateCollider(
				aBullet,
				Constant.RADIUS.COLLISION.BULLET
			);
		}
	}

	updateTerritories() {
		// update tileMap with captured tiles
		// update territories with campfire status
		for (const aCampfire of this.campfires) {
			this.collision.campfirePlayerCollision(aCampfire);

			if (aCampfire.captureProgress == 100) {
				const prevCampTeam: number = aCampfire.teamNumber;
				aCampfire.checkForCapture();
				const isCaptured = aCampfire.isCaptured;
				const points = aCampfire.territoryPoints;
				if (isCaptured) {
					// If captured, updated numCapturedCamps
					this.teams.getTeam(aCampfire.capturingTeam)
						.numCapturedCamps++;
				} else {
					// If uncaptured, updated numCapturedCamps
					this.teams.getTeam(prevCampTeam).numCapturedCamps--;
				}

				aCampfire.resetProgress();

				// Update the TileMap structure
				for (const pt of points) {
					if (!this.hexTileMap.checkIfValidHex(pt)) continue;
					const tempTile = this.hexTileMap.tileMap[pt.q][pt.r];
					if (!tempTile.isInBounds()) continue;
					tempTile.changeTeamNumber(aCampfire.teamNumber);
					this.hexTileMap.tileMap[pt.q][pt.r] = tempTile;
				}

				// Update team num of territory
				const xPosition = aCampfire.xPos;
				const yPosition = aCampfire.yPos;
				const stringID =
					xPosition.toString() + ', ' + yPosition.toString();

				for (const aTerritory of this.territories) {
					if (aTerritory.id == stringID) {
						this.territories.delete(aTerritory);
						break;
					}
				}

				const tempTerritory = new Territory(
					stringID,
					xPosition,
					yPosition,
					aCampfire.teamNumber
				);
				this.territories.add(tempTerritory);
			}
		}
	}

	updateWalls() {
		for (const aWall of this.walls.values()) {
			this.collision.buildingBulletCollision(aWall, this.bullets);
			if (!aWall.isAlive()) {
				this.removeWall(aWall);
			}
		}
	}

	updateTurrets(timePassed: number) {
		for (const aTurret of this.turrets.values()) {
			this.collision.buildingBulletCollision(aTurret, this.bullets);
			if (!aTurret.isAlive()) {
				this.removeTurret(aTurret);
				continue;
			}

			if (aTurret.teamNumber != Constant.TEAM.NONE) {
				aTurret.aimAndFireIfPossible(
					this.collision.findDirectionOfClosestEnemy(
						aTurret,
						Constant.RADIUS.RANGE.TURRET
					),
					timePassed
				);
			}
		}
	}

	updateBases() {
		for (const aBase of this.bases) {
			this.collision.buildingBulletCollision(aBase, this.bullets);
			if (!aBase.isAlive()) {
				this.collision.deleteCollider(
					aBase,
					Constant.RADIUS.COLLISION.BASE
				);

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

	updatePlayers(currentTimestamp: number, timePassed: number) {
		const givePassiveIncome: boolean =
			this.passiveIncome.givePassiveIncomeIfPossible(timePassed);
		for (const aPlayer of this.players.values()) {
			aPlayer.reload(timePassed);
			this.updatePlayerPosition(currentTimestamp, aPlayer);
			if (aPlayer.isAlive() && givePassiveIncome) {
				this.passiveIncome.updatePlayerResources(aPlayer);
			}
		}
	}

	updateMapResources(timePassed: number): void {
		this.mapResources.updateMapResourcesIfPossible(timePassed);
	}

	sendStateToPlayers(): void {
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
		const gameOverMessage = this.createGameEndRecap();
		for (const aPlayer of this.players.values()) {
			aPlayer.socket.emit(Constant.MESSAGE.GAME_END, gameOverMessage);
		}
		this.stopAllIntervals();
		this.gameOverCallback();
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
	}

	updatePlayerPosition(currentTimestamp: number, player: Player): void {
		player.updatePosition(currentTimestamp, this.collision);
		this.collision.playerBulletResourceCollision(
			player,
			this.bullets,
			this.mapResources
		);
		if (player.hp == 0) {
			// Give time for player to play death animation
			// Only call timeout once
			this.collision.deleteCollider(
				player,
				Constant.RADIUS.COLLISION.PLAYER
			);
			player.hp = -1;
			player.setNoVelocity();
			setTimeout(() => {
				this.respawnPlayer(player);
			}, 3000);
		}
	}

	createPlayerUpdate(player: Player) {
		const nearbyPlayers: Player[] = [];

		for (const aPlayer of this.players.values()) {
			if (aPlayer === player) continue;
			if (
				this.collision.doCirclesCollide(
					aPlayer,
					Constant.RADIUS.PLAYER,
					player,
					Constant.RADIUS.VIEW
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
					Constant.RADIUS.BULLET,
					player,
					Constant.RADIUS.VIEW
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
					Constant.RADIUS.WALL,
					player,
					Constant.RADIUS.VIEW
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
					Constant.RADIUS.TURRET,
					player,
					Constant.RADIUS.VIEW
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
					Constant.RADIUS.TERRITORY,
					player,
					Constant.RADIUS.VIEW
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
					Constant.RADIUS.TERRITORY,
					player,
					Constant.RADIUS.VIEW
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
					Constant.RADIUS.TERRITORY,
					player,
					Constant.RADIUS.VIEW
				)
			)
				nearbyTerritories.push(aTerritory);
		}

		return nearbyTerritories;
	}

	createResourceUpdate(player: Player): Resource[] {
		const nearbyResources: Resource[] = [];

		for (const aResource of this.mapResources.resources) {
			if (
				this.collision.doCirclesCollide(
					aResource,
					Constant.RADIUS.RESOURCE,
					player,
					Constant.RADIUS.VIEW
				)
			)
				nearbyResources.push(aResource);
		}

		return nearbyResources;
	}

	createUpdate(player: Player) {
		const nearbyPlayers: Player[] = this.createPlayerUpdate(player);
		const nearbyBullets: Bullet[] = this.createBulletUpdate(player);
		const nearbyWalls: Wall[] = this.createWallUpdate(player);
		const nearbyTurrets: Turret[] = this.createTurretUpdate(player);
		const nearbyCampfires: Campfire[] = this.createCampfireUpdate(player);
		const nearbyBases: Base[] = this.createBaseUpdate(player);
		const nearbyTerritories: Territory[] =
			this.createTerritoryUpdate(player);
		const nearbyResources: Resource[] = this.createResourceUpdate(player);

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
			resources: nearbyResources.map((p) => p.serializeForUpdate()),
		};
	}

	initiateGame(newPlayer, socket) {
		const initObject = {
			player: newPlayer.serializeForUpdate(),
		};

		socket.emit(Constant.MESSAGE.INITIALIZE, initObject);
	}

	generateNewPlayer(socket, name: string) {
		const team: number = this.teams.addNewPlayer(socket.id);
		const newPlayer = new Player(
			socket,
			team,
			name,
			this.shootBullet.bind(this)
		);
		this.players.set(socket.id, newPlayer);
		return newPlayer;
	}

	addPlayer(socket: SocketIO.Socket, name = '') {
		if (this.players.has(socket.id)) return;

		const newPlayer = this.generateNewPlayer(socket, name);

		const respawnPoint: Point = this.getRespawnPoint(newPlayer.teamNumber);
		newPlayer.xPos = respawnPoint.xPos;
		newPlayer.yPos = respawnPoint.yPos;

		this.collision.insertCollider(
			newPlayer,
			Constant.RADIUS.COLLISION.PLAYER
		);

		this.initiateGame(newPlayer, socket);
	}

	removePlayer(socket: SocketIO.Socket) {
		if (!this.players.has(socket.id)) return;

		const player: Player = this.getPlayer(socket.id);

		this.collision.deleteCollider(player, Constant.RADIUS.COLLISION.PLAYER);

		this.teams.removePlayer(socket.id, player.teamNumber);

		this.players.delete(socket.id);
	}

	respawnPlayer(player: Player) {
		const respawnPoint: Point = this.getRespawnPoint(player.teamNumber);
		player.respawn(respawnPoint);
		this.collision.insertCollider(player, Constant.RADIUS.COLLISION.PLAYER);
	}

	getRespawnPoint(teamNum: number): Point {
		const coords: OffsetPoint[] = this.teams.getRespawnCoords(teamNum);
		const index = Math.floor(Math.random() * coords.length);
		return this.hexTileMap.offsetToCartesian(coords[index]);
	}

	movePlayer(socket: SocketIO.Socket, direction: number) {
		if (!this.players.has(socket.id)) return;
		const player: Player = this.getPlayer(socket.id)!;

		player.updateVelocity(direction);
		player.updatePosition(Date.now(), this.collision);
		this.collision.updateCollider(player, Constant.RADIUS.COLLISION.PLAYER);
	}

	rotatePlayer(socket: SocketIO.Socket, direction: number): void {
		if (!this.players.has(socket.id)) return;
		const player = this.getPlayer(socket.id);

		player?.updateDirection(direction);
	}

	addResource(): void {
		const randomPoint = this.getRandomEmptyPointOnMap();
		if (!randomPoint) return;

		const newResource: Resource = this.mapResources.generateResource(
			this.idGenerator.newID(),
			randomPoint
		);

		this.collision.insertCollider(newResource, Constant.RADIUS.RESOURCE);
	}

	getRandomEmptyPointOnMap(): Point | null {
		let loopLimit = Constant.RANDOM_LOOP_LIMIT;
		let point: Point;

		do {
			if (loopLimit <= 0) return null;
			point = this.getRandomMapPoint();
			loopLimit--;
		} while (!this.hexTileMap.checkIfValidEmptyPointOnGrid(point));

		return point;
	}

	getRandomMapPoint(): Point {
		return new Point(
			Math.random() * Constant.MAP_WIDTH,
			Math.random() * Constant.MAP_HEIGHT
		);
	}

	shootBullet(object: any, direction: number): void {
		const bullet: Bullet = new Bullet(
			this.idGenerator.newID(),
			object.xPos,
			object.yPos,
			direction,
			object.teamNumber
		);
		this.bullets.add(bullet);
		this.collision.insertCollider(bullet, Constant.RADIUS.COLLISION.BULLET);
	}

	playerShootBullet(socket: SocketIO.Socket, direction: number) {
		if (!this.players.has(socket.id)) return;
		const player: Player = this.getPlayer(socket.id)!;
		player.shootBullet(direction);
	}

	canBuildStructure(player: Player, tile: Tile, building: string): boolean {
		const collisionRadius = Constant.RADIUS.COLLISION[building];
		if (
			!tile.hasNoBuilding() ||
			tile.teamNumber != player.teamNumber ||
			this.collision.doesObjCollideWithPlayers(
				tile.cartesian_coord.xPos,
				tile.cartesian_coord.yPos,
				collisionRadius
			) ||
			!player.canAffordStructure(building)
		) {
			return false;
		}

		return true;
	}

	buildStructure(
		socket: SocketIO.Socket,
		x: number,
		y: number,
		building: string
	): void {
		const coord = HexTiles.cartesianToOffset(x, y);
		if (
			!this.players.has(socket.id) ||
			!this.hexTileMap.checkIfValidHex(coord)
		)
			return;

		const player: Player = this.getPlayer(socket.id)!;
		const tile: Tile = this.hexTileMap.tileMap[coord.q][coord.r];

		if (!this.canBuildStructure(player, tile, building)) return;

		player.buyStructure(building);
		if (building == Constant.BUILDING.WALL) {
			this.addWall(tile);
		} else if (building == Constant.BUILDING.TURRET) {
			this.addTurret(tile);
		}
	}

	addWall(tile: Tile): void {
		const wall: Wall = new Wall(this.idGenerator.newID(), tile);
		this.walls.set(wall.id, wall);
		this.collision.insertCollider(wall, Constant.RADIUS.COLLISION.WALL);
	}

	addTurret(tile: Tile): void {
		const turret: Turret = new Turret(
			this.idGenerator.newID(),
			tile,
			this.shootBullet.bind(this)
		);
		this.turrets.set(turret.id, turret);
		this.collision.insertCollider(turret, Constant.RADIUS.COLLISION.TURRET);
	}

	canDemolishStructure(player: Player, tile: Tile): boolean {
		if (
			tile.hasNoBuilding() ||
			(tile.building != Constant.BUILDING.WALL &&
				tile.building != Constant.BUILDING.TURRET) ||
			tile.teamNumber != player.teamNumber
		)
			return false;

		return true;
	}

	demolishStructure(socket: SocketIO.Socket, x: number, y: number): void {
		const coord = HexTiles.cartesianToOffset(x, y);
		if (
			!this.players.has(socket.id) ||
			!this.hexTileMap.checkIfValidHex(coord)
		)
			return;

		const tile: Tile = this.hexTileMap.tileMap[coord.q][coord.r];
		const player: Player = this.getPlayer(socket.id);

		if (!this.canDemolishStructure(player, tile)) return;

		player.refundStructure(tile.building);
		if (tile.building == Constant.BUILDING.WALL) {
			this.removeWall(this.walls.get(tile.getBuildingId())!);
		} else if (tile.building == Constant.BUILDING.TURRET) {
			this.removeTurret(this.turrets.get(tile.getBuildingId())!);
		}
	}

	removeWall(wall: Wall): void {
		this.collision.deleteCollider(wall, Constant.RADIUS.COLLISION.WALL);
		this.walls.delete(wall.id);
		wall.tile.removeBuilding();
	}

	removeTurret(turret: Turret): void {
		this.collision.deleteCollider(
			this.turrets.get(turret.id),
			Constant.RADIUS.COLLISION.TURRET
		);
		this.turrets.delete(turret.id);
		turret.tile.removeBuilding();
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
			this.hexTileMap.getHexRadiusPoints(tile, Constant.RADIUS.CAMP_HEXES)
		);

		this.campfires.add(campfire);

		const territory: Territory = new Territory(
			campfire.xPos.toString() + ', ' + campfire.yPos.toString(),
			campfire.xPos,
			campfire.yPos,
			Constant.TEAM.NONE
		);
		this.territories.add(territory);
		tile.building = Constant.BUILDING.CAMP;

		this.collision.insertCollider(campfire, Constant.RADIUS.COLLISION.WALL);
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
		if (!this.hexTileMap.checkIfValidHex(coord))
			throw new Error('Base is not on a valid hex.');

		const tile: Tile = this.hexTileMap.tileMap[coord.q][coord.r];
		tile.teamNumber = teamNum;

		const base: Base = new Base(this.idGenerator.newID(), tile);

		this.bases.add(base);
		this.collision.insertCollider(base, Constant.RADIUS.COLLISION.BASE);

		this.teams.getTeam(teamNum).respawnCoords =
			this.hexTileMap.getHexRingPoints(tile, 2);

		// make it so you cant build on and around the base
		for (let i = 0; i <= 2; i++) {
			this.hexTileMap.getHexRingPoints(tile, i).forEach((coord) => {
				this.hexTileMap.tileMap[coord.q][coord.r].setBuilding(
					base.getBuildingType(),
					base
				);
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
			tempTile.teamNumber = teamNumber;
			this.hexTileMap.tileMap[pt.q][pt.r] = tempTile;
		}
	}

	addBaseTerritories() {
		// Add permanent territory from bases
		for (let i = 0; i < Constant.TEAM_COUNT; i++) {
			const teamBaseCoord = this.teams.getTeamBaseCoord(i);
			const points = this.hexTileMap.getHexRadiusPoints(
				this.hexTileMap.tileMap[teamBaseCoord.q][teamBaseCoord.r],
				Constant.RADIUS.CAMP_HEXES
			);
			// Update the tileMap with territory tiles
			this.setBaseTerritory(i, points);
			// Add chunk center to terriitories list
			const xPosition =
				this.hexTileMap.tileMap[teamBaseCoord.q][teamBaseCoord.r]
					.cartesian_coord.xPos;
			const yPosition =
				this.hexTileMap.tileMap[teamBaseCoord.q][teamBaseCoord.r]
					.cartesian_coord.yPos;
			const tempTerritory = new Territory(
				xPosition.toString() + ', ' + yPosition.toString(),
				xPosition,
				yPosition,
				i
			);

			this.territories.add(tempTerritory);
		}
	}

	generateBoundaryColliders(): void {
		for (const boundaryHex of this.hexTileMap.boundaryCoords) {
			this.collision.insertCollider(
				this.hexTileMap.tileMap[boundaryHex.q][boundaryHex.r]
					.cartesian_coord,
				Constant.RADIUS.COLLISION.WALL
			);
		}
	}

	private getPlayer(socketID): Player {
		return this.players.get(socketID)!;
	}
}
