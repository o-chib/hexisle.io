import Player from './../shared/player';
import Bullet from './../shared/bullet';
const Constant = require('../shared/constants');
import { HexTiles, Tile, OffsetPoint, Point } from './../shared/hexTiles';
import { Quadtree, Rect, CollisionObject } from './quadtree';

export default class Game {
    teams: Map<number, number>;
	players: Map<string, Player>;
	bullets: Set<Bullet>;
	previousUpdateTimestamp: any;
	bulletCount: number;
	hexTileMap: HexTiles;
	changedTiles: Tile[];
    quadtree: Quadtree;

	constructor() {
		this.players = new Map();
        this.initTeams(2);
		this.bullets = new Set();
		setInterval(this.update.bind(this), 1000 / 60); //TODO lean what bind is, and make it 1000 / 60
		this.hexTileMap = new HexTiles();
		this.hexTileMap.generateMap();
		this.changedTiles = [];
        this.quadtree = new Quadtree();
		this.previousUpdateTimestamp = Date.now();
		this.bulletCount = 0;
	}

	addPlayer(socket: SocketIOClient.Socket) {
		console.log('Hello: ' + socket.id);
		//calc xPos yPos
		const xPos = Math.floor(Math.random() * 600);
		const yPos = Math.floor(Math.random() * 600);

        // find team number, chooses smallest team
        let team: number = this.getTeam();
        console.log('Assigning to team '  + team);

		const newPlayer = new Player(
			socket,
			xPos,
			yPos,
			team
		);
		this.players.set(socket.id, newPlayer);

        this.quadtree.insertIntoQuadtree(new CollisionObject(xPos - Constant.PLAYER_RADIUS, xPos + Constant.PLAYER_RADIUS,
                                            yPos + Constant.PLAYER_RADIUS, yPos - Constant.PLAYER_RADIUS, newPlayer));
        console.log("inserted", newPlayer.id);
	}

	removePlayer(socket: SocketIOClient.Socket) {
		console.log('Goodbye: ' + socket.id);

        let player: Player = this.players.get(socket.id)!;

        this.quadtree.deleteFromQuadtree(new CollisionObject(player.xPos - Constant.PLAYER_RADIUS, player.xPos + Constant.PLAYER_RADIUS,
                                            player.yPos + Constant.PLAYER_RADIUS, player.yPos - Constant.PLAYER_RADIUS, player));

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
                continue;
			}

            this.quadtree.updateInQuadtree(new CollisionObject(aBullet.xPos - Constant.BULLET_RADIUS, aBullet.xPos + Constant.BULLET_RADIUS,
                                            aBullet.yPos + Constant.BULLET_RADIUS, aBullet.yPos - Constant.BULLET_RADIUS, aBullet));
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

        let results: CollisionObject[] = [];
        this.quadtree.searchQuadtree(new Rect(player.xPos - Constant.PLAYER_RADIUS, player.xPos + Constant.PLAYER_RADIUS,
                                        player.yPos + Constant.PLAYER_RADIUS, player.yPos - Constant.PLAYER_RADIUS),
                                        results);

        results.forEach((result) => {
            if (result.payload instanceof Player && 
                result.payload.id != player.id) {
                
                console.log("player at", player.xPos, player.yPos,
                            "is colliding with player at",
                            result.payload.xPos, result.payload.yPos);

            } else if (result.payload instanceof Bullet &&
                        result.payload.id == result.payload.id &&
                        result.payload.teamNumber != player.teamNumber) {
                    
                console.log("player at", player.xPos, player.yPos,
                                "is colliding with bullet at",
                                result.payload.xPos, result.payload.yPos);

                this.bullets.delete(result.payload);
                this.quadtree.deleteFromQuadtree(new CollisionObject(result.payload.xPos - Constant.BULLET_RADIUS, result.payload.xPos + Constant.BULLET_RADIUS,
                                                    result.payload.yPos + Constant.BULLET_RADIUS, result.payload.yPos - Constant.BULLET_RADIUS,
                                                    result.payload));
            }
        });

		return {
			time: Date.now(),
			currentPlayer: player.serializeForUpdate(),
			otherPlayers: nearbyPlayers.map((p) => p.serializeForUpdate()),
			tileMap: this.hexTileMap.tileMap, // TODO, look into why we need this
			changedTiles: changedTiles,
			bullets: nearbyBullets.map((p) => p.serializeForUpdate()),
		};
	}

	movePlayer(socket: SocketIOClient.Socket, direction: number) {
		if (!this.players.has(socket.id)) return;
		const player: Player = this.players.get(socket.id)!;

		player.xPos = player.xPos + 10 * Math.cos(direction);
		player.yPos = player.yPos - 10 * Math.sin(direction);

        this.quadtree.updateInQuadtree(new CollisionObject(player.xPos - Constant.PLAYER_RADIUS, player.xPos + Constant.PLAYER_RADIUS,
                                        player.yPos + Constant.PLAYER_RADIUS, player.yPos - Constant.PLAYER_RADIUS, player));
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

        this.quadtree.insertIntoQuadtree(new CollisionObject(bullet.xPos - Constant.BULLET_RADIUS, bullet.xPos + Constant.BULLET_RADIUS,
                                        bullet.yPos + Constant.BULLET_RADIUS, bullet.yPos - Constant.BULLET_RADIUS, bullet));
	}

    initTeams(teamCount: number): void {
        this.teams = new Map();
        for (let x: number = 0; x < teamCount; x++) {
            this.teams.set(x, 0);
        }
    }

    getTeam(): number {
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
