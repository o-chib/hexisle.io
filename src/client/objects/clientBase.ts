import { Constant } from '../../shared/constants';
import { ClientGameObjectContainer } from './clientGameObjectContainer';
import { ClientStructure } from './clientStructure';
import { ClientTerritory } from './clientTerritory';

export class ClientBase extends ClientGameObjectContainer {
	constructor(scene: Phaser.Scene) {
		super();
		this.children.push(new ClientBaseSprite(scene));
		this.children.push(new ClientTerritory(scene));
	}
}

class ClientBaseSprite extends ClientStructure {
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
