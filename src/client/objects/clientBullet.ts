import { Constant } from '../../shared/constants';
import { ClientGameObject } from './clientGameObject';

export class ClientBullet extends ClientGameObject {
	public create(newBulletLiteral: any) {
		this.setDepth(this.depth + 2);

		let bulletTexture = '';
		if (newBulletLiteral.teamNumber == Constant.TEAM.RED)
			bulletTexture = 'bullet_red';
		else if (newBulletLiteral.teamNumber == Constant.TEAM.BLUE)
			bulletTexture = 'bullet_blue';

		if (this.texture.key != bulletTexture) this.setTexture(bulletTexture);
	}

	public update(newWallLiteral: any) {
		this.setPosition(newWallLiteral.xPos, newWallLiteral.yPos);
	}
}
