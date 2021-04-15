import path from 'path';
import express from 'express';
import http from 'http';
import Game from './game';
import { OffsetPoint } from '../shared/hexTiles';
import * as SocketIO from 'socket.io';
import { Constant } from '../shared/constants';

// Serve up the static files from public
const app = express();
app.use(express.static('public'));
app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Start listening for people to connect
const ip = process.env.IP || 'localhost';
const port = process.env.PORT || 3000;
const server = http.createServer(app).listen(port, () => {
	console.log('Server started:  http://' + ip + ':' + port);
});

// Start the game
let game = new Game();

// Store all the socket connections to this server so we can
// add people back to a restarted game
const socketsConnected: Set<SocketIOClient.Socket> = new Set();

// Set up an interval to check when the game ends
const gameInterval = setInterval(checkGameEnd, 1000 / 60);

// Start Socket.io connection
const websocket = new SocketIO.Server(server);
websocket.on('connection', function (socket: SocketIO.Socket) {
	updateSocket(socket);
});

function updateSocket(socket: any) {
	socket.on(Constant.MESSAGE.JOIN, () => {
		game.addPlayer(socket);
		socketsConnected.add(socket);
	});

	socket.on(Constant.MESSAGE.MOVEMENT, (direction: number) => {
		game.movePlayer(socket, direction);
	});

	socket.on(Constant.MESSAGE.TILE_CHANGE, (coord: OffsetPoint) => {
		game.buildWall(socket, coord);
	});

	socket.on(Constant.MESSAGE.SHOOT, (direction: number) => {
		game.shootBullet(socket, direction);
	});

	socket.on(Constant.MESSAGE.ROTATE, (direction: number) => {
		game.rotatePlayer(socket, direction);
	});

	socket.on('disconnect', () => {
		game.removePlayer(socket);
		socketsConnected.delete(socket);
	});
}

function checkGameEnd(): void {
	if (game.isGameOver == true) {
		console.log("ending game");
		setTimeout(restartGame, 5 * 1000);
	}
}

function restartGame(): void {
	console.log("restarting game");
	game = new Game();
	for (const aSocket of socketsConnected) {
		game.addPlayer(aSocket);
	}
}
