/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { OffsetPoint } from '../../shared/hexTiles';

export default class Teams {
	private teams: Map<number, Team>;
	private numTeams: number;

	constructor(teamCount: number, baseCoords: OffsetPoint[]) {
		this.numTeams = teamCount;
		this.initTeams(teamCount);
		this.initBases(baseCoords);
	}

	public getTeam(teamNum: number): Team {
		return this.teams.get(teamNum)!;
	}

	public getTeamCampNum(teamNum: number): number {
		return this.teams.get(teamNum)!.numCapturedCamps;
	}

	public getNumTeams(): number {
		return this.numTeams;
	}

	public getTeamBaseCoord(teamNum: number): OffsetPoint {
		return this.teams.get(teamNum)!.baseCoord;
	}

	public getRespawnCoords(teamNum: number): OffsetPoint[] {
		return this.teams.get(teamNum)!.respawnCoords;
	}

	public addNewPlayer(playerID: string): number {
		const teamNumber: number = this.getNewPlayerTeamNumber();
		this.addPlayerToTeam(teamNumber, playerID);
		return teamNumber;
	}

	public removePlayer(playerID: string, teamNumber: number): void {
		this.removePlayerFromTeam(teamNumber, playerID);
	}

	private initTeams(teamCount: number): void {
		this.teams = new Map();
		for (let i = 0; i < teamCount; i++) {
			this.teams.set(i, new Team());
		}
	}

	private initBases(baseCoords: OffsetPoint[]): void {
		for (const [teamNumber, team] of this.teams) {
			team.baseCoord = baseCoords[teamNumber];
			team.numCapturedCamps = 1;
		}
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

	private addPlayerToTeam(teamNum: number, playerID: string): void {
		this.teams.get(teamNum)!.addPlayer(playerID);
	}

	private removePlayerFromTeam(teamNum: number, playerID: string): void {
		this.teams.get(teamNum)!.removePlayer(playerID);
	}
}

class Team {
	public playerIDs: string[];
	public playerCount: number;
	public baseCoord: OffsetPoint;
	public respawnCoords: OffsetPoint[];
	public numCapturedCamps: number;

	constructor() {
		this.playerIDs = [];
		this.playerCount = 0;
	}

	public addPlayer(playerID: string): void {
		this.playerIDs.push(playerID);
		this.playerCount += 1;
	}

	public removePlayer(playerID: string): void {
		this.playerIDs = this.playerIDs.filter((id) => id !== playerID);
		this.playerCount -= 1;
	}

	public getCampNum(): number {
		return this.numCapturedCamps;
	}
}
