import { HexTiles, OffsetPoint } from "./hexTiles";

const Constant = require('../shared/constants');

export default class Teams {
	private teams: Map<number, Team>;

	constructor(teamCount: number, baseCoords: OffsetPoint[]) {
		this.initTeams(teamCount);
		this.initBases(baseCoords);
	}

	initTeams(teamCount: number): void {
		this.teams = new Map();
		for (let i = 0; i < teamCount; i++) {
			this.teams.set(i, new Team());
		}
	}

	initBases(baseCoords: OffsetPoint[]): void {
		for (const [teamNumber, team] of this.teams) {
			team.baseCoord = baseCoords[teamNumber];
		}
	}

	addNewPlayer(playerID: string): number {
		let teamNumber: number = this.getNewPlayerTeamNumber();
		this.addPlayerToTeam(teamNumber, playerID);
		return teamNumber;
	}

	removePlayer(playerID: string, teamNumber: number): void {
		this.removePlayerFromTeam(teamNumber, playerID);
	}

	getTeamBaseCoord(teamNumber: number): OffsetPoint {
		return this.teams.get(teamNumber)!.baseCoord;
	}

	private getNewPlayerTeamNumber(): number {
		let smallestTeam = -1;
		let smallestPlayerCount = 999;
		for (const [teamNumber, team] of this.teams) {
			if (team.playerCount < smallestPlayerCount) {
				smallestTeam = teamNumber;
				smallestPlayerCount = team.playerCount;
			}
		}
		return smallestTeam;
	}

	private addPlayerToTeam(teamNumber: number, playerID: string): void {
		this.teams.get(teamNumber)!.addPlayer(playerID);
	}

	private removePlayerFromTeam(teamNumber: number, playerID: string): void {
		this.teams.get(teamNumber)!.removePlayer(playerID);
	}
}

class Team {
	public playerIDs: string[];
	public playerCount: number;
	public baseCoord: OffsetPoint;

	constructor () {
		this.playerIDs = [];
		this.playerCount = 0;
	}

	addPlayer(playerID: string): void {
		this.playerIDs.push(playerID);
		this.playerCount += 1;
	}

	removePlayer(playerID: string): void {
		this.playerIDs = this.playerIDs.filter(id => id !== playerID);
		this.playerCount -= 1;
	}
}