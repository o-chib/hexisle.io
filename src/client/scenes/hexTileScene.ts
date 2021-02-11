import { MAP_DIAMETER } from '../config';

export default class HexTileScene extends Phaser.Scene {
  private graphics: Phaser.GameObjects.Graphics;
  private tileMap: Tile[][];
  private hexRadius: number;
  private hexSize: number = 25;
  private campRadius: number = 3;

  constructor() {
    super({ key: 'hexTileScene' });
  }

  preload(): void {
  }

  create(): void {

    this.hexRadius = this.getMapHexRadius();

    // Sandbox work
    this.graphics = this.add.graphics();

    this.graphics.scene.add.text(810, 10, String(['hex radius', this.hexRadius]));
    this.graphics.scene.add.text(810, 30, String(['map diameter', MAP_DIAMETER]));

    // generate the tile map
    this.generateTileMap();

    // generate the camps
    this.generateCamps();

    // draw all our hexes in the tile map
    this.drawHexes(this.tileMap);

  }

  update(): void {
    if (this.input.mousePointer.isDown) {
      console.log('C L I C K');
      let testTile: Tile = new Tile('camp');
      let mouseX: number = this.input.mousePointer.x;
      let mouseY: number = this.input.mousePointer.y;
      testTile.axial_coord = this.cartesianToAxial(new Point(mouseX, mouseY));
      if (this.checkIfValidHex(testTile.axial_coord)) {
        testTile.cartesian_coord = this.tileMap[testTile.axial_coord.q][testTile.axial_coord.r].cartesian_coord;
        this.createTile(testTile);
      }
    }
  }

  generateTileMap(): void {
    // generates the hex integer coordinates from the game-size
    
    this.tileMap = [];

    // for each column
    for (let col = 0; col < (2 * this.hexRadius) + 1; col++) {
      this.tileMap[col] = [];
      
      // for each row
      for (let row = 0; row < (2 * this.hexRadius) + 1; row++) {
        this.tileMap[col][row] = new Tile();
        this.tileMap[col][row].axial_coord = new AxialPoint(col, row);
        this.tileMap[col][row].cartesian_coord = this.axialToCartesian(this.tileMap[col][row].axial_coord);
      }
    }
  }

  generateCamps(): void {

  }

  drawHexes(tileMap: Tile[][]): void {
    // draws every hex we have in our map
    
    // for each column
    for (let col = 0; col < tileMap.length; col++) {
      
      // for each row
      for (let row = 0; row < tileMap[col].length; row++) {
        this.createTile(tileMap[col][row])
      }
    }
  }

  createTile(tile: Tile): void {
    // takes XY coordinates of center point,
    // generates all required vertices
    // draws individual tile

    let points: Point[] = this.getHexPointsFromCenter(tile.cartesian_coord);

    if (tile.building == 'camp') {
      this.graphics.lineStyle(4, 0xff0000, 1);
    } else {
      this.graphics.lineStyle(2, 0xffffff, 1);
    }

    this.graphics.beginPath();
    this.graphics.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < 6; i++) {
      this.graphics.lineTo(points[i].x, points[i].y)
    }
    this.graphics.closePath();
    this.graphics.strokePath();
  }

  checkIfValidHex(axialPoint: AxialPoint): boolean {
    // takes in an axial coordinate and returns if that hex exists

    if (axialPoint.q < 0 || axialPoint.r < 0 ||
        axialPoint.q > this.hexRadius * 2 || axialPoint.r > this.hexRadius * 2) {
          return false;
        }
    return true;
  }

  createTileColumn(point: Point, numTiles: number): void {
      // creates a column starting from the center point of the first hex,
      // spans vertically down by numTiles hexes.

      // Uses XY coordinates to find center and draw tile
      let h = this.getHexHeight();

      for (let i = 0; i < numTiles; i++) {
          let tile_x = point.x;
          let tile_y = point.y + (i * h);
          let tile: Tile = new Tile();
          tile.axial_coord = new AxialPoint(tile_x, tile_y);
          this.createTile(tile);
      }
  }

  private getHexPointsFromCenter(point: Point): Point[] {
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

  private axialToCartesian(axialPoint: AxialPoint): Point {
    
    // matrix multiplication for conversions
    let x: number = (this.hexSize * (1.5 * axialPoint.q));

    // if the column number is odd shift the hexes down, if it's even don't
    let y: number;
    if (axialPoint.q % 2 != 0) {
      y = this.hexSize * (Math.sqrt(3)/2 + Math.sqrt(3) * axialPoint.r);
    } else {
      y = this.hexSize * (Math.sqrt(3) * axialPoint.r);
    }
    return new Point(x + this.hexSize, y + this.hexSize);
  }

  private cartesianToAxial(point: Point): AxialPoint {
    // takes in a point in the cartesian plane
    // returns the coordinate of the hex it's in
    
    // account for the half a hex to the bottom right we're pushing the map
    point.x = point.x - (this.hexSize);
    point.y = point.y - (this.hexSize);

    // convert the pixel location to an axial location
    let q: number = (2/3 * point.x) / this.hexSize;
    let r: number = (-1/3 * point.x + Math.sqrt(3)/3 * point.y) / this.hexSize;

    // make these axial coords into a cube format
    let cube: number[] = this.axialToCube(new AxialPoint(q, r));

    // round the cube
    cube = this.roundCube(cube);

    // convert the cube to evenq coords and return
    console.log(this.cubeToOddq(cube).q, this.cubeToOddq(cube).r)
    return this.cubeToOddq(cube);
  }

  private axialToCube(axialPoint: AxialPoint): number[] {
    // used for conversions from cartesian to axial
    // returns x, y, z in that order in a list
  
    let x: number = axialPoint.q;
    let z: number = axialPoint.r;
    let y: number = -x - z;
    return [x, y, z];
  }

  private cubeToOddq(cube: number[]): AxialPoint {
    // used for conversions from cartesian to axial
    // returns an axial point
  
    let col: number = cube[0];
    let row: number = cube[2] + (cube[0] - (cube[0]&1)) / 2;
    return new AxialPoint(col, row);
  }

  private roundCube(cube: number[]): number[] {
    let rx: number = Math.round(cube[0]);
    let ry: number = Math.round(cube[1]);
    let rz: number = Math.round(cube[2]);

    var x_dif = Math.abs(rx - cube[0]);
    var y_dif = Math.abs(ry - cube[1]);
    var z_dif = Math.abs(rz - cube[2]);

    if (x_dif > y_dif && x_dif > z_dif) {
        rx = -ry - rz;
    } else if (y_dif > z_dif) {
        ry = -rx - rz;
    } else {
        rz = -rx - ry;
    }
    return [rx, ry, rz];
  }
}

export class Tile {
  public axial_coord: AxialPoint;
  public cartesian_coord: Point;
  public building: string;

  constructor(building: string = 'none') {
    this.building = building;
  }
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