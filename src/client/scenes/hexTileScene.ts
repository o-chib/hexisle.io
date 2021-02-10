import { MAP_DIAMETER } from '../config';

export default class HexTileScene extends Phaser.Scene {
  private graphics: Phaser.GameObjects.Graphics;
  private hexSize: number = 25;
  private hexMapCoords: Point[][];
  private cartMapCoords: Point[][];
  private tileMap: Tile[][];

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

    // generate the tile map
    this.generateTileMap();

    // draw all our hexes in the tile map
    this.drawHexes(this.tileMap);
  }

  generateTileMap(): void {
    // generates the hex integer coordinates from the game-size
    
    this.tileMap = [];
    let hexRadius: number = this.getMapHexRadius();

    // for each column
    for (let col = 0; col < (2 * hexRadius) + 1; col++) {
      this.tileMap[col] = [];
      
      // for each row
      for (let row = 0; row < (2 * hexRadius) + 1; row++) {
        this.tileMap[col][row] = new Tile();
        this.tileMap[col][row].axial_coord = new AxialPoint(col, row);
        this.tileMap[col][row].cartesian_coord = this.axialToCartesian(this.tileMap[col][row].axial_coord);
      }
    }
  }

  drawHexes(tileMap: Tile[][]): void {
    // draws every hex we have in our map
    
    // for each column
    for (let col = 0; col < tileMap.length; col++) {
      
      // for each row
      for (let row = 0; row < tileMap[col].length; row++) {
        this.createTile(tileMap[col][row].cartesian_coord)
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

  axialToCartesian(axialPoint: AxialPoint): Point {
    
    // matrix multiplication for conversions
    let x: number = (this.hexSize * (1.5 * axialPoint.q)) + this.hexSize

    // if the column number is even shift the hexes down, if it's odd don't
    let y: number;
    if (axialPoint.q % 2 == 0) {
      y = this.hexSize * (Math.sqrt(3)/2 + Math.sqrt(3) * axialPoint.r);
    } else {
      y = this.hexSize * (Math.sqrt(3) * axialPoint.r);
    }
    return new Point(x, y);
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