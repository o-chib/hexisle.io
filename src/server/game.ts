import Player from './../shared/player';

export default class Game {
	sockets: Map<string, SocketIOClient.Socket>;
	players: Map<string, Player>; 

	constructor() {
		this.sockets = new Map();
		this.players = new Map();
	}

	addPlayer(socket: SocketIOClient.Socket) {
		this.sockets.set(socket.id, socket);
		//calc xPos yPos
		//let xPos = DEFAULT_WIDTH/2;
		//let yPos = DEFAULT_HEIGHT/2;
		let xPos = 20;
		let yPos = 20;
		this.players.set(socket.id, new Player(socket.id, xPos, yPos));
	}

	removePlayer(socket: SocketIOClient.Socket) {
		console.log("Goodbye: " + socket.id);
		this.sockets.delete(socket.id); //TODO dont actually delete, reuse the memory
		this.players.delete(socket.id);
	}

	
}