import { Constant } from '../../shared/constants';
import { ClientGameObjectConstainer } from './clientGameObjectContainer';
import { ClientStructure } from './clientStructure';

export class ClientTurret extends ClientGameObjectConstainer {
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
		this.handleDamageAnimation(turretGunTexture, healthPercent);
	}
}

class ClientTurretGun extends ClientStructure {
	public init(newTurretLiteralGun: any) {
		this.setPosition(newTurretLiteralGun.xPos, newTurretLiteralGun.yPos);
	}

	public update(newTurretLiteralGun: any) {
		const turretGunTexture = 'turret_shooter';

		if (this.texture.key != turretGunTexture) {
			this.setTexture(turretGunTexture);
		}

		const healthPercent = newTurretLiteralGun.hp / Constant.HP.TURRET;
		this.handleDamageAnimation(turretGunTexture, healthPercent);
		this.setRotation(newTurretLiteralGun.direction);
	}
}
