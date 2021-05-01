/* eslint-disable @typescript-eslint/no-non-null-assertion */
import path from 'path';
import express from 'express';
import http from 'http';
import * as SocketIO from 'socket.io';
import { GameCollection } from './gameCollection';
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

const restartGame = () => {
	allGames.newGame();
};

const removePlayer = (socket: SocketIO.Socket) => {
	playerSockets.delete(socket);
};

// Start the game
const allGames = new GameCollection(restartGame, removePlayer);
allGames.newGame();

// Store all the socket connections to this server so we can
// add people back to a restarted game
const playerSockets: Set<SocketIO.Socket> = new Set();
const playerSocketsToGameIDs: Map<SocketIO.Socket, string | null> = new Map();

// Start Socket.io connection
const websocket = new SocketIO.Server(server);
websocket.on('connection', function (socket: SocketIO.Socket) {
	playerSockets.add(socket);
	playerSocketsToGameIDs.set(socket, null);

	socket.on(Constant.MESSAGE.JOIN_GAME, (gameID?: string, name = 'Aliem') => {
		if (gameID) allGames.addPlayerToGame(socket, name, gameID);
		else allGames.addPlayerToGame(socket, name);
	});
});
