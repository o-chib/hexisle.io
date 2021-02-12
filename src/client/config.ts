import 'phaser'
import mainScene from './scenes/mainScene'
import hexTileScene from './scenes/hexTileScene'

const DEFAULT_WIDTH = window.innerWidth
const DEFAULT_HEIGHT = window.innerHeight

export var MAP_HEIGHT: number = 800;

export const config: Phaser.Types.Core.GameConfig = {
	parent: 'game-canvas',
	width: DEFAULT_WIDTH,
	height: DEFAULT_HEIGHT,
	type: Phaser.AUTO,
	scene: [hexTileScene],
	physics: {
		default: 'arcade',
		arcade: {
			debug: true,
			gravity: { y: 100}
		}
	}
}
