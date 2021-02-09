import 'phaser'
import mainScene from './scenes/mainScene'

const DEFAULT_WIDTH = window.innerWidth
const DEFAULT_HEIGHT = window.innerHeight

export const config: Phaser.Types.Core.GameConfig = {
	parent: 'game-canvas',
	width: DEFAULT_WIDTH,
	height: DEFAULT_HEIGHT,
	type: Phaser.AUTO,
	scene: [mainScene],
	physics: {
		default: 'arcade',
		arcade: {
			debug: true,
			gravity: { y: 100}
		}
	}
}