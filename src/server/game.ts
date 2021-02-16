import Player from './../shared/player';
import Bullet from './../shared/bullet';
const Constant = require('../shared/constants');

export default class Game {
	players: Map<string, Player>;
	bullets: Set<Bullet>;
	previousUpdateTimestamp: any;
	bulletCount: number;

	constructor() {
		this.players = new Map();
		this.bullets = new Set();
		setInterval(this.update.bind(this), 1000 / 60); //TODO lean what bind is, and make it 1000 / 60
		this.previousUpdateTimestamp = Date.now();
		this.bulletCount = 0;
	}

	addPlayer(socket: SocketIOClient.Socket) {
		console.log("Hello: " + socket.id);
		//calc xPos yPos
		let xPos = Math.floor(Math.random() * 600);
		let yPos = Math.floor(Math.random() * 600);
		let newPlayer = new Player(socket, xPos, yPos, Math.floor(Math.random() * 10000) + 1);
		this.players.set(socket.id, newPlayer); //TODO rn it has a random team
	}

	removePlayer(socket: SocketIOClient.Socket) {
		console.log("Goodbye: " + socket.id);
		this.players.delete(socket.id);
	}

	update() {
		let currentTimestamp = Date.now();
		let timePassed = (currentTimestamp - this.previousUpdateTimestamp) / 1000;

		for (const aBullet of this.bullets) {
			aBullet.updatePosition(timePassed);
			if (aBullet.isExpired(currentTimestamp)) {
				this.bullets.delete(aBullet);
			}
		}

		for (const aPlayer of this.players.values()) {
			aPlayer.socket.emit(Constant.MESSAGE.GAME_UPDATE, this.createUpdate(aPlayer));
		}

		this.previousUpdateTimestamp = currentTimestamp;
	}

	createUpdate(player: Player) {
		let nearbyPlayers: Player[] = [];
		let nearbyBullets: Bullet[] = [];

		for (const aPlayer of this.players.values()) {
			if (aPlayer === player) continue;
			nearbyPlayers.push(aPlayer);
		}
	
		for (const aBullet of this.bullets) {
			nearbyBullets.push(aBullet);
		}

		return {
			time: Date.now(),
			currentPlayer: player.serializeForUpdate(),
			otherPlayers: nearbyPlayers.map(p => p.serializeForUpdate()),
			bullets: nearbyBullets.map(p => p.serializeForUpdate())
		};
	}

	movePlayer(socket: SocketIOClient.Socket, direction: number) {
		if (!this.players.has(socket.id)) return;
		const player : Player = this.players.get(socket.id)!;

		player.xPos = player.xPos + 10*Math.cos(direction);
		player.yPos = player.yPos - 10*Math.sin(direction);
	}
	
	shootBullet(socket: SocketIOClient.Socket, direction: number) {
		if (!this.players.has(socket.id)) return;
		const player : Player = this.players.get(socket.id)!;
		this.bullets.add(new Bullet(this.bulletCount.toString(), player.xPos, player.yPos, direction));
		this.bulletCount += 1;
	}
}