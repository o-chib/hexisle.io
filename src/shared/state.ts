import { Time } from 'phaser';
import Player from './player';

interface State {
	time: number;
	currentPlayer: Player;
	otherPlayers: Array<Player>;
}
