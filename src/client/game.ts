//https://github.com/digitsensitive/phaser3-typescript/blob/master/src/boilerplate/src/game.ts
import 'phaser';
import { GameConfig } from './config';

export class Game extends Phaser.Game {
  constructor(config: Phaser.Types.Core.GameConfig) {
    super(config);
  }
}

window.addEventListener('load', () => {
  const game = new Game(GameConfig);
});