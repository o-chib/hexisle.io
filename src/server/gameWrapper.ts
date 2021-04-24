import { Constant } from '../shared/constants';
import Game from './game';
import * as SocketIO from 'socket.io';
import { OffsetPoint } from '../shared/hexTiles';

export default class GameWrapper {
	private game: Game;
	public playerCount: number;

	constructor(gameOverCallback: () => any) {
		this.game = new Game(gameOverCallback);
	}

	public addPlayer(socket: SocketIO.Socket, name = '') {
		this.updateSocket(socket);
	}

	private updateSocket(socket: SocketIO.Socket) {
		socket.on(Constant.MESSAGE.JOIN, () => {
			this.game.addPlayer(socket);
		});

		socket.on(Constant.MESSAGE.MOVEMENT, (direction: number) => {
			this.game.movePlayer(socket, direction);
		});

		socket.on(Constant.MESSAGE.SHOOT, (direction: number) => {
			this.game.shootBullet(socket, direction);
		});

		socket.on(Constant.MESSAGE.ROTATE, (direction: number) => {
			this.game.rotatePlayer(socket, direction);
		});

		socket.on(Constant.MESSAGE.BUILD_WALL, (coord: OffsetPoint) => {
			this.game.buildWall(socket, coord);
		});

		socket.on(Constant.MESSAGE.DEMOLISH_WALL, (coord: OffsetPoint) => {
			this.game.demolishWall(socket, coord);
		});

		socket.on('disconnect', () => {
			this.game.removePlayer(socket);
			//playerSocketsToNames.delete(socket);
		});
	}
}
