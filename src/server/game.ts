/* eslint-disable @typescript-eslint/no-non-null-assertion */

import Player from './objects/player';
import Teams from './teams';
import Bullet from './objects/bullet';
import Wall from './objects/wall';
import Turret from './objects/turret';
import Campfire from './objects/campfire';
import Base from './objects/base';
import CollisionDetection from './collision';
import { HexTiles, Tile } from './hexTiles';
import IDgenerator from './idGenerator';
import { Constant } from '../shared/constants';
import Territory from './objects/territory';
import { MapResources } from './mapResources';
import { PassiveIncome } from './passiveIncome';
import * as SocketIO from 'socket.io';
import { Resource } from './objects/resource';
import IndestructibleObj from './objects/indestructibleObj';

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

		this.collision = new CollisionDetection();

		this.teams = new Teams(Constant.TEAM_COUNT);
		this.hexTileMap = new HexTiles(this);
		this.hexTileMap.generateMap();

		this.mapResources = new MapResources(this);
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

	public update() {
		const [currentTimestamp, timePassed] = this.calculateTimePassed();
		this.gameTimeRemaining = this.endGameTimestamp - currentTimestamp;

		// Throw a warning if an update rate dips below 30fps
		if (timePassed > 34)
			console.warn('WARNING : Update took ', timePassed, 'ms');

		this.updateBullets(currentTimestamp, timePassed);

		this.updateWalls();

		this.updateTurrets(timePassed);

		this.updateBases();

		this.updatePlayers(currentTimestamp, timePassed);

		this.updateTerritories();

		this.mapResources.update(timePassed);

		if (this.isGameOver()) this.endGame();

		this.sendStateToPlayers();
	}

	private calculateTimePassed(): [number, number] {
		const currentTimestamp = Date.now();
		const timePassed = currentTimestamp - this.previousUpdateTimestamp;
		this.previousUpdateTimestamp = currentTimestamp;

		return [currentTimestamp, timePassed];
	}

	private updateBullets(currentTimestamp: number, timePassed: number) {
		for (const aBullet of this.bullets) {
			if (aBullet.isExpired(currentTimestamp)) {
				this.collision.deleteCollider(aBullet);
				this.bullets.delete(aBullet);
				continue;
			}

			aBullet.updatePosition(timePassed, this.collision);
			this.collision.bulletCollision(aBullet, this.bullets);
		}
	}

	private updateTerritories() {
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

	private updateWalls() {
		for (const aWall of this.walls.values()) {
			if (!aWall.isAlive()) {
				this.removeWall(aWall);
			}
		}
	}

	private updateTurrets(timePassed: number) {
		for (const aTurret of this.turrets.values()) {
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

	private updateBases() {
		for (const aBase of this.bases) {
			if (!aBase.isAlive()) {
				this.collision.deleteCollider(aBase);

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

	private updatePlayers(currentTimestamp: number, timePassed: number) {
		const givePassiveIncome: boolean =
			this.passiveIncome.givePassiveIncomeIfPossible(timePassed);
		for (const aPlayer of this.players.values()) {
			if (aPlayer.isAlive()) {
				aPlayer.reload(timePassed);
				aPlayer.updatePosition(
					currentTimestamp,
					this.collision,
					this.mapResources
				);
				if (givePassiveIncome) {
					this.passiveIncome.updatePlayerResources(aPlayer);
				}
			} else if (aPlayer.canRespawn(timePassed, this.collision)) {
				this.respawnPlayer(aPlayer);
			}
		}
	}

	private sendStateToPlayers() {
		// Send updates to player
		for (const aPlayer of this.players.values()) {
			aPlayer.socket.emit(
				Constant.MESSAGE.GAME_UPDATE,
				this.createUpdate(aPlayer)
			);
		}
	}

	private isGameOver(): boolean {
		if (this.bases.size == 1 || this.gameTimeRemaining <= 0) {
			return true;
		}
		return false;
	}

	private endGame(): void {
		const gameOverMessage = this.createGameEndRecap();
		for (const aPlayer of this.players.values()) {
			aPlayer.socket.emit(Constant.MESSAGE.GAME_END, gameOverMessage);
		}
		clearInterval(this.gameInterval);
		this.gameOverCallback();
	}

	private createGameEndRecap() {
		let redCamps = 0;
		let blueCamps = 0;
		let redHealth = -1;
		let blueHealth = -1;

		for (const camp of this.campfires) {
			if (camp.teamNumber == Constant.TEAM.RED) redCamps++;
			else if (camp.teamNumber == Constant.TEAM.RED) blueCamps++;
		}

		let winner = Constant.TEAM.NONE;
		let message = '';

		if (this.bases.size == 1) {
			for (const base of this.bases) {
				winner = base.teamNumber;
			}
			message = 'All other team bases eliminated!';
		} else {
			if (redCamps > blueCamps) {
				winner = Constant.TEAM.RED;
			} else if (redCamps < blueCamps) {
				winner = Constant.TEAM.BLUE;
			} else {
				// Both teams have the same number of camps
				// Check health
				for (const base of this.bases) {
					if (base.teamNumber == Constant.TEAM.RED)
						redHealth = base.hp;
					else if (base.teamNumber == Constant.TEAM.BLUE)
						blueHealth = base.hp;

					if (redHealth > blueHealth) {
						winner = Constant.TEAM.RED;
					} else if (redHealth < blueHealth) {
						winner = Constant.TEAM.BLUE;
					} else {
						// Draw
						winner = Constant.TEAM.NONE;
					}
				}
			}
			message = 'Time Up!';
		}

		return {
			winner: winner,
			message: message,
			campCount: {
				red: redCamps,
				blue: blueCamps,
			},
			teamHealth: {
				red: redHealth,
				blue: blueHealth,
			},
		};
	}

	private getNearbyObj<ObjType extends IndestructibleObj>(
		player: Player,
		set: IterableIterator<ObjType>,
		objRadius?: number
	): ObjType[] {
		const nearbyObj: ObjType[] = [];

		for (const obj of set) {
			if (
				this.collision.doCirclesCollide(
					obj,
					objRadius ?? obj.RADIUS,
					player,
					Constant.RADIUS.VIEW
				)
			)
				nearbyObj.push(obj);
		}

		return nearbyObj;
	}

	private getNearbyPlayers(player: Player) {
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

	private createUpdate(player: Player) {
		const nearbyPlayers: Player[] = this.getNearbyPlayers(player);
		const nearbyBullets: Bullet[] = this.getNearbyObj(
			player,
			this.bullets.values()
		);
		const nearbyWalls: Wall[] = this.getNearbyObj(
			player,
			this.walls.values()
		);
		const nearbyTurrets: Turret[] = this.getNearbyObj(
			player,
			this.turrets.values()
		);
		const nearbyResources: Resource[] = this.getNearbyObj(
			player,
			this.mapResources.resources.values()
		);

		const nearbyCampfires: Campfire[] = this.getNearbyObj(
			player,
			this.campfires.values(),
			Constant.RADIUS.TERRITORY // Need to use Territory width as the camp and territory are connected
		);
		const nearbyBases: Base[] = Array.from(this.bases);

		return {
			time: this.gameTimeRemaining,
			currentPlayer: player.serializeForUpdate(),
			otherPlayers: nearbyPlayers.map((p) => p.serializeForUpdate()),
			bullets: nearbyBullets.map((p) => p.serializeForUpdate()),
			walls: nearbyWalls.map((p) => p.serializeForUpdate()),
			turrets: nearbyTurrets.map((p) => p.serializeForUpdate()),
			campfires: nearbyCampfires.map((p) => p.serializeForUpdate()),
			bases: nearbyBases.map((p) => p.serializeForUpdate()),
			resources: nearbyResources.map((p) => p.serializeForUpdate()),
		};
	}

	private sendInitialState(newPlayer: Player, socket: SocketIO.Socket) {
		socket.emit(Constant.MESSAGE.INITIALIZE, {
			player: newPlayer.serializeForUpdate(),
		});
	}

	private generateNewPlayer(socket: SocketIO.Socket, name: string) {
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

	public addPlayer(socket: SocketIO.Socket, name = '') {
		if (this.players.has(socket.id)) return;

		const newPlayer = this.generateNewPlayer(socket, name);

		this.respawnPlayer(newPlayer);

		this.sendInitialState(newPlayer, socket);
	}

	public removePlayer(socket: SocketIO.Socket) {
		if (!this.players.has(socket.id)) return;

		const player: Player = this.getPlayer(socket.id);

		this.collision.deleteCollider(player);

		this.teams.removePlayer(socket.id, player.teamNumber);

		this.players.delete(socket.id);
	}

	private respawnPlayer(player: Player) {
		const respawnPoint = this.teams.getRandomRespawnPoint(
			player.teamNumber
		);
		player.respawn(this.hexTileMap.offsetToCartesian(respawnPoint));
		this.collision.insertCollider(player);
	}

	public changeMovementDirection(socket: SocketIO.Socket, direction: number) {
		if (!this.players.has(socket.id)) return;
		const player: Player = this.getPlayer(socket.id)!;

		player.updateVelocity(direction);
	}

	public rotatePlayer(socket: SocketIO.Socket, direction: number): void {
		if (!this.players.has(socket.id)) return;
		const player = this.getPlayer(socket.id);

		player?.updateDirection(direction);
	}

	private shootBullet(object: any, direction: number): void {
		const bullet: Bullet = new Bullet(
			this.idGenerator.newID(),
			object.xPos,
			object.yPos,
			direction,
			object.teamNumber
		);
		this.bullets.add(bullet);
		this.collision.insertCollider(bullet);
	}

	public playerShootBullet(socket: SocketIO.Socket, direction: number) {
		if (!this.players.has(socket.id)) return;
		const player: Player = this.getPlayer(socket.id)!;
		player.shootBullet(direction);
	}

	private canBuildStructure(
		player: Player,
		tile: Tile,
		building: string
	): boolean {
		const collisionRadius = Constant.RADIUS[building];
		if (
			!tile.hasNoBuilding() ||
			tile.teamNumber != player.teamNumber ||
			this.collision.doesObjCollideWithPlayers(
				tile.cartesian_coord.xPos,
				tile.cartesian_coord.yPos,
				collisionRadius
			) ||
			!player.isAlive() ||
			!player.canAffordStructure(building)
		) {
			return false;
		}

		return true;
	}

	public buildStructure(
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

	private addWall(tile: Tile): void {
		const wall: Wall = new Wall(this.idGenerator.newID(), tile);
		this.walls.set(wall.id, wall);
		this.collision.insertCollider(wall);
	}

	private addTurret(tile: Tile): void {
		const turret: Turret = new Turret(
			this.idGenerator.newID(),
			tile,
			this.shootBullet.bind(this)
		);
		this.turrets.set(turret.id, turret);
		this.collision.insertCollider(turret);
	}

	private canDemolishStructure(player: Player, tile: Tile): boolean {
		if (
			tile.hasNoBuilding() ||
			(tile.building != Constant.BUILDING.WALL &&
				tile.building != Constant.BUILDING.TURRET) ||
			tile.teamNumber != player.teamNumber
		)
			return false;

		return true;
	}

	public demolishStructure(
		socket: SocketIO.Socket,
		x: number,
		y: number
	): void {
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

	private removeWall(wall: Wall): void {
		this.collision.deleteCollider(wall);
		this.walls.delete(wall.id);
		wall.tile.removeBuilding();
	}

	private removeTurret(turret: Turret): void {
		this.collision.deleteCollider(turret);
		this.turrets.delete(turret.id);
		turret.tile.removeBuilding();
	}

	private getPlayer(socketID: string): Player {
		return this.players.get(socketID)!;
	}
}
