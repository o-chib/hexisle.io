import { Constant } from '../shared/constants';
import Game from './game';
import * as SocketIO from 'socket.io';

export default class GameWrapper {
	private readonly MAX_PLAYERS = Constant.MAX_PLAYERS;

	private game: Game;
	private collectionGameOverCallback: (id: string) => void;
	public id: string;
	public playerCount: number;

	constructor(id: string, collectionGameOverCallback: (id: string) => any) {
		this.id = id;
		this.playerCount = 0;
		this.collectionGameOverCallback = collectionGameOverCallback;
		this.game = new Game(this.gameOverCallback.bind(this));
	}

	private gameOverCallback() {
		this.collectionGameOverCallback(this.id);
	}

	// Returns true if successfully added player
	public addPlayer(socket: SocketIO.Socket, name = ''): boolean {
		// If you wish to re-enable game size limits uncomment next line
		// if (this.isFull()) return false;

		this.updateSocket(socket, name);
		this.playerCount++;

		return true;
	}

	public isFull(): boolean {
		return this.playerCount >= this.MAX_PLAYERS;
	}

	private updateSocket(socket: SocketIO.Socket, name: string) {
		socket.once(Constant.MESSAGE.START_GAME, () => {
			this.game.addPlayer(socket, name);
		});

		socket.once(Constant.MESSAGE.LEAVE_GAME, () => {
			this.leaveGame(socket);
		});

		socket.once('disconnect', () => {
			this.leaveGame(socket);
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

		socket.on(
			Constant.MESSAGE.BUILD_STRUCTURE,
			(x: number, y: number, building: string) => {
				this.game.buildStructure(socket, x, y, building);
			}
		);

		socket.on(
			Constant.MESSAGE.DEMOLISH_STRUCTURE,
			(x: number, y: number) => {
				this.game.demolishStructure(socket, x, y);
			}
		);
	}

	private leaveGame(socket: SocketIO.Socket) {
		socket.removeAllListeners(Constant.MESSAGE.MOVEMENT);
		socket.removeAllListeners(Constant.MESSAGE.SHOOT);
		socket.removeAllListeners(Constant.MESSAGE.ROTATE);
		socket.removeAllListeners(Constant.MESSAGE.DEMOLISH_STRUCTURE);
		socket.removeAllListeners(Constant.MESSAGE.BUILD_STRUCTURE);
		socket.removeAllListeners(Constant.MESSAGE.LEAVE_GAME);
		socket.removeAllListeners('disconnect');
		this.game.removePlayer(socket);
		this.playerCount--;
	}

	public getInfo() {
		return {
			playerCount: this.playerCount,
		};
	}
}
