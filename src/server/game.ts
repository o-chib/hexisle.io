import Player from './../shared/player';
import Bullet from './../shared/bullet';
import Collision from './collision';
const Constant = require('../shared/constants');
import { HexTiles, Tile, OffsetPoint, Point } from './../shared/hexTiles';
import CollisionDetection from './collision';

export default class Game {
    teams: Map<number, number>;
	players: Map<string, Player>;
	bullets: Set<Bullet>;
	previousUpdateTimestamp: any;
	bulletCount: number;
	hexTileMap: HexTiles;
	changedTiles: Tile[];
	collisionDetection: CollisionDetection;

	constructor() {
		this.players = new Map();
        this.initTeams(2);
		this.bullets = new Set();
		setInterval(this.update.bind(this), 1000 / 60); //TODO lean what bind is, and make it 1000 / 60
		this.hexTileMap = new HexTiles();
		this.hexTileMap.generateMap();
		this.changedTiles = [];
		this.collisionDetection = new CollisionDetection();
		this.previousUpdateTimestamp = Date.now();
		this.bulletCount = 0;
	}

	addPlayer(socket: SocketIOClient.Socket, ) {
		console.log('Hello: ' + socket.id);

		//calc xPos yPos
		const xPos = Math.floor(Math.random() * 600);
		const yPos = Math.floor(Math.random() * 600);

        // find team number, chooses smallest team
        let team: number = this.getTeamNumber();
        console.log('Assigning to team '  + team);

		const newPlayer = new Player(
			socket,
			xPos,
			yPos,
			team
		);
		
		this.players.set(socket.id, newPlayer);

		this.collisionDetection.insertCollider(newPlayer);
		console.log("inserted", newPlayer.id);

		let initObject = {
							player: newPlayer.serializeForUpdate(),
							tileMap: this.hexTileMap.tileMap
						};

		socket.emit(Constant.MESSAGE.INITIALIZE, initObject);
	}




	removePlayer(socket: SocketIOClient.Socket) {
		console.log('Goodbye: ' + socket.id);

        let player: Player = this.players.get(socket.id)!;

		this.collisionDetection.deleteCollider(player);

		this.players.delete(socket.id);
	}

	respawnPlayer(player: Player) {
		console.log('Respawning: ' + player.socket.id);
		
		const xPos = Math.floor(Math.random() * 1000);
		const yPos = Math.floor(Math.random() * 1000);
		
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
		
		for (const aPlayer of this.players.values()) {
			aPlayer.updatePosition(currentTimestamp);
		}

		for (const aPlayer of this.players.values()) {

			this.collisionDetection.playerCollision(aPlayer, this.bullets);

			// TODO: check if player's dead

			if(aPlayer.health <= 0) {
				this.respawnPlayer(aPlayer);
			}
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
		this.collisionDetection.updateCollider(player);
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

        let bullet: Bullet = new Bullet(
                                        this.bulletCount.toString(),
                                        player.xPos,
                                        player.yPos,
                                        direction,
                                        player.teamNumber)

		this.bullets.add(bullet);
		this.bulletCount += 1;
		this.collisionDetection.insertCollider(bullet);
	}

    initTeams(teamCount: number): void {
        this.teams = new Map();
        for (let x: number = 0; x < teamCount; x++) {
            this.teams.set(x, 0);
        }
    }

    getTeamNumber(): number {
        let smallestTeam: number = -1;
        let smallestPlayerCount: number = 999;
        for (let [team, playerCount] of this.teams) {
            if (playerCount < smallestPlayerCount) {
                smallestTeam = team;
                smallestPlayerCount = playerCount;
            }
        }
        this.teams.set(smallestTeam, smallestPlayerCount + 1);
        return smallestTeam;
    }
}
