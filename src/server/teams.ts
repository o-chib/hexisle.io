/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { OffsetPoint } from './hexTiles';

export default class Teams {
	private teams: Map<number, Team>;
	private numTeams: number;

	constructor(teamCount: number) {
		this.numTeams = teamCount;
		this.initTeams(teamCount);
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

	public getRandomRespawnPoint(teamNum: number): OffsetPoint {
		const coords: OffsetPoint[] = this.getRespawnCoords(teamNum);
		const index = Math.floor(Math.random() * coords.length);
		return coords[index];
	}

	public addNewPlayer(playerID: string): number {
		const teamNumber: number = this.getNewPlayerTeamNumber();
		this.teams.get(teamNumber)!.addPlayer(playerID);
		return teamNumber;
	}

	private initTeams(teamCount: number): void {
		this.teams = new Map();
		for (let i = 0; i < teamCount; i++) {
			this.teams.set(i, new Team());
		}
	}

	public initBases(baseCoords: OffsetPoint[]): void {
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

	public removePlayer(playerID: string, teamNum: number): void {
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
