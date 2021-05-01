import { Constant } from '../shared/constants';
import Player from '../shared/player';
import Teams from '../shared/teams';

export class PassiveIncome {
	private passiveUpdateTimer: number;
	private teams: Teams

	constructor(teams: Teams) {
		this.passiveUpdateTimer = Constant.INCOME.UPDATE_RATE;
		this.teams = teams;
	}

	givePassiveIncomeIfPossible(timePassed: number): boolean {
		const givePassiveIncome = this.canGivePassiveIncome();
		if (givePassiveIncome) {
			this.resetPassiveUpdateTimer();
		} else {
			this.updatePassiveTimer(timePassed);
		}
		return givePassiveIncome;
	}

	updatePlayerResources(player: Player) {
		const newResourceValue: number =
			this.teams.getTeam(player.teamNumber).numCapturedCamps *
			Constant.INCOME.INCOME_PER_CAMP;
		player.updateResource(newResourceValue);
	}

	private canGivePassiveIncome(): boolean {
		if (this.passiveUpdateTimer <= 0) {
			return true;
		}
		return false;
	}

	private resetPassiveUpdateTimer(): void {
		this.passiveUpdateTimer = Constant.INCOME.UPDATE_RATE;
	}

	private updatePassiveTimer(timePassed: number): void {
		this.passiveUpdateTimer -= timePassed;
	}
}
