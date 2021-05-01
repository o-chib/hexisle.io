import GameWrapper from './gameWrapper';
import IDgenerator from './idGenerator';
import * as SocketIO from 'socket.io';

export class GameCollection {
	private allGames: Map<string, GameWrapper>;
	private gameOverCallback: () => any;
	private playerDisconnectCallback: (socket: SocketIO.Socket) => any;
	private idGenerator: IDgenerator;

	constructor(
		gameOverCallback: () => any,
		playerDisconnectCallback: (socket: SocketIO.Socket) => any
	) {
		this.allGames = new Map<string, GameWrapper>();
		this.gameOverCallback = gameOverCallback;
		this.playerDisconnectCallback = playerDisconnectCallback;
		this.idGenerator = new IDgenerator();
	}

	public newGame() {
		const newGameID = this.idGenerator.newID();
		this.allGames.set(
			newGameID,
			new GameWrapper(
				newGameID,
				this.gameOverCallback,
				this.playerDisconnectCallback
			)
		);
	}

	public addPlayerToGame(
		socket: SocketIO.Socket,
		name: string,
		gameID?: string
	) {
		if (gameID) {
			this.allGames.get(gameID)?.addPlayer(socket, name);
			return;
		}

		for (const game of this.allGames.values()) {
			game.addPlayer(socket, name);
			return;
			//TODO pick a game somehow
		}
	}
}
