import GameWrapper from './gameWrapper';
import IDgenerator from './idGenerator';

export class GameCollection {
	private allGames: Map<string, GameWrapper>;
	private gameOverCallback: () => any;
	private idGenerator: IDgenerator;

	constructor(callback: () => any) {
		this.allGames = new Map<string, GameWrapper>();
		this.gameOverCallback = callback;
		this.idGenerator = new IDgenerator();
	}

	public newGame() {
		const newGameID = this.idGenerator.newID();
		this.allGames.set(
			newGameID,
			new GameWrapper(newGameID, this.gameOverCallback)
		);
	}
}
