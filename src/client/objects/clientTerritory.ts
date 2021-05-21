import { Constant } from '../../shared/constants';
import { ClientGameObject } from './clientGameObject';

export class ClientTerritory extends ClientGameObject {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public create(_newBaseLiteral: any) {
		this.setDepth(-1);
	}

	public update(territoryLiteral: any) {
		let baseTexture = '';

		if (territoryLiteral.teamNumber == Constant.TEAM.RED) {
			baseTexture = 'grass_chunk_red';
		} else if (territoryLiteral.teamNumber == Constant.TEAM.BLUE) {
			baseTexture = 'grass_chunk_blue';
		} else if (territoryLiteral.teamNumber == Constant.TEAM.NONE) {
			baseTexture = 'grass_chunk';
		}

		if (this.texture.key != baseTexture) this.setTexture(baseTexture);
	}
}
