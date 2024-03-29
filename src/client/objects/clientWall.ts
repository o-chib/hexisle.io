import { Constant } from '../../shared/constants';
import { ClientStructure } from './clientStructure';

export class ClientWall extends ClientStructure {
	public update(newWallLiteral: any) {
		this.setDepth(Constant.SPRITE_DEPTH.WALL);

		let wallTexture = '';
		if (newWallLiteral.teamNumber == Constant.TEAM.RED)
			wallTexture = 'wall_red';
		else if (newWallLiteral.teamNumber == Constant.TEAM.BLUE)
			wallTexture = 'wall_blue';
		else if (newWallLiteral.teamNumber == Constant.TEAM.NONE)
			wallTexture = 'wall_neutral';

		if (this.texture.key != wallTexture) this.setTexture(wallTexture);

		const healthPercent = newWallLiteral.hp / Constant.HP.WALL;
		this.handleDamageAnimation(healthPercent);
	}
}
