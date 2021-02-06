//https://github.com/digitsensitive/phaser3-typescript/blob/master/src/boilerplate/src/config.ts
import { MainScene } from './scenes/main-scene';

export const GameConfig: Phaser.Types.Core.GameConfig = {
  title: 'Boilerplate',
  version: '2.0',
  width: 800,
  height: 600,
  type: Phaser.AUTO,
  parent: 'game',
  scene: [MainScene]
};