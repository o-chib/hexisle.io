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
const port = process.env.PORT || 80;
const server = http.createServer(app).listen(port, () => {
	console.log('Server started:  http://' + ip + ':' + port);
});

const restartGame = () => {
	allGames.newGame();
};

// Start the game
const allGames = new GameCollection(restartGame);
allGames.newGame();
allGames.newGame();

// Start Socket.io connection
const websocket = new SocketIO.Server(server);
websocket.on('connection', function (socket: SocketIO.Socket) {
	socket.on(Constant.MESSAGE.JOIN_GAME, (name = 'Aliem', gameID?: string) => {
		if (allGames.addPlayerToGame(socket, name, gameID))
			socket.emit(Constant.MESSAGE.JOIN_GAME_SUCCESS);
		else
			socket.emit(
				Constant.MESSAGE.JOIN_GAME_FAIL,
				'Failed to join game.'
			);
		//TODO improve error message
	});

	socket.on(Constant.MESSAGE.ASK_GAME_LIST, () => {
		socket.emit(Constant.MESSAGE.GIVE_GAME_LIST, allGames.getGameList());
	});

	socket.on(Constant.SERVER.GIVE_STATUS, () => {
		if(allGames.getGameCount() > 0) {
			socket.emit(Constant.SERVER.RETURN_STATUS, Constant.SERVER.OK);
		} else {
			socket.emit(Constant.SERVER.RETURN_STATUS, Constant.SERVER.ERROR);
		}
		
	});
});
