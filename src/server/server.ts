import path from 'path';
import express from 'express';
import http from 'http';
import { Socket } from 'socket.io-client';
import Game from './game';
const Socketio = require('socket.io');
const Constsants = require('../shared/constants');


// Serve up the static files from public
const app = express();
app.use(express.static('public')); 
app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "public/index.html"));
});

// Start listening for people to connect
const ip = process.env.IP || "localhost";
const port = process.env.PORT || 3000;
const server = http.createServer(app).listen(port, () => {
	console.log("Server started:  http://" + ip + ":" + port);
});

// Start the game
const game = new Game();

// Start Socket.io connection
const websocket = Socketio(server);
websocket.on('connection', function (socket: any) {
	console.log('Player connected!', socket.id);
	updateSocket(socket);
});

function updateSocket(socket: any) {
	socket.on('ready', game.addPlayer);
	socket.on('disconnect', onDisconnect);
}
function onDisconnect() {
	game.removePlayer(this);
}