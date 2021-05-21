import { Constant } from '../../shared/constants';
import { ClientStructure } from './clientStructure';

export class ClientBase extends ClientStructure {
	public create(newBaseLiteral: any) {
		let baseTexture = '';
		if (newBaseLiteral.teamNumber == Constant.TEAM.RED)
			baseTexture = 'base_red';
		else if (newBaseLiteral.teamNumber == Constant.TEAM.BLUE)
			baseTexture = 'base_blue';

		this.setTexture(baseTexture);

		const healthPercent = newBaseLiteral.hp / Constant.HP.BASE;
		this.handleDamageAnimation(healthPercent);
	}

	public update(newWallLiteral: any) {
		const healthPercent = newWallLiteral.hp / Constant.HP.BASE;
		this.handleDamageAnimation(healthPercent);
	}
}
