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
    this.drawAllHexes();

    //center point
    //let centerPoint = new Point(MAP_DIAMETER / 2, MAP_DIAMETER / 2);
    //this.createTileColumn(centerPoint, this.getMapHexRadius());
  }

  generateHexMapCoords(): void {
    // generates the hex integer coordinates from the game-size
    
    this.hexMapCoords = [];
    let hexRadius: number = this.getMapHexRadius();

    // for each column
    for (let col = 0; col < (2 * hexRadius) + 1; col++) {
      this.hexMapCoords[col] = [];
      
      // for each row
      for (let row = 0; row < (2 * hexRadius) + 1; row++) {
        this.hexMapCoords[col][row] = new Point(col, row);
      }
    }
  }

  generateCartMapCoords(): void {
    // generates cartesian coordinates for hex center points based on our hex coordinates

    this.cartMapCoords = [];

    // for each column
    for (let col = 0; col < this.hexMapCoords.length; col++) {
      this.cartMapCoords[col] = [];

      // for each row
      for (let row = 0; row < this.hexMapCoords[col].length; row++) {

        // matrix multiplication for conversions
        let x: number = this.hexSize * (1.5 * col)
        //let y: number = this.hexSize * (Math.sqrt(3)/2 * col + Math.sqrt(3) * row);
        // if the column number is even shift the hexes down, if it's odd don't
        let y: number;
        if (col % 2 == 0) {
          y = this.hexSize * (Math.sqrt(3)/2 + Math.sqrt(3) * row);
        } else {
          y = this.hexSize * (Math.sqrt(3) * row);
        }
        //this.graphics.scene.add.text(100 + 100 * row, 30 * col, String([Math.round(x * 100) / 100, Math.round(y * 100) / 100]));
        this.cartMapCoords[col][row] = new Point(x, y);
      }
    }
  }

  drawAllHexes(): void {
    // draws every hex we have in our map
    
    // for each column
    for (let col = 0; col < this.hexMapCoords.length; col++) {
      //this.graphics.scene.add.text(100, 30 * col, String(col));
      
      // for each row
      for (let row = 0; row < this.hexMapCoords[col].length; row++) {
        //this.graphics.scene.add.text(150 + 30 * row, 30 * col, String(row));
        this.createTile(this.cartMapCoords[col][row])
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

  getHexHeight(): number {
    return this.hexSize * Math.sqrt(3);
  }

  getHexWidth(): number {
    return this.hexSize * 2;
  }

  getHexCorner(point: Point, angle: number): Point {
    let angle_deg: number = 60 * angle;
    let angle_rad: number = Math.PI / 180 * angle_deg;
    return new Point(point.x + this.hexSize * Math.cos(angle_rad),
                     point.y + this.hexSize * Math.sin(angle_rad))
  }

  getMapHexRadius(): number {
    let mapRadius: number = MAP_DIAMETER / 2;
    let freeSpace: number = mapRadius - (this.getHexHeight() / 2)
    return Math.floor(freeSpace / this.getHexHeight());
  }
}

export class Tile {
  public axial_coord: AxialPoint;
  public cartesian_coord: Point;
}

export class AxialPoint {
  public q: number;
  public r: number;

  constructor(q = 0, r = 0) {
    this.q = q;
    this.r = r;
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