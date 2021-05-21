import { Constant } from '../../shared/constants';
import { ClientGameObject } from './clientGameObject';

export class ClientResource extends ClientGameObject {
	public create(newResourceLiteral: any) {
		this.setDepth(this.depth + 10);
		this.setVisible(true);
		let resourceTexture = '';
		console.log('pop')

		if (newResourceLiteral.type == Constant.RESOURCE.RESOURCE_NAME[0]) {
			resourceTexture = 'resSmall';
		} else if (
			newResourceLiteral.type == Constant.RESOURCE.RESOURCE_NAME[1]
		) {
			resourceTexture = 'resMedium';
		} else if (
			newResourceLiteral.type == Constant.RESOURCE.RESOURCE_NAME[2]
		) {
			resourceTexture = 'resLarge';
		}

		this.setTexture(resourceTexture);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
	public update(_newResourceLiteral: any) {}
}
