import 'phaser';
import boot from './scenes/boot';
import preloader from './scenes/preloader';
import mainMenu from './scenes/mainMenu';
import mainScene from './scenes/mainScene';
import HUDScene from './scenes/HUDScene';
import gameOver from './scenes/gameOver';

export const config: Phaser.Types.Core.GameConfig = {
	parent: 'game-canvas',
	width: 1920,
	height: 1080,
	type: Phaser.AUTO,
	scale: {
		mode: Phaser.Scale.ENVELOP,
		autoCenter: Phaser.Scale.CENTER_BOTH,
	},
	scene: [boot, preloader, mainMenu, mainScene, HUDScene, gameOver],
	physics: {
		default: 'arcade',
		arcade: {
			debug: true,
			gravity: { y: 100 },
		},
	},
	dom: {
        createContainer: true
    },
};
