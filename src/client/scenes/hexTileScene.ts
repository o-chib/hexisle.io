import { MAP_DIAMETER, MAP_DIAMETER2 } from '../config';

export default class HexTileScene extends Phaser.Scene {
  private graphics: Phaser.GameObjects.Graphics;
  private hexSize: number = 25;
  private hexMapCoords: Point[][];
  private cartMapCoords: Point[][];

  constructor() {
    super({ key: 'hexTileScene' });
  }

  preload(): void {
  }

  create(): void {

    // Sandbox work
    this.graphics = this.add.graphics();
    this.graphics.lineStyle(3, 0xffffff, 1);

    this.graphics.scene.add.text(10, 10, String(this.getMapHexRadius()));
    this.graphics.scene.add.text(10, 30, String(MAP_DIAMETER));
    this.graphics.scene.add.text(10, 50, String(MAP_DIAMETER2));

    // generate the hex coordinates
    this.generateHexMapCoords();

    // generate the cartesian coordinates for our hex coordinates
    this.generateCartMapCoords();

    // draw all our hexes


    //center point
    let centerPoint = new Point(MAP_DIAMETER / 2, MAP_DIAMETER / 2);
    this.createTileColumn(centerPoint, this.getMapHexRadius());
  }

  generateHexMapCoords(): void {
    let hexRadius: number = this.getMapHexRadius();

    // for each column
    for (let i = 0; i < (2 * hexRadius) + 1; i++) {

      // for each row
      for (let j = 0; j < (2 * hexRadius) + 1; j++) {
        this.hexMapCoords[i][j] = new Point(i, j);
      }
    }
  }

  generateCartMapCoords(): void {
    // for each column
    for (let i = 0; i < ; i++) {

      // for each row
      for (let j = 0; ; j++) {

        this.hexMapCoords[i][j] = new Point(i, j);
      }
    }
  }

  createTile(point: Point) {
    // takes XY coordinates of center point,
    // generates all required vertices
    // draws individual tile

    let points: Point[] = this.getHexPointsFromCenter(point);

    this.graphics.beginPath();
    this.graphics.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < 6; i++) {
      this.graphics.lineTo(points[i].x, points[i].y)
    }
    this.graphics.closePath();
    this.graphics.strokePath();
  }

  createTileColumn(point: Point, numTiles: number){
      // creates a column starting from the center point of the first hex,
      // spans vertically down by numTiles hexes.

      // Uses XY coordinates to find center and draw tile
      let h = this.getHexHeight();

      for (let i = 0; i < numTiles; i++) {
          let tile_x = point.x;
          let tile_y = point.y + (i * h);
          this.createTile(new Point(tile_x, tile_y));
      }
  }

  getHexPointsFromCenter(point: Point): Point[] {
    let hexPoints: Point[] = [];

    // iterate through each corner
    for (let i = 0; i < 6; i++) {
        let length = hexPoints.push(this.getHexCorner(point, i));
    }
    return hexPoints;
  }

  private getHexHeight(): number {
    return this.hexSize * Math.sqrt(3);
  }

  private getHexWidth(): number {
    return this.hexSize * 2;
  }

  private getHexCorner(point: Point, angle: number): Point {
    let angle_deg: number = 60 * angle;
    let angle_rad: number = Math.PI / 180 * angle_deg;
    return new Point(point.x + this.hexSize * Math.cos(angle_rad),
                     point.y + this.hexSize * Math.sin(angle_rad))
  }

  private getMapHexRadius(): number {
    let mapRadius: number = MAP_DIAMETER / 2;
    let freeSpace: number = mapRadius - (this.getHexHeight() / 2)
    return Math.floor(freeSpace / this.getHexHeight());
  }
}

export class Point {
  public x: number;
  public y: number;

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
}