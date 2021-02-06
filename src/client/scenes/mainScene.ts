import io from 'socket.io-client'

export default class MainScene extends Phaser.Scene {
  private mySprite: Phaser.GameObjects.Sprite;

  constructor() {
    super({ key: 'MainScene' });
  }

  preload(): void {
    this.load.image('aliem', '../assets/Alien-thumb.jpg');
  }

  create(): void {
    this.mySprite = this.add.sprite(400, 300, 'aliem');
  }
}
