import { Constant } from '../../shared/constants';
import { ClientStructure } from './clientStructure';

export class ClientTurret extends ClientStructure {
	public update(newTurretBaseLiteral: any) {
		this.setPosition(newTurretBaseLiteral.xPos, newTurretBaseLiteral.yPos);

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
		this.handleDamageAnimation(turretGunTexture, healthPercent);
	}
}
