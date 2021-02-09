export default class HexTileScene extends Phaser.Scene {
  private graphics: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'hexTileScene' });
  }

  preload(): void {
  }

  create(): void {
    this.graphics = this.add.graphics();
    this.graphics.lineStyle(16, 0x00ff00, 1);

    //center point
    let x = 400;
    let y = 100;
    let w = 100;
    let h = 100;

    // Coord set :
    //x - (w/2), y
    //x - (w/4), y - (h/2)
    //x + (w/4), y - (h/2)
    //x + (w/2), y
    //x + (w/4), y + (h/2)
    //x - (w/4), y + (h/2)
    //x - (w/2), y
    this.createTile(x,y,w,h,3,0xffffff,1);
    this.createTile(x,y+w,w,h,3,0xffffff,1);
    this.createTile(x,y+w+w,w,h,3,0xffffff,1);
    this.createTile(x,y+w+w+w,w,h,3,0xffffff,1);


  }
  createTile(x: number, y: number, w: number, h: number, lineWidth: number, color: number, alpha: number) {
      this.graphics.lineStyle(lineWidth, color, alpha);

      this.graphics.beginPath();
      this.graphics.moveTo(x - (w/2), y);
      this.graphics.lineTo(x - (w/4), y - (h/2));
      this.graphics.lineTo(x - (w/4), y - (h/2));
      this.graphics.lineTo(x + (w/4), y - (h/2));
      this.graphics.lineTo(x + (w/2), y);
      this.graphics.lineTo(x + (w/4), y + (h/2));
      this.graphics.lineTo(x - (w/4), y + (h/2));
      this.graphics.lineTo(x - (w/2), y);

      this.graphics.closePath();

      this.graphics.strokePath();
    }
}
