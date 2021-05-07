import 'phaser';
import mainScene from './scenes/mainScene';
import HUDScene from './scenes/HUDScene';
import UIScene from './scenes/UIScene';

export const config: Phaser.Types.Core.GameConfig = {
	parent: 'game-canvas',
	width: 1920,
	height: 1080,
	type: Phaser.AUTO,
	scale: {
		mode: Phaser.Scale.ENVELOP,
		autoCenter: Phaser.Scale.CENTER_BOTH,
	},
	scene: [mainScene, HUDScene, UIScene],
	physics: {
		default: 'arcade',
		arcade: {
			debug: true,
			gravity: { y: 100 },
		},
	},
};
