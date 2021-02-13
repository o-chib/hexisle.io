import Player from './../shared/player';
const Constant = require('../shared/constants');

export default class Game {
	players: Map<string, Player>;
	previousUpdateTimestamp: any;

	constructor() {
		this.players = new Map();
		setInterval(this.update.bind(this), 1000 / 60); //TODO lean what bind is, and make it 1000 / 60
		this.previousUpdateTimestamp = Date.now();
	}

	addPlayer(socket: SocketIOClient.Socket) {
		console.log("Hello: " + socket.id);
		//calc xPos yPos
		let xPos = Math.floor(Math.random() * 600);
		let yPos = Math.floor(Math.random() * 600);
		this.players.set(socket.id, new Player(socket, xPos, yPos));
	}

	removePlayer(socket: SocketIOClient.Socket) {
		console.log("Goodbye: " + socket.id);
		this.players.delete(socket.id);
	}

	update() {
		let currentTimestamp = Date.now();
		let timePassed = currentTimestamp - this.previousUpdateTimestamp;

		for (const aPlayer of this.players.values()) {
			aPlayer.socket.emit(Constant.MESSAGE.GAME_UPDATE, this.createUpdate(aPlayer));
		}

		this.previousUpdateTimestamp = currentTimestamp
	}

	createUpdate(player: Player) {
		let nearbyPlayers: Player[] = [];
		for (const aPlayer of this.players.values()) {
			if (aPlayer === player) continue;
			nearbyPlayers.push(aPlayer);
		}
	
		return {
			time: Date.now(),
			currentPlayer: player.serializeForUpdate(),
			otherPlayers: nearbyPlayers.map(p => p.serializeForUpdate())
		};
	}

	movePlayer(socket: SocketIOClient.Socket, direction: number) {
		if (!this.players.has(socket.id)) return;
		const player : Player = this.players.get(socket.id)!;

		player.xPos = player.xPos + 10*Math.cos(direction);
		player.yPos = player.yPos - 10*Math.sin(direction);
	}
}