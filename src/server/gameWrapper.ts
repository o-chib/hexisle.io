import Game from './game';

export default class GameWrapper {
	private game: Game;

	constructor() {
		this.game = new Game(this.restartGame);
	}

	restartGame(): void {}
}
