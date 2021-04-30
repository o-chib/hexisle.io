import path from 'path';
import express from 'express';
import http from 'http';
import * as SocketIO from 'socket.io';
import { GameCollection } from './gameCollection';

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
	playerSocketsToNames.delete(socket);
};

// Start the game
const allGames = new GameCollection(restartGame, removePlayer);
allGames.newGame();

// Store all the socket connections to this server so we can
// add people back to a restarted game
const playerSocketsToNames: Map<SocketIO.Socket, string> = new Map();

// Start Socket.io connection
const websocket = new SocketIO.Server(server);
websocket.on('connection', function (socket: SocketIO.Socket) {
	playerSocketsToNames.set(socket, '');
});
