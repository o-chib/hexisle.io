//https://github.com/digitsensitive/phaser3-typescript/blob/master/src/boilerplate/src/scenes/main-scene.ts
export class MainScene extends Phaser.Scene {
	private mySprite: Phaser.GameObjects.Sprite;
  
	constructor() {
	  super({ key: 'MainScene' });
	}
  
	preload(): void {
	  this.load.image('myTexture', '../../public/assets/Alien-thumb.jpg');
	}
  
	create(): void {
	  this.mySprite = this.add.sprite(400, 300, 'myTexture');
	}
  }