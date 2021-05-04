import { Constant } from '../shared/constants';
import Game from './game';
import * as SocketIO from 'socket.io';
import { OffsetPoint } from '../shared/hexTiles';

export default class GameWrapper {
	private game: Game;
	private playerDisconnectCallback: (socket: SocketIO.Socket) => void;
	private collectionGameOverCallback: (id: string) => void;
	public id: string;
	public playerCount: number;

	constructor(
		id: string,
		collectionGameOverCallback: (id: string) => any,
		playerDisconnectCallback: (socket: SocketIO.Socket) => void
	) {
		this.id = id;
		this.playerCount = 0;
		this.collectionGameOverCallback = collectionGameOverCallback;
		this.playerDisconnectCallback = playerDisconnectCallback;
		this.game = new Game(this.gameOverCallback.bind(this));
	}

	private gameOverCallback() {
		this.collectionGameOverCallback(this.id);
	}

	// Returns true if successfully added player
	public addPlayer(socket: SocketIO.Socket, name = ''): boolean {
		//TODO check max player count
		this.updateSocket(socket, name);
		this.playerCount++;

		return true;
	}

	private updateSocket(socket: SocketIO.Socket, name: string) {
		socket.on(Constant.MESSAGE.START_GAME, () => {
			this.game.addPlayer(socket, name);
		});

		socket.on(Constant.MESSAGE.MOVEMENT, (direction: number) => {
			this.game.movePlayer(socket, direction);
		});

		socket.on(Constant.MESSAGE.SHOOT, (direction: number) => {
			this.game.playerShootBullet(socket, direction);
		});

		socket.on(Constant.MESSAGE.ROTATE, (direction: number) => {
			this.game.rotatePlayer(socket, direction);
		});

		socket.on(Constant.MESSAGE.BUILD_WALL, (coord: OffsetPoint) => {
			this.game.buildStructure(socket, coord, Constant.BUILDING.WALL);
		});

		socket.on(Constant.MESSAGE.BUILD_TURRET, (coord: OffsetPoint) => {
			this.game.buildStructure(socket, coord, Constant.BUILDING.TURRET);
		});

		socket.on(Constant.MESSAGE.DEMOLISH_STRUCTURE, (coord: OffsetPoint) => {
			this.game.demolishStructure(socket, coord);
		});

		socket.on(Constant.MESSAGE.LEAVE_GAME, () => {
			this.leaveGame(socket);
		});

		socket.on('disconnect', () => {
			this.leaveGame(socket);
			this.playerDisconnectCallback(socket);
		});
	}

	private leaveGame(socket: SocketIO.Socket) {
		this.game.removePlayer(socket);
		this.playerCount--;
	}

	public getInfo() {
		return {
			playerCount: this.playerCount,
		};
	}
}
