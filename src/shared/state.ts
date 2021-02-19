import { Time } from "phaser";
import Player from "./player";
import { HexTiles, Tile, OffsetPoint, Point } from './../shared/hexTiles';

interface State {
	time: number;
	currentPlayer: Player;
	otherPlayers: Array<Player>;
	tileMap: Tile[][];
	updatedTiles: Tile[];
}
