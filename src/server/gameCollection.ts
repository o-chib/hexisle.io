import GameWrapper from './gameWrapper';

export class GameCollection {
	private allGames: Array<GameWrapper>;
	private gameOverCallback: () => any;

	constructor(callback: () => any) {
		this.allGames = new Array<GameWrapper>();
		this.gameOverCallback = callback;
	}

	public newGame() {
		this.allGames.push(new GameWrapper(this.gameOverCallback));
	}
}
