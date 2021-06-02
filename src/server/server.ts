/* eslint-disable @typescript-eslint/no-non-null-assertion */
import path from 'path';
import express from 'express';
import http from 'http';
import * as SocketIO from 'socket.io';
import { GameCollection } from './gameCollection';
import { Constant } from '../shared/constants';
import Filter from 'bad-words';

// Serve up the static files from public
const app = express();
app.use(express.static('public'));
app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Start listening for people to connect
const ip = process.env.IP || 'localhost';
const port = process.env.PORT || 80;
const server = http.createServer(app).listen(port, () => {
	console.log('Server started:  http://' + ip + ':' + port);
});

const restartGame = () => {
	allGames.newGame();
};

// Start the game
const filter = new Filter();
const allGames = new GameCollection(restartGame);
allGames.newGame();

// Start Socket.io connection
const websocket = new SocketIO.Server(server);
websocket.on('connection', function (socket: SocketIO.Socket) {
	socket.on(Constant.MESSAGE.JOIN_GAME, (name?: string, gameID?: string) => {
		if (!name) name = '';

		if (filter.isProfane(name)) {
			socket.emit(
				Constant.MESSAGE.JOIN_GAME_FAIL,
				'Please use a different name'
			);
			return;
		} else if (name.length > Constant.MAX_NAME_LENGTH) {
			socket.emit(
				Constant.MESSAGE.JOIN_GAME_FAIL,
				'Maximum length ' + Constant.MAX_NAME_LENGTH + ' characters'
			);
			return;
		}

		if (allGames.addPlayerToGame(socket, name, gameID))
			socket.emit(Constant.MESSAGE.JOIN_GAME_SUCCESS);
		else
			socket.emit(
				Constant.MESSAGE.JOIN_GAME_FAIL,
				'Failed to join game.'
			);
	});

	socket.on(Constant.MESSAGE.ASK_GAME_LIST, () => {
		socket.emit(Constant.MESSAGE.GIVE_GAME_LIST, allGames.getGameList());
	});
});
