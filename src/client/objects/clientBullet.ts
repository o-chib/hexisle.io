import { Constant } from '../../shared/constants';
import { ClientGameObject } from './clientGameObject';

export class ClientBullet extends ClientGameObject {
	public create(newBulletLiteral: any) {
		this.setDepth(Constant.SPRITE_DEPTH.BULLET);

		let bulletTexture = '';
		if (newBulletLiteral.teamNumber == Constant.TEAM.RED)
			bulletTexture = 'bullet_red';
		else if (newBulletLiteral.teamNumber == Constant.TEAM.BLUE)
			bulletTexture = 'bullet_blue';

		if (this.texture.key != bulletTexture) this.setTexture(bulletTexture);
		if (!this.scene.sound.mute) {
			this.scene.sound.play('bullet', {
				volume: this.getVolume() * 0.02,
			});
		}
	}

	public update(newWallLiteral: any) {
		this.setPosition(newWallLiteral.xPos, newWallLiteral.yPos);
	}
}
