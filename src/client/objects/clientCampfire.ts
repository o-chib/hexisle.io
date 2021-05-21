import { Constant } from '../../shared/constants';
import { ClientGameObjectConstainer } from './clientGameObjectContainer';
import { ClientStructure } from './clientStructure';

export class ClientCampfire extends ClientGameObjectConstainer {
	constructor(scene: Phaser.Scene) {
		super();
		this.children.push(new ClientCampfireSprite(scene));
	}
}

class ClientCampfireSprite extends ClientStructure {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public create(_campfireLiteral: any) {
		this.setTexture('campfire');
		this.setDepth(1);
	}

	public update(campfireLiteral: any) {
		this.handleCampfireAnimation(
			Constant.TEAM.NONE != campfireLiteral.teamNumber
		);
	}

	private handleCampfireAnimation(isLit: boolean) {
		if (!this.anims.get('campfire_lit')) {
			this.anims.create({
				key: 'campfire_lit',
				frames: this.anims.generateFrameNames('campfire', {
					start: 1,
					end: 4,
				}),
				frameRate: 5,
				repeat: -1,
			});
		}
		if (!this.anims.get('campfire_unlit')) {
			this.anims.create({
				key: 'campfire_unlit',
				frames: this.anims.generateFrameNames('campfire', {
					start: 0,
					end: 0,
				}),
				frameRate: 1,
				repeat: -1,
			});
		}

		if (isLit) {
			if (
				this.anims.getName() == 'campfire_unlit' ||
				this.anims.getName() == ''
			) {
				this.anims.stop();
				this.anims.play('campfire_lit', true);
			}
		} else {
			if (
				this.anims.getName() == 'campfire_lit' ||
				this.anims.getName() == ''
			) {
				this.anims.stop();
				this.anims.play('campfire_unlit', true);
			}
		}
	}
}
