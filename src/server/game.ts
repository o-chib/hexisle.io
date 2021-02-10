import Player from './../shared/player';
const Constant = require('../shared/constants');

export default class Game {
	sockets: Map<string, SocketIOClient.Socket>;
	players: Map<string, Player>; 

	constructor() {
		this.sockets = new Map();
		this.players = new Map();
		setInterval(this.update.bind(this), 1000 / 60); //TODO lean what bind is
	}

	addPlayer(socket: SocketIOClient.Socket) {
		console.log("Hello: " + socket.id);
		this.sockets.set(socket.id, socket);
		//calc xPos yPos
		let xPos = Math.floor(Math.random() * 1000);
		let yPos = Math.floor(Math.random() * 1000);
		this.players.set(socket.id, new Player(socket.id, xPos, yPos));
	}

	removePlayer(socket: SocketIOClient.Socket) {
		console.log("Goodbye: " + socket.id);
		this.sockets.delete(socket.id); //TODO dont actually delete, reuse the memory
		this.players.delete(socket.id);
	}

	update() {
		console.log("sending " + this.players.size);
		this.sockets.forEach(socket => {
			const player = this.players[socket.id];
			console.log("sending " + socket.id);
			socket.emit(Constant.MESSAGE.GAME_UPDATE, this.createUpdate(player));
		});
	}

	createUpdate(player: Player) {
		const nearbyPlayers = Object.values(this.players).filter(
			p => p !== player,
		);
	
		return {
			time: Date.now(),
			currentPlayer: player.serializeForUpdate(),
			otherPlayers: nearbyPlayers.map(p => p.serializeForUpdate())
		};
	}
	
}