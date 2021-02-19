import 'phaser';
import MainScene from './scenes/mainScene';
import { config } from './config';

export class Game extends Phaser.Game {
	constructor(config: Phaser.Types.Core.GameConfig) {
		super(config);
	}
}

window.addEventListener('load', () => {
	const game = new Phaser.Game(config);
});
