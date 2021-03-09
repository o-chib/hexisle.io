import { Tile } from './hexTiles';
const Constant = require('../shared/constants');

export default class Campfire {
	id: string;
	xPos: number;
	yPos: number;
	teamNumber: number;
	tile: Tile;

	captureProgress : number;
	capturingTeam : number;
	captured: boolean;

	private multiplier = 0.2;
	private captureSpeed = 2;
    private resetSpeed = 10;

	constructor(
		id: string,
		xPos: number,
		yPos: number,
		tile: Tile
	) {
		this.id = id;
		this.xPos = xPos;
		this.yPos = yPos;
		this.teamNumber = 0;
		this.tile = tile;

		this.captureProgress = 0;
		this.captured = false;
	}

	updateCaptureProgress(teamNumber : number, numPlayers : number){
		// team number here is always greater than 0 = represents team in consideration
		// numplayers = of that team within the camp capture radius


		let speed = this.captureSpeed + ((numPlayers - 1) * this.multiplier);

		if(teamNumber == this.capturingTeam) {
			this.captureProgress += speed;
		}
		else {
			this.captureProgress -= speed;
		}
		if(this.captureProgress >= 100){
			// captured
			if(this.captured && this.teamNumber == this.capturingTeam) {
				// This base is already captured, dominating team already owns this
				// Do nothing?
			}
			else {
				this.setCaptureState();
			}
		}
		if(this.captureProgress < 0){
			this.captureProgress = 0;
		}
	}
	setCaptureState(){
		// If neutral, set to dominating team
		this.teamNumber = this.capturingTeam;
		this.captured = true;
		// If captured already, set to neutral
		this.teamNumber = 0;
		this.captured = false;

		// TODO set tiles in radius to that team color

		// Reset
		this.captureProgress = 0;
		this.capturingTeam = 0;
	}

	resetWhenAlone(){
		// For when no potential capturers in its radius
		if(this.captureProgress > 0){
			this.captureProgress = Math.max(0, this.captureProgress - this.resetSpeed);
		}

	}

	serializeForUpdate(): any {
		return {
			id: this.id,
			xPos: this.xPos,
			yPos: this.yPos,
			captureProgress: this.captureProgress,
			teamNumber: this.teamNumber,
		};
	}

}
