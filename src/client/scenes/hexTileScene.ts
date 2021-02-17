import { MAP_HEIGHT } from '../config';

export default class HexTileScene extends Phaser.Scene {
  private graphics: Phaser.GameObjects.Graphics;
  private tileMap: Tile[][]; // Made in offset even-q coordinates
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
    this.graphics.scene.add.text(810, 30, String(['map diameter', MAP_HEIGHT]));

    // generate the tile map
    this.generateTileMap();

    // generate the camps
    let camps: OffsetPoint[] = this.generateCamps();

    // draw all our hexes in the tile map
    this.drawHexes(this.tileMap);
    //this.drawMap();

    // drawing camps and their outermost radius
    for (let camp of camps) {
      this.drawTile(this.tileMap[camp.q][camp.r]);
      for (let ringhex of this.getHexRingPoints(this.tileMap[camp.q][camp.r], this.campRadius)) {
        if (this.checkIfValidHex(ringhex)) {
          this.tileMap[ringhex.q][ringhex.r].building = 'ring';
          this.drawTile(this.tileMap[ringhex.q][ringhex.r]);
        }
      }
    }
  }

  update(): void {
    if (this.input.mousePointer.isDown) {
      console.time();
      let testTile: Tile = new Tile('select');
      let mouseX: number = this.input.mousePointer.x;
      let mouseY: number = this.input.mousePointer.y;
      testTile.offset_coord = this.cartesianToOffset(new Point(mouseX, mouseY));
      if (this.checkIfValidHex(testTile.offset_coord)) {
        testTile.cartesian_coord = this.tileMap[testTile.offset_coord.q][testTile.offset_coord.r].cartesian_coord;
        this.drawTile(testTile);
      }
      console.timeEnd();
    }
  }

  generateTileMap(): void {
    console.log('time to generate tilemap');
    console.time();
    // generates the hex integer coordinates from the game-size

    this.tileMap = [];

    // for each column
    for (let col = 0; col < (2 * this.hexRadius) + 1; col++) {
      this.tileMap[col] = [];

      // for each row
      for (let row = 0; row < (2 * this.hexRadius) + 1; row++) {
        this.tileMap[col][row] = new Tile();
        this.tileMap[col][row].offset_coord = new OffsetPoint(col, row);
        this.tileMap[col][row].cartesian_coord = this.offsetToCartesian(this.tileMap[col][row].offset_coord);
      }
    }
    console.timeEnd();
  }

  generateCamps(): OffsetPoint[] {
    console.log('time to generate camps');
    console.time();
    // Takes the tilemap and sets tiles to camps dependent on the class config (private variables)

    // start at the center of the map, and make it a camp
    let hex: OffsetPoint = new OffsetPoint(this.hexRadius, this.hexRadius);
    this.tileMap[hex.q][hex.r].building = 'camp';
    let hexesToCheck: OffsetPoint[] = [hex];
    let campHexes: OffsetPoint[] = [hex];

    // keep repeating until we don't have any hexes left
    while (hexesToCheck.length > 0) {
      hex = hexesToCheck.splice(0, 1)[0];
      
      // check all 6 possible surrounding campsite coordinates for this hex
      for (let i = 0; i < 6; i++) {

        // create a new hex to traverse with
        let travHex: OffsetPoint = new OffsetPoint(hex.q, hex.r);
        
        // direction to check
        let dir: number = i;
        
        // start and go the length of the hex radius in the desired direction (clockwise starting at north)
        travHex = this.hexTraverse(travHex, dir, this.campRadius)

        // if i is at the last index, loop back to 0, or else increment it
        if (i == 5) {
          dir = 0;
        } else {
          dir += 1;
        }

        // start and go the length of the hex radius + 1 in the original direction + 1
        travHex = this.hexTraverse(travHex, dir, this.campRadius + 1)

        // check if this site exists, if it does add it to the list of hexes to check
        // around for more campfires and set the tile as a campfire
        if (this.checkIfValidHex(travHex)) {
          
          // only add it if we haven't been to it before
          if (!this.isHexInHexList(travHex, campHexes)) {
            hexesToCheck.push(travHex);
            campHexes.push(travHex);
            this.tileMap[travHex.q][travHex.r].building = 'camp';
          }
        }
      }
    }
    console.timeEnd();
    return campHexes;
  }

  drawMap() {
      let centerTile = this.tileMap[this.hexRadius][this.hexRadius];

      let offsetCoords = this.getHexRadiusPoints(centerTile, this.hexRadius);
      let currTile = new Tile();
      for(let i = 0 ; i < offsetCoords.length ; ++i) {
          currTile.offset_coord = offsetCoords[i];
          currTile.cartesian_coord = this.offsetToCartesian(offsetCoords[i]);
          this.drawTile(currTile);
      }
  }

  drawHexes(tileMap: Tile[][]): void {
    // draws every hex we have in our map

    // for each column
    for (let col = 0; col < tileMap.length; col++) {

      // for each row
      for (let row = 0; row < tileMap[col].length; row++) {
        this.drawTile(tileMap[col][row])
      }
    }
  }

  drawTile(tile: Tile): void {
    // takes XY coordinates of center point,
    // generates all required vertices
    // draws individual tile

    let points: Point[] = this.getHexPointsFromCenter(tile.cartesian_coord);

    if (tile.building == 'camp') {
      this.graphics.lineStyle(4, 0xff0000, 1);
    } else if (tile.building == 'ring') {
      this.graphics.lineStyle(1, 0x002fff, 1);
    } else if (tile.building == 'select') {
      this.graphics.lineStyle(2, 0xffb300, 1);
    } else {
      this.graphics.lineStyle(1, 0xffffff, 1);
    }

    this.graphics.beginPath();
    this.graphics.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < 6; i++) {
      this.graphics.lineTo(points[i].x, points[i].y)
    }
    this.graphics.closePath();
    this.graphics.strokePath();
  }

  checkIfValidHex(OffsetPoint: OffsetPoint): boolean {
    // takes in an axial coordinate and returns if that hex exists

    if (OffsetPoint.q < 0 || OffsetPoint.r < 0 ||
        OffsetPoint.q > this.hexRadius * 2 || OffsetPoint.r > this.hexRadius * 2) {
          return false;
        }
    return true;
  }

  drawTileColumn(point: Point, numTiles: number): void {
      // draws a column starting from the center point of the first hex,
      // spans vertically down by numTiles hexes.

      // Uses XY coordinates to find center and draw tile
      let h = this.getHexHeight();

      for (let i = 0; i < numTiles; i++) {
          let tile_x = point.x;
          let tile_y = point.y + (i * h);
          let tile: Tile = new Tile();
          tile.offset_coord = new OffsetPoint(tile_x, tile_y);
          this.drawTile(tile);
      }
  }

  getHexRingPoints(centreTile:Tile, radius :number) : OffsetPoint[] {
    // Takes center tile and returns a list of points that form a ring at some radius from the center
    // radius = number of tiles from top to center - excluding the center.
    let results : OffsetPoint[] = [];

    // Get starting tile (North of center)
    let evenQ = false; // if current point lies on even q or odd q
    if(centreTile.offset_coord.q % 2 == 0){
        evenQ = true;
    }
    let currPoint = this.getHexDirectionPoint(4,evenQ);
    currPoint.scale(radius);
    currPoint.add(centreTile.offset_coord);

    let k = 0;
    for(let i = 0; i < 6; ++i){
        // Iterate in all 6 Hex Directions
        for(let j = 0; j < radius; ++j){
            results[k] = new OffsetPoint(currPoint.q, currPoint.r);
            currPoint = this.getHexNeighborPoint(currPoint,i)
            ++k;
        }
    }
    return results;
  }

  getHexRadiusPoints(centerTile: Tile, radius:number): OffsetPoint[] {
    // Takes center tile and returns list of points that surround it in hexagonal shape
    // radius = number of tiles from top to center - excluding the center.
    let results  : OffsetPoint[] = [];
    results[0] = new OffsetPoint(centerTile.offset_coord.q, centerTile.offset_coord.r);

    for(let k = 1; k <= radius; ++k) {
        let subResult = this.getHexRingPoints(centerTile,k);
        results = results.concat(subResult);
    }
    return results
  }

  cartesianToOffset(point: Point): OffsetPoint {
    // takes in a point in the cartesian plane
    // returns the offset odd-q coordinate of the hex it's in

    // account for the half a hex to the bottom right we're pushing the map
    point.x = point.x - (this.hexSize);
    point.y = point.y - (this.hexSize);

    // make the offset coord into a cube format
    let cube: number[] = this.pixelToCube(new Point(point.x, point.y));

    // round the cube
    cube = this.roundCube(cube);

    // convert the cube to evenq coords and return
    return this.cubeToOffset(cube);
  }

  offsetToCartesian(OffsetPoint: OffsetPoint): Point {
    // given an offset odd-q hex coordinate,
    // returns the cartesian coordinate of the center of that hex

    // matrix multiplication for conversions
    let x: number = (this.hexSize * (1.5 * OffsetPoint.q));

    // if the column number is odd shift the hexes down, if it's even don't
    let y: number;
    if (OffsetPoint.q % 2 != 0) {
      y = this.hexSize * (Math.sqrt(3)/2 + Math.sqrt(3) * OffsetPoint.r);
    } else {
      y = this.hexSize * (Math.sqrt(3) * OffsetPoint.r);
    }
    return new Point(x + this.hexSize, y + this.hexSize);
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
    // given a cartesian point, which is the center of some hex
    // this returns a point of the hex, whose angle is given by the number

    let angle_deg: number = 60 * angle;
    let angle_rad: number = Math.PI / 180 * angle_deg;
    return new Point(point.x + this.hexSize * Math.cos(angle_rad),
                     point.y + this.hexSize * Math.sin(angle_rad))
  }

  private getMapHexRadius(): number {
    // given the mapsize, calculates how hexes radially it can hold, given
    // that there is a hex in the absolute center of the map

    let mapRadius: number = MAP_HEIGHT / 2;
    let freeSpace: number = mapRadius - (this.getHexHeight() / 2)
    return Math.floor(freeSpace / this.getHexHeight());
  }

  private pixelToCube(point: Point): number[] {
    // used for conversions from cartesian to offset odd-q
    // returns the cube: x, y, z in that order in a list

    let q: number = (2/3 * point.x) / this.hexSize;
    let r: number = (-1/3 * point.x + Math.sqrt(3)/3 * point.y) / this.hexSize;
    return [q, -q - r, r];
  }

  private cubeToOffset(cube: number[]): OffsetPoint {
    // used for conversions from cartesian to odd-q offset
    // returns an offset odd-q point

    let q: number = cube[0];
    let r: number = cube[2] + (cube[0] - (cube[0]&1)) / 2;
    return new OffsetPoint(q, r);
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

  private getHexDirectionPoint(directionIndex : number, evenQ : boolean): OffsetPoint {
    // Specifies all directions one can move from any hex;
    // displacement depends on position of current tile - if it is offset due to 'odd-q' configuration.

    let offsetDir = new OffsetPoint(0, 0);
    switch(directionIndex) {
        case 0 :  //South-East
                  if(evenQ)
                      offsetDir = new OffsetPoint(1, 0);
                  else
                      offsetDir = new OffsetPoint(1, 1);
                  break;
        case 1 : //South
                  offsetDir = new OffsetPoint(0, 1);
                  break;
        case 2 : //South-West
                  if(evenQ)
                      offsetDir = new OffsetPoint(-1, 0);
                  else
                      offsetDir = new OffsetPoint(-1, 1);
                  break;
        case 3 : //North-West
                  if(evenQ)
                      offsetDir = new OffsetPoint(-1, -1);
                  else
                      offsetDir = new OffsetPoint(-1, 0);
                  break;
        case 4 :  // North
                  offsetDir = new OffsetPoint(0, -1);
                  break;
        case 5 :  //North-East
                  if(evenQ)
                      offsetDir = new OffsetPoint(1, -1);
                  else
                      offsetDir = new OffsetPoint(1, 0);
                  break;
    }
    return offsetDir;
  }

  private getHexNeighborPoint(point: OffsetPoint, directionIndex : number) : OffsetPoint {
    // Get coords of adjacent tile based on direction
    let neighbor = new OffsetPoint(point.q,point.r);

    let evenQ = false; // if current point lies on even q or odd q;
    if(point.q % 2 == 0){
        evenQ = true;
    }
    let direction = this.getHexDirectionPoint(directionIndex,evenQ);
    neighbor.add(direction);

    return neighbor;
  }

  private hexTraverse(hex: OffsetPoint, direction: number, distance: number): OffsetPoint {
    // moves the hex coordinate from it's original position <distance> hexes away in the direction <direction>
    // returns the offset coordinate of the new position

    for (let i = 0; i < distance; i++) {

      // make sure we're using the right column directions (even or odd)
      if (hex.q % 2 == 0) {
        hex.add(this.getHexDirectionPoint(direction, true));
      } else {
        hex.add(this.getHexDirectionPoint(direction, false));
      }
    }
    return hex;
  }

  private isHexInHexList(hex: OffsetPoint, hexList: OffsetPoint[]): boolean {
    // checks if a given hex coordinate is in a list of offset points (checks q and r)
    // returns a true if it is in the list

    for (let checkHex of hexList) {
      if (checkHex.q == hex.q && checkHex.r == hex.r) {
        return true;
      }
    }
    return false;
  }
}

export class Tile {
  public offset_coord: OffsetPoint;
  public cartesian_coord: Point;
  public building: string;

  constructor(building: string = 'none') {
    this.building = building;
  }
}

export class OffsetPoint {
  public q: number;
  public r: number;
  public s: number;

  constructor(q = 0, r = 0) {
    this.q = q;
    this.r = r;
    this.s = -this.q -this.r;
  }
  public length() : number {
      return (Math.abs(this.q) + Math.abs(this.r) + Math.abs(this.s)) / 2;
  }
  public scale(x: number) {
     this.q *= x;
     this.r *= x;
     this.s *= x;
  }
  public add(offset_coord: OffsetPoint) {
     this.q += offset_coord.q;
     this.r += offset_coord.r;
     this.s += offset_coord.s;
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
