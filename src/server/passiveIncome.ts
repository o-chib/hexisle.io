import { Constant } from '../shared/constants';
import Player from '../shared/player';
import Teams from '../shared/teams';

export class PassiveIncome {
	private updateTimer: number;
	private teams: Teams;

	constructor(teams: Teams) {
		this.updateTimer = Constant.INCOME.UPDATE_RATE;
		this.teams = teams;
	}

	public givePassiveIncomeIfPossible(timePassed: number): boolean {
		const givePassiveIncome = this.canGivePassiveIncome();
		if (givePassiveIncome) {
			this.resetUpdateTimer();
		} else {
			this.decrementUpdateTimer(timePassed);
		}
		return givePassiveIncome;
	}

	public updatePlayerResources(player: Player) {
		const newResourceValue: number =
			this.teams.getTeam(player.teamNumber).numCapturedCamps *
			Constant.INCOME.INCOME_PER_CAMP;
		player.updateResource(newResourceValue);
	}

	private canGivePassiveIncome(): boolean {
		if (this.updateTimer <= 0) {
			return true;
		}
		return false;
	}

	private resetUpdateTimer(): void {
		this.updateTimer = Constant.INCOME.UPDATE_RATE;
	}

	private decrementUpdateTimer(timePassed: number): void {
		this.updateTimer -= timePassed;
	}
}
