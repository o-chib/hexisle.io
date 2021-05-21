import { Constant } from '../../shared/constants';
import { ClientGameObjectContainer } from './clientGameObjectContainer';
import { ClientStructure } from './clientStructure';

export class ClientTurret extends ClientGameObjectContainer {
	constructor(scene: Phaser.Scene) {
		super();
		this.children.push(new ClientTurretGun(scene));
		this.children.push(new ClientTurretBase(scene));
	}
}

class ClientTurretBase extends ClientStructure {
	public update(newTurretBaseLiteral: any) {
		let turretGunTexture = '';
		if (newTurretBaseLiteral.teamNumber == Constant.TEAM.RED)
			turretGunTexture = 'turret_base_red';
		else if (newTurretBaseLiteral.teamNumber == Constant.TEAM.BLUE)
			turretGunTexture = 'turret_base_blue';
		else if (newTurretBaseLiteral.teamNumber == Constant.TEAM.NONE)
			turretGunTexture = 'turret_base_neutral';

		if (this.texture.key != turretGunTexture)
			this.setTexture(turretGunTexture);

		const healthPercent = newTurretBaseLiteral.hp / Constant.HP.TURRET;
		this.handleDamageAnimation(healthPercent);
	}
}

class ClientTurretGun extends ClientStructure {
	public create() {
		this.setDepth(1);
		this.setTexture('turret_shooter');
	}

	public update(newTurretLiteralGun: any) {
		const healthPercent = newTurretLiteralGun.hp / Constant.HP.TURRET;
		this.handleDamageAnimation(healthPercent);
		this.setRotation(newTurretLiteralGun.direction);
	}
}
