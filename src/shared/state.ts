/* eslint-disable @typescript-eslint/no-unused-vars */
import Player from '../server/objects/player';
import { Tile } from './../shared/hexTiles';

//TODO use this somewhere
interface State {
	time: number;
	currentPlayer: Player;
	otherPlayers: Array<Player>;
	tileMap: Tile[][];
	updatedTiles: Tile[];
}
