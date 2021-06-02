import { Constant } from '../../shared/constants';
import { OffsetPoint } from '../hexTiles';
import GameObject from './gameObject';

export default class Campfire extends GameObject {
	public readonly RADIUS = Constant.RADIUS.CAMP;
	public territoryPoints: OffsetPoint[];
	public captureProgress: number; // Variable Progress Bar (0-100)
	public isCaptured: boolean;
	public capturingTeam: number; // denotes who is capturing (-1 = no team)

	constructor(id: string, xPos: number, yPos: number) {
		super(id, xPos, yPos);
		this.isCaptured = false;
		this.captureProgress = 0;
		this.capturingTeam = Constant.TEAM.NONE;
		this.territoryPoints = [];
	}

	public setTerritoryPoints(territoryPoints: OffsetPoint[]) {
		this.territoryPoints = territoryPoints;
	}

	public updateCaptureState(playerCount: number[]) {
		let numTeams = 0; // from total teams, how many are in the campfire radius
		let teamMax = 0; // index of team with most players
		for (let i = 0; i < playerCount.length; ++i) {
			if (playerCount[i] > 0) {
				++numTeams;
				if (teamMax < playerCount[i]) {
					teamMax = i;
				}
			}
		}

		if (this.isCaptured) {
			// if opposing team, decayProgress (mix of teams can decay)
			if (numTeams == 1 && teamMax != this.teamNumber) {
				this.capturingTeam = teamMax;
				this.growProgress(playerCount[teamMax]);
			}
			// if either team_number OR no team, set progress to 0 again and reset capturing team
			if (
				(numTeams == 1 && teamMax == this.teamNumber) ||
				numTeams == 0
			) {
				this.captureProgress = 0;
				this.capturingTeam = -1;
			}
		} else {
			// if no teams = set progress to 0, reset everything
			if (numTeams == 0) {
				this.captureProgress = 0;
				this.capturingTeam = -1;
			}
			// if one team - grow progress, set capturingTeam
			if (numTeams == 1) {
				if (this.capturingTeam != teamMax) {
					this.captureProgress = 0;
					this.capturingTeam = teamMax;
				}

				this.growProgress(playerCount[teamMax]);
			}
		}
	}

	public checkForCapture() {
		if (this.isCaptured) {
			// Turn Back to Neutral!
			this.teamNumber = Constant.TEAM.NONE;
			this.isCaptured = false;
		} else {
			// Was Captured!
			this.teamNumber = this.capturingTeam;
			this.isCaptured = true;
		}
	}

	public resetProgress() {
		this.captureProgress = 0;
		this.capturingTeam = -1;
	}

	private growProgress(x: number) {
		if (this.captureProgress < 100) {
			this.captureProgress = Math.min(100, this.captureProgress + x);
		}
	}

	public serializeForUpdate(): any {
		return {
			id: this.id,
			xPos: this.xPos,
			yPos: this.yPos,
			teamNumber: this.teamNumber,
			captureProgress: this.captureProgress,
		};
	}
}
