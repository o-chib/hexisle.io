import Game from './game';
import GameWrapper from './gameWrapper';

export class GameCollection {
	private allGames: Array<GameWrapper>;

	constructor() {
		this.allGames = new Array<GameWrapper>();
	}

	public newGame() {
		this.allGames.push(new GameWrapper());
	}
}
