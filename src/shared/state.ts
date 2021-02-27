import Player from './player';
import { Tile } from './../shared/hexTiles';

interface State {
	time: number;
	currentPlayer: Player;
	otherPlayers: Array<Player>;
	tileMap: Tile[][];
	updatedTiles: Tile[];
}
