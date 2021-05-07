import GameWrapper from './gameWrapper';
import IDgenerator from './idGenerator';
import * as SocketIO from 'socket.io';

export class GameCollection {
	private allGames: Map<string, GameWrapper>;
	private serverGameOverCallback: () => any;
	private idGenerator: IDgenerator;

	constructor(gameOverCallback: () => any) {
		this.allGames = new Map<string, GameWrapper>();
		this.serverGameOverCallback = gameOverCallback;
		this.idGenerator = new IDgenerator();
	}

	public newGame() {
		const newGameID = 'Game ' + this.idGenerator.newID();
		this.allGames.set(
			newGameID,
			new GameWrapper(newGameID, this.gameOverCallback.bind(this))
		);
	}

	private gameOverCallback(id: string) {
		this.allGames.delete(id);
		this.serverGameOverCallback();
	}

	public addPlayerToGame(
		socket: SocketIO.Socket,
		name: string,
		gameID?: string
	): boolean {
		if (gameID) {
			return (
				this.allGames.has(gameID) &&
				this.allGames.get(gameID)!.addPlayer(socket, name)
			);
		} else {
			const game = this.findBestGameToJoin();
			return game?.addPlayer(socket, name) ?? false;
		}
	}

	private findBestGameToJoin(): GameWrapper | null {
		let chosenGame: GameWrapper | null = null;
		for (const game of this.allGames.values()) {
			if (
				!chosenGame ||
				(!game.isFull() && game.playerCount > chosenGame?.playerCount)
			)
				chosenGame = game;
		}
		return chosenGame;
	}

	public getGameList(): { gameid: string; info: any }[] {
		const gameList: { gameid: string; info: any }[] = [];

		for (const game of this.allGames.values()) {
			gameList.push({ gameid: game.id, info: game.getInfo() });
		}

		return gameList;
	}
}
